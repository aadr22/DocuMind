from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import os
import tempfile
import shutil
from typing import Optional
import logging

# Import our custom models
from models.cv_model import DocumentDetector
from models.enhanced_vision_model import EnhancedVisionModel
from models.llm_model import LLMProcessor
from models.pdf_model import PDFProcessor

# Import Firebase storage utility
from utils.firebase_storage import FirebaseStorageManager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="DocuMind AI API",
    description="AI-powered document reading and analysis service",
    version="1.0.0"
)

# Configure CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this to your Vercel domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize models
try:
    document_detector = DocumentDetector()
    text_extractor = EnhancedVisionModel() # Changed to EnhancedVisionModel
    llm_processor = LLMProcessor()
    pdf_processor = PDFProcessor() # Added PDFProcessor initialization
    logger.info("All models initialized successfully")
except Exception as e:
    logger.error(f"Error initializing models: {e}")
    document_detector = None
    text_extractor = None
    llm_processor = None
    pdf_processor = None # Added PDFProcessor to None

# Initialize Firebase Storage
try:
    firebase_storage = FirebaseStorageManager()
    if firebase_storage.is_initialized():
        logger.info("Firebase Storage initialized successfully")
    else:
        logger.warning("Firebase Storage initialization failed")
except Exception as e:
    logger.error(f"Error initializing Firebase Storage: {e}")
    firebase_storage = None

# Pydantic models for request/response
class QuestionRequest(BaseModel):
    question: str
    extracted_text: str

class ProcessDocumentResponse(BaseModel):
    extracted_text: str
    summary: str
    file_url: str
    success: bool
    message: str
    image_description: str = ""
    processing_method: str = ""
    confidence: float = 0.0

class QuestionResponse(BaseModel):
    answer: str
    success: bool
    message: str

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "DocuMind AI API is running",
        "status": "healthy",
        "models_loaded": all([document_detector, text_extractor, llm_processor])
    }

