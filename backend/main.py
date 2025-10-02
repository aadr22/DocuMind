from fastapi import FastAPI, File, UploadFile, HTTPException, Form, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import os
import tempfile
import shutil
from typing import Optional
import logging
import asyncio
from datetime import timedelta
from dotenv import load_dotenv

# Load environment variables
load_dotenv('env.local')

# Import our new services
from services.model_manager import ModelManager
from services.file_validation_service import FileValidationService
from services.document_processing_service import DocumentProcessingService

# Import Firebase storage utility (storage functionality disabled)
from utils.firebase_storage import FirebaseStorageManager

# Import real-time processor
from utils.realtime_processor import realtime_processor

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="DocuMind AI API",
    description="AI-powered document reading and analysis service",
    version="1.0.0"
)

# Configure CORS for frontend integration with environment-based origins
# Get allowed origins from environment variable, with secure defaults
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "")
if allowed_origins_env:
    # Production: use comma-separated list from environment variable
    allowed_origins = [origin.strip() for origin in allowed_origins_env.split(",") if origin.strip()]
else:
    # Development fallback: allow localhost only
    allowed_origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

logger.info(f"CORS configured with origins: {allowed_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "Accept"],
)

# Initialize services using dependency injection
try:
    # Initialize model manager
    model_manager = ModelManager()
    logger.info("Model manager initialized successfully")
    
    # Initialize file validation service
    file_validation_service = FileValidationService()
    logger.info("File validation service initialized successfully")

    # Initialize Firebase Storage
    firebase_storage = FirebaseStorageManager()
    if firebase_storage.is_initialized():
        logger.info("Firebase Storage initialized successfully")
    else:
        logger.warning("Firebase Storage not available - files will not be stored")
    
    # Initialize document processing service with dependencies
    document_processing_service = DocumentProcessingService(
        document_detector=model_manager.get_document_detector(),
        text_extractor=model_manager.get_text_extractor(),
        llm_processor=model_manager.get_llm_processor(),
        pdf_processor=model_manager.get_pdf_processor(),
        storage_manager=firebase_storage
    )
    logger.info("Document processing service initialized successfully")
    
except Exception as e:
    logger.error(f"Error initializing services: {e}")
    model_manager = None
    file_validation_service = None
    firebase_storage = None
    document_processing_service = None

# Pydantic models for request/response
class QuestionRequest(BaseModel):
    question: str
    extracted_text: str

class ProcessDocumentResponse(BaseModel):
    extracted_text: str
    summary: str
    file_url: str = ""  # File storage disabled
    success: bool
    message: str
    process_id: str = ""
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
    if not model_manager:
        return {
            "message": "DocuMind AI API is running but services not initialized",
            "status": "degraded",
            "models_loaded": False
        }
    
    return {
        "message": "DocuMind AI API is running",
        "status": "healthy" if model_manager.are_all_models_loaded() else "degraded",
        "models_loaded": model_manager.are_all_models_loaded()
    }

async def process_document_background(process_id: str, file_content: bytes, filename: str, user_id: str = "anonymous"):
    """Background task to process document asynchronously"""
    if not document_processing_service:
        realtime_processor.add_error(process_id, "Document processing service not available")
        return
    
    try:
        # Validate file first
        temp_file_path = None
        try:
            # Save uploaded file to temporary location for validation
            file_ext = os.path.splitext(filename.lower())[1]
            temp_file_path = tempfile.mktemp(suffix=file_ext)
            with open(temp_file_path, "wb") as buffer:
                buffer.write(file_content)
            
            # Validate file
            is_valid, error_message = file_validation_service.validate_file(
                temp_file_path, filename, len(file_content)
            )
            
            if not is_valid:
                realtime_processor.add_error(process_id, error_message)
                return
            
            realtime_processor.update_progress(process_id, 10, "File validation completed")
        
        except Exception as e:
            realtime_processor.add_error(process_id, f"File validation failed: {str(e)}")
            return
        
        # Process document using the service
        # Use provided user_id from request
        result = await document_processing_service.process_document(
            process_id, file_content, filename, user_id
        )
        
        # Update real-time processor with result
        if result.get('success'):
            realtime_processor.complete_process(process_id, result)
        else:
            realtime_processor.add_error(process_id, result.get('message', 'Processing failed'))
        
    except Exception as e:
        logger.error(f"Error processing document: {e}")
        realtime_processor.add_error(process_id, f"Processing error: {str(e)}")
    
    finally:
        # Clean up temporary files
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.remove(temp_file_path)
                logger.info("Temporary files cleaned up")
            except Exception as e:
                logger.warning(f"Error cleaning up temporary files: {e}")

