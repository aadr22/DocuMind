"""
Document Processing Service
Responsible for orchestrating the document processing pipeline
"""
import os
import tempfile
import shutil
import asyncio
import logging
from typing import Dict, Any, Optional, Tuple
from datetime import datetime

from models.cv_model import DocumentDetector
from models.enhanced_vision_model import EnhancedVisionModel
from models.llm_model import LLMProcessor
from models.pdf_model import PDFProcessor
from utils.realtime_processor import realtime_processor
from utils.firebase_storage import FirebaseStorageManager

logger = logging.getLogger(__name__)

class DocumentProcessingService:
    """Orchestrates the document processing pipeline"""
    
    def __init__(
        self,
        document_detector: DocumentDetector,
        text_extractor: EnhancedVisionModel,
        llm_processor: LLMProcessor,
        pdf_processor: PDFProcessor,
        storage_manager: Optional[FirebaseStorageManager] = None
    ):
        self.document_detector = document_detector
        self.text_extractor = text_extractor
        self.llm_processor = llm_processor
        self.pdf_processor = pdf_processor
        self.storage_manager = storage_manager
    
    async def process_document(
        self, 
        process_id: str, 
        file_content: bytes, 
        filename: str,
        user_id: str = "anonymous"
    ) -> Dict[str, Any]:
        """
        Process a document through the complete pipeline
        
        Args:
            process_id: Unique process identifier
            file_content: File content as bytes
            filename: Original filename
            
        Returns:
            Processing result dictionary
        """
        temp_file_path = None
        cropped_file_path = None
        
        try:
            # Update progress - Starting
            realtime_processor.update_progress(process_id, 5, "Starting document processing...")
            await asyncio.sleep(0.5)
            
            # Save uploaded file to temporary location
            temp_file_path = self._save_temp_file(file_content, filename)
            realtime_processor.update_progress(process_id, 15, "File saved to temporary location")
            
            # Detect document boundaries for images
            processing_path = await self._detect_document_boundaries(
                process_id, temp_file_path, filename
            )
            
            # Extract text based on file type
            extracted_text = await self._extract_text(
                process_id, processing_path, filename
            )
            
            if not extracted_text or extracted_text.startswith("Error"):
                realtime_processor.add_error(process_id, "Failed to extract text from document")
                return self._create_error_result(process_id, "Text extraction failed")
            
            # Generate AI summary
            summary = await self._generate_summary(process_id, extracted_text)
            
            if summary.startswith("Error"):
                realtime_processor.add_error(process_id, "Summary generation failed")
                return self._create_error_result(process_id, "Summary generation failed")
            
            # Store file if storage is available
            file_url = ""
            if self.storage_manager and self.storage_manager.is_initialized():
                realtime_processor.update_progress(process_id, 80, "Storing file in cloud storage...")
                storage_result = self.storage_manager.upload_file_from_bytes(
                    file_content, filename, user_id, "documents"
                )
                if storage_result:
                    file_url = storage_result['download_url']
                    realtime_processor.update_progress(process_id, 90, "File stored successfully")
                else:
                    realtime_processor.add_warning(process_id, "File storage failed, but processing completed")
            else:
                realtime_processor.add_warning(process_id, "File storage not available")
            
            # Create success result
            result = self._create_success_result(
                process_id, extracted_text, summary, filename, file_url
            )
            
            realtime_processor.complete_process(process_id, result)
            return result
            
        except Exception as e:
            logger.error(f"Error processing document: {e}")
            realtime_processor.add_error(process_id, f"Processing error: {str(e)}")
            return self._create_error_result(process_id, str(e))
            
        finally:
            # Clean up temporary files
            self._cleanup_temp_files([temp_file_path, cropped_file_path])
    
    def _save_temp_file(self, file_content: bytes, filename: str) -> str:
        """Save uploaded file to temporary location"""
        file_ext = os.path.splitext(filename.lower())[1]
        temp_file_path = tempfile.mktemp(suffix=file_ext)
        
        with open(temp_file_path, "wb") as buffer:
            buffer.write(file_content)
        
        logger.info(f"File saved to temporary location: {temp_file_path}")
        return temp_file_path
    
    async def _detect_document_boundaries(
        self, 
        process_id: str, 
        temp_file_path: str, 
        filename: str
    ) -> str:
        """Detect and crop document boundaries for image files"""
        file_ext = os.path.splitext(filename.lower())[1]
        
        if file_ext not in {'.jpg', '.jpeg', '.png'}:
            realtime_processor.update_progress(process_id, 30, "PDF file ready for processing")
            return temp_file_path
        
        try:
            realtime_processor.update_progress(process_id, 25, "Detecting document boundaries...")
            
            cropped_file_path = self.document_detector.detect_document(temp_file_path)
            
            if cropped_file_path:
                logger.info("Document detected and cropped successfully")
                realtime_processor.update_progress(process_id, 35, "Document detection completed")
                return cropped_file_path
            else:
                logger.info("Document detection failed, using original image")
                realtime_processor.add_warning(process_id, "Document detection failed, using original image")
                return temp_file_path
                
        except Exception as e:
            logger.warning(f"Document detection failed: {e}, using original image")
            realtime_processor.add_warning(process_id, f"Document detection error: {str(e)}")
            return temp_file_path
    
    async def _extract_text(
        self, 
        process_id: str, 
        processing_path: str, 
        filename: str
    ) -> str:
        """Extract text from document based on file type"""
        file_ext = os.path.splitext(filename.lower())[1]
        
        if file_ext == '.pdf':
            realtime_processor.update_progress(process_id, 45, "Extracting text from PDF...")
            extracted_text = self.pdf_processor.extract_text(processing_path)
            realtime_processor.update_progress(process_id, 55, "PDF text extraction completed")
        else:
            realtime_processor.update_progress(process_id, 40, "Extracting text from image...")
            vision_result = self.text_extractor.extract_text_from_image(processing_path)
            extracted_text = vision_result['text']
            realtime_processor.update_progress(process_id, 50, "Image text extraction completed")
            
            # Log processing details
            if extracted_text:
                logger.info(f"Image processed using {vision_result['method']} with confidence: {vision_result['confidence']:.2f}")
                
                if vision_result.get('image_description'):
                    logger.info(f"Image description: {vision_result['image_description'][:200]}...")
                
                logger.info(f"Extracted text length: {len(extracted_text)} characters")
            else:
                logger.warning("No text extracted from image")
                
                # Use description as text if no OCR text was found
                if vision_result.get('image_description'):
                    extracted_text = f"Image Description: {vision_result['image_description']}"
                    logger.info("Using image description as text content")
        
        return extracted_text
    
    async def _generate_summary(self, process_id: str, extracted_text: str) -> str:
        """Generate AI summary of extracted text"""
        realtime_processor.update_progress(process_id, 65, "Generating AI summary...")
        summary = self.llm_processor.summarize_text(extracted_text)
        realtime_processor.update_progress(process_id, 75, "AI summary completed")
        return summary
    
    async def _upload_to_storage(
        self, 
        process_id: str, 
        temp_file_path: str, 
        filename: str
    ) -> str:
        """File storage functionality removed - keeping for compatibility"""
        realtime_processor.update_progress(process_id, 80, "File storage disabled")
        logger.info("File storage functionality has been removed")
        return ""
    
    def _create_success_result(
        self, 
        process_id: str, 
        extracted_text: str, 
        summary: str, 
        filename: str,
        file_url: str = ""
    ) -> Dict[str, Any]:
        """Create success result dictionary"""
        file_ext = os.path.splitext(filename.lower())[1]
        
        # Get additional metadata for images
        image_description = ""
        processing_method = ""
        confidence = 0.0
        
        if file_ext != '.pdf':
            # Get vision processing details
            vision_result = self.text_extractor.extract_text_from_image(filename)
            image_description = vision_result.get('image_description', '')
            processing_method = vision_result.get('method', '')
            confidence = vision_result.get('confidence', 0.0)
        else:
            processing_method = 'pdf_processor'
            confidence = 1.0
        
        return {
            "extracted_text": extracted_text,
            "summary": summary,
            "file_url": file_url,
            "success": True,
            "message": "Document processed successfully (no file storage)",
            "process_id": process_id,
            "image_description": image_description,
            "processing_method": processing_method,
            "confidence": confidence,
            "processed_at": datetime.now().isoformat()
        }
    
    def _create_error_result(self, process_id: str, error_message: str) -> Dict[str, Any]:
        """Create error result dictionary"""
        return {
            "extracted_text": "",
            "summary": "",
            "file_url": "",
            "success": False,
            "message": error_message,
            "process_id": process_id,
            "image_description": "",
            "processing_method": "",
            "confidence": 0.0,
            "processed_at": datetime.now().isoformat()
        }
    
    def _cleanup_temp_files(self, temp_paths: list):
        """Clean up temporary files"""
        temp_files_to_clean = [f for f in temp_paths if f and os.path.exists(f)]
        
        if temp_files_to_clean:
            try:
                for path in temp_files_to_clean:
                    if os.path.exists(path):
                        os.remove(path)
                logger.info("Temporary files cleaned up")
            except Exception as e:
                logger.warning(f"Error cleaning up temporary files: {e}")