@app.post("/process-document", response_model=ProcessDocumentResponse)
async def process_document(file: UploadFile = File(...)):
    """
    Process uploaded document (PDF/JPG/PNG) to extract text and generate summary
    """
    if not all([document_detector, text_extractor, llm_processor]):
        raise HTTPException(status_code=500, detail="One or more models not initialized")
    
    # Check if Firebase Storage is available
    if not firebase_storage or not firebase_storage.is_initialized():
        logger.warning("Firebase Storage not available, proceeding without file upload")
    
    # Validate file type
    allowed_extensions = {'.pdf', '.jpg', '.jpeg', '.png'}
    file_ext = os.path.splitext(file.filename.lower())[1]
    
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400, 
            detail=f"Unsupported file type. Allowed: {', '.join(allowed_extensions)}"
        )
    
    temp_file_path = None
    cropped_file_path = None
    
    try:
        # Save uploaded file to temporary location
        temp_file_path = tempfile.mktemp(suffix=file_ext)
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        logger.info(f"File saved to temporary location: {temp_file_path}")
        
        # For image files, optionally detect and crop document
        if file_ext in {'.jpg', '.jpeg', '.png'}:
            try:
                cropped_file_path = document_detector.detect_document(temp_file_path)
                if cropped_file_path:
                    logger.info("Document detected and cropped successfully")
                    processing_path = cropped_file_path
                else:
                    logger.info("Document detection failed, using original image")
                    processing_path = temp_file_path
            except Exception as e:
                logger.warning(f"Document detection failed: {e}, using original image")
                processing_path = temp_file_path
        else:
            # For PDFs, use original file (OCR will handle PDF processing)
            processing_path = temp_file_path
        
        # Extract text using appropriate processor
        if file_ext == '.pdf':
            # Use PDF processor for PDF files
            extracted_text = pdf_processor.extract_text(processing_path)
        else:
            # Use enhanced vision model for image files
            vision_result = text_extractor.extract_text_from_image(processing_path)
            extracted_text = vision_result['text']
            
            # Log which method was used and what was extracted
            if extracted_text:
                logger.info(f"Image processed using {vision_result['method']} with confidence: {vision_result['confidence']:.2f}")
                
                # Log image description if available
                if vision_result.get('image_description'):
                    logger.info(f"Image description: {vision_result['image_description'][:200]}...")
                
                # Log text length
                logger.info(f"Extracted text length: {len(extracted_text)} characters")
            else:
                logger.warning("No text extracted from image")
                
                # Even if no text, log the image description
                if vision_result.get('image_description'):
                    logger.info(f"Image description available: {vision_result['image_description'][:200]}...")
                    # Use description as text if no OCR text was found
                    extracted_text = f"Image Description: {vision_result['image_description']}"
                    logger.info("Using image description as text content")
        
        if not extracted_text or extracted_text.startswith("Error"):
            return ProcessDocumentResponse(
                extracted_text="",
                summary="",
                file_url="",
                success=False,
                message="Failed to extract text from document"
            )
        
        # Generate summary using LLM
        summary = llm_processor.summarize_text(extracted_text)
        
        if summary.startswith("Error"):
            return ProcessDocumentResponse(
                extracted_text=extracted_text,
                summary="",
                file_url="",
                success=False,
                message="Text extracted but summary generation failed"
            )
        
        # Upload file to Firebase Storage
        file_url = ""
        if firebase_storage and firebase_storage.is_initialized():
            try:
                # Upload the original file to Firebase Storage
                file_url = firebase_storage.upload_file(
                    file_path=temp_file_path,
                    original_filename=file.filename,
                    folder="documents"
                )
                if not file_url:
                    logger.warning("Failed to upload file to Firebase Storage")
                    file_url = ""
            except Exception as e:
                logger.error(f"Error uploading file to Firebase Storage: {e}")
                file_url = ""
        else:
            logger.info("Firebase Storage not available, skipping file upload")
        
        # Return the processed document
        return ProcessDocumentResponse(
            extracted_text=extracted_text,
            summary=summary,
            file_url=file_url,
            success=True,
            message="Document processed successfully",
            image_description=vision_result.get('image_description', '') if file_ext != '.pdf' else '',
            processing_method=vision_result.get('method', '') if file_ext != '.pdf' else 'pdf_processor',
            confidence=vision_result.get('confidence', 0.0) if file_ext != '.pdf' else 1.0
        )
        
    except Exception as e:
        logger.error(f"Error processing document: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing document: {str(e)}")
    
    finally:
        # Clean up temporary files
        temp_files_to_clean = [temp_file_path, cropped_file_path]
        temp_files_to_clean = [f for f in temp_files_to_clean if f and os.path.exists(f)]
        
        if temp_files_to_clean:
            document_detector.cleanup_temp_files(temp_files_to_clean)
            logger.info("Temporary files cleaned up")

@app.post("/ask-question", response_model=QuestionResponse)
async def ask_question(request: QuestionRequest):
    """
    Ask a question about extracted text and get AI-generated answer
    """
    if not llm_processor:
        raise HTTPException(status_code=500, detail="LLM model not initialized")
    
    try:
        # Validate input
        if not request.question.strip():
            raise HTTPException(status_code=400, detail="Question cannot be empty")
        
        if not request.extracted_text.strip():
            raise HTTPException(status_code=400, detail="Extracted text cannot be empty")
        
        # Generate answer using LLM
        answer = llm_processor.answer_question(
            question=request.question,
            context=request.extracted_text
        )
        
        if answer.startswith("Error"):
            return QuestionResponse(
                answer="",
                success=False,
                message="Failed to generate answer"
            )
        
        return QuestionResponse(
            answer=answer,
            success=True,
            message="Question answered successfully"
        )
        
    except Exception as e:
        logger.error(f"Error answering question: {e}")
        raise HTTPException(status_code=500, detail=f"Error answering question: {str(e)}")

@app.get("/health")
async def health_check():
    """Detailed health check endpoint"""
    model_status = {
        "document_detector": document_detector is not None,
        "text_extractor": text_extractor is not None,
        "llm_processor": llm_processor is not None
    }
    
    return {
        "status": "healthy" if all(model_status.values()) else "degraded",
        "models": model_status,
        "firebase_storage": firebase_storage.is_initialized() if firebase_storage else False,
        "timestamp": "2024-01-01T00:00:00Z"  # You can add actual timestamp logic
    }

# Error handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail, "success": False}
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "success": False}
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