@app.post("/process-document", response_model=ProcessDocumentResponse)
async def process_document(
    background_tasks: BackgroundTasks, 
    file: UploadFile = File(...),
    user_id: str = Form(default="anonymous")
):
    """
    Process uploaded document (PDF/JPG/PNG) to extract text and generate summary
    """
    if not document_processing_service:
        raise HTTPException(status_code=500, detail="Document processing service not initialized")
    
    # Log the received user_id for debugging
    logger.info(f"Processing document for user_id: {user_id}")
    
    # Create real-time process tracking
    process_id = realtime_processor.create_process(file.filename, file.size)
    
    # Read file content
    file_content = await file.read()
    
    # Add background task for processing with user_id
    background_tasks.add_task(
        process_document_background, 
        process_id, 
        file_content, 
        file.filename,
        user_id
    )
    
    # Return process ID immediately for real-time tracking
    return ProcessDocumentResponse(
        extracted_text="",
        summary="",
        file_url="",
        success=False,
        message="Processing started",
        process_id=process_id
    )

@app.post("/ask-question", response_model=QuestionResponse)
async def ask_question(request: QuestionRequest):
    """
    Ask a question about extracted text and get AI-generated answer
    """
    if not model_manager or not model_manager.get_llm_processor():
        raise HTTPException(status_code=500, detail="LLM model not initialized")
    
    try:
        # Validate input
        if not request.question.strip():
            raise HTTPException(status_code=400, detail="Question cannot be empty")
        
        if not request.extracted_text.strip():
            raise HTTPException(status_code=400, detail="Extracted text cannot be empty")
        
        # Generate answer using LLM
        llm_processor = model_manager.get_llm_processor()
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
    if not model_manager:
        return {
            "status": "unhealthy",
            "models": {},
            "firebase_storage": firebase_storage.is_initialized() if firebase_storage else False,
            "services": {
                "model_manager": False,
                "file_validation_service": False,
                "document_processing_service": False
            },
            "timestamp": "2024-01-01T00:00:00Z"
        }
    
    model_status = model_manager.get_model_status()
    
    return {
        "status": "healthy" if all(model_status.values()) else "degraded",
        "models": model_status,
        "firebase_storage": firebase_storage.is_initialized() if firebase_storage else False,
        "services": {
            "model_manager": model_manager is not None,
            "file_validation_service": file_validation_service is not None,
            "document_processing_service": document_processing_service is not None
        },
        "timestamp": "2024-01-01T00:00:00Z"  # You can add actual timestamp logic
    }

@app.get("/process-status/{process_id}")
async def get_process_status(process_id: str):
    """Get real-time status of document processing"""
    status = realtime_processor.get_process_status(process_id)
    if not status:
        raise HTTPException(status_code=404, detail="Process not found")
    return status

@app.get("/active-processes")
async def get_active_processes():
    """Get all active processing sessions (for admin/monitoring)"""
    return {
        "active_count": len(realtime_processor.get_all_processes()),
        "processes": realtime_processor.get_all_processes()
    }

@app.get("/supported-formats")
async def get_supported_formats():
    """Get supported file formats and size limits"""
    if not file_validation_service:
        raise HTTPException(status_code=500, detail="File validation service not initialized")
    
    return {
        "supported_extensions": file_validation_service.get_supported_extensions(),
        "max_file_size_bytes": file_validation_service.get_max_file_size(),
        "max_file_size_mb": file_validation_service.get_max_file_size_mb()
    }

@app.delete("/documents/{document_path:path}")
async def delete_document(document_path: str):
    """Delete a document from Firebase Storage"""
    if not firebase_storage or not firebase_storage.is_initialized():
        raise HTTPException(status_code=503, detail="Firebase Storage not available")
    
    try:
        # Get the blob
        bucket = firebase_storage.bucket
        blob = bucket.blob(document_path)
        
        # Check if blob exists
        if not blob.exists():
            raise HTTPException(status_code=404, detail="Document not found")
        
        # Delete the blob
        blob.delete()
        
        logger.info(f"Document deleted: {document_path}")
        
        return {
            "success": True,
            "message": "Document deleted successfully",
            "document_path": document_path
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting document {document_path}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete document: {str(e)}")

@app.get("/documents/{user_id}")
async def get_user_documents(user_id: str):
    """Get all documents for a user from Firebase Storage"""
    if not firebase_storage or not firebase_storage.is_initialized():
        raise HTTPException(status_code=503, detail="Firebase Storage not available")
    
    try:
        # List all documents for the user
        documents = []
        bucket = firebase_storage.bucket
        prefix = f"documents/{user_id}/"
        
        blobs = bucket.list_blobs(prefix=prefix)
        for blob in blobs:
            # Skip directories and get file info
            if not blob.name.endswith('/'):
                # Generate a signed URL for viewing/download (with inline content disposition)
                # Use response_disposition='inline' for viewable files
                file_ext = os.path.splitext(blob.name)[1].lower()
                viewable_extensions = ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.txt']
                
                if file_ext in viewable_extensions:
                    # Generate URL for inline viewing
                    download_url = blob.generate_signed_url(
                        version="v4", 
                        expiration=timedelta(days=7), 
                        method="GET",
                        response_disposition='inline'
                    )
                else:
                    # Generate URL for download
                    download_url = blob.generate_signed_url(
                        version="v4", 
                        expiration=timedelta(days=7), 
                        method="GET"
                    )
                
                # Extract file info from the blob name
                file_parts = blob.name.split('/')
                filename = file_parts[-1]
                
                # Remove timestamp suffix if present
                if '_' in filename and len(filename.split('_')[-1]) == 14:  # YYYYMMDDHHMMSS format
                    original_name = '_'.join(filename.split('_')[:-1]) + '.' + filename.split('.')[-1]
                else:
                    original_name = filename
                
                documents.append({
                    "id": blob.name,
                    "fileName": filename,
                    "originalName": original_name,
                    "fileSize": blob.size,
                    "fileType": filename.split('.')[-1] if '.' in filename else '',
                    "mimeType": blob.content_type or 'application/octet-stream',
                    "storagePath": blob.name,
                    "downloadURL": download_url,
                    "uploadedAt": blob.time_created.isoformat() if blob.time_created else None,
                    "lastModified": blob.updated.isoformat() if blob.updated else None,
                    "category": "General",
                    "processingStatus": "completed",
                    "aiAnalysis": {
                        "summary": "Document processed successfully",
                        "keywords": ["processed", "documind"],
                        "sentiment": "neutral",
                        "confidence": 0.9
                    }
                })
        
        return {
            "documents": documents,
            "total": len(documents),
            "user_id": user_id
        }
        
    except Exception as e:
        logger.error(f"Error fetching documents for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch documents: {str(e)}")

@app.get("/ocr-status")
async def get_ocr_status():
    """Get status of OCR engines"""
    if not model_manager or not model_manager.get_text_extractor():
        return {"ocr_engines": {}, "status": "not_available"}
    
    # This would need to be updated in the EnhancedVisionModel to use the new OCR strategies
    return {"ocr_engines": {"status": "legacy_implementation"}, "note": "Update to use new OCR strategies"}

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
