"""
Document Processing Pipeline using Chain of Responsibility Pattern
Allows for easy addition of new processing steps without modifying existing code
"""
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List
import logging
import os

logger = logging.getLogger(__name__)

class ProcessingStep(ABC):
    """Abstract base class for processing steps"""
    
    def __init__(self):
        self.next_step: Optional['ProcessingStep'] = None
    
    def set_next(self, step: 'ProcessingStep') -> 'ProcessingStep':
        """Set the next step in the chain"""
        self.next_step = step
        return step
    
    @abstractmethod
    def can_process(self, file_type: str, file_path: str) -> bool:
        """Check if this step can process the given file"""
        pass
    
    @abstractmethod
    def process(self, file_path: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Process the file and return updated context"""
        pass
    
    def execute(self, file_path: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute this step and pass to next if applicable"""
        try:
            # Process the file
            result = self.process(file_path, context)
            context.update(result)
            
            # Pass to next step if available
            if self.next_step:
                return self.next_step.execute(file_path, context)
            else:
                return context
                
        except Exception as e:
            logger.error(f"Error in processing step {self.__class__.__name__}: {e}")
            context['error'] = str(e)
            return context

class DocumentDetectionStep(ProcessingStep):
    """Step for detecting document boundaries in images"""
    
    def __init__(self, document_detector):
        super().__init__()
        self.document_detector = document_detector
    
    def can_process(self, file_type: str, file_path: str) -> bool:
        """Can process image files"""
        return file_type in ['.jpg', '.jpeg', '.png']
    
    def process(self, file_path: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Detect document boundaries"""
        try:
            logger.info("Detecting document boundaries...")
            cropped_path = self.document_detector.detect_document(file_path)
            
            if cropped_path:
                logger.info("Document detected and cropped successfully")
                return {
                    'processing_path': cropped_path,
                    'document_detected': True,
                    'cropped_file_path': cropped_path
                }
            else:
                logger.info("Document detection failed, using original image")
                return {
                    'processing_path': file_path,
                    'document_detected': False,
                    'cropped_file_path': None
                }
                
        except Exception as e:
            logger.warning(f"Document detection failed: {e}")
            return {
                'processing_path': file_path,
                'document_detected': False,
                'cropped_file_path': None,
                'detection_error': str(e)
            }

class TextExtractionStep(ProcessingStep):
    """Step for extracting text from documents"""
    
    def __init__(self, text_extractor, pdf_processor):
        super().__init__()
        self.text_extractor = text_extractor
        self.pdf_processor = pdf_processor
    
    def can_process(self, file_type: str, file_path: str) -> bool:
        """Can process all supported file types"""
        return file_type in ['.pdf', '.jpg', '.jpeg', '.png']
    
    def process(self, file_path: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Extract text from document"""
        try:
            file_type = context.get('file_type', '')
            processing_path = context.get('processing_path', file_path)
            
            if file_type == '.pdf':
                logger.info("Extracting text from PDF...")
                extracted_text = self.pdf_processor.extract_text(processing_path)
                method = 'pdf_processor'
                confidence = 1.0
            else:
                logger.info("Extracting text from image...")
                vision_result = self.text_extractor.extract_text_from_image(processing_path)
                extracted_text = vision_result['text']
                method = vision_result.get('method', 'unknown')
                confidence = vision_result.get('confidence', 0.0)
                
                # Store additional metadata for images
                context['image_description'] = vision_result.get('image_description', '')
            
            if not extracted_text or extracted_text.startswith("Error"):
                return {
                    'extracted_text': '',
                    'extraction_success': False,
                    'extraction_error': 'Failed to extract text'
                }
            
            return {
                'extracted_text': extracted_text,
                'extraction_success': True,
                'extraction_method': method,
                'extraction_confidence': confidence
            }
            
        except Exception as e:
            logger.error(f"Text extraction failed: {e}")
            return {
                'extracted_text': '',
                'extraction_success': False,
                'extraction_error': str(e)
            }

class SummaryGenerationStep(ProcessingStep):
    """Step for generating AI summaries"""
    
    def __init__(self, llm_processor):
        super().__init__()
        self.llm_processor = llm_processor
    
    def can_process(self, file_type: str, file_path: str) -> bool:
        """Can process any file that has extracted text"""
        return True  # This step depends on previous steps, not file type
    
    def process(self, file_path: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Generate AI summary"""
        try:
            extracted_text = context.get('extracted_text', '')
            
            if not extracted_text:
                return {
                    'summary': '',
                    'summary_success': False,
                    'summary_error': 'No text to summarize'
                }
            
            logger.info("Generating AI summary...")
            summary = self.llm_processor.summarize_text(extracted_text)
            
            if summary.startswith("Error"):
                return {
                    'summary': '',
                    'summary_success': False,
                    'summary_error': 'Summary generation failed'
                }
            
            return {
                'summary': summary,
                'summary_success': True
            }
            
        except Exception as e:
            logger.error(f"Summary generation failed: {e}")
            return {
                'summary': '',
                'summary_success': False,
                'summary_error': str(e)
            }

class StorageUploadStep(ProcessingStep):
    """Step for file storage (disabled)"""
    
    def __init__(self, storage_manager=None):
        super().__init__()
        self.storage_manager = None  # Storage disabled
    
    def can_process(self, file_type: str, file_path: str) -> bool:
        """Can process any file type"""
        return True
    
    def process(self, file_path: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """File storage functionality removed"""
        logger.info("File storage functionality has been removed")
        return {
            'file_url': '',
            'upload_success': False,
            'upload_skipped': True,
            'upload_disabled': True
        }

class DocumentProcessingPipeline:
    """Main pipeline that orchestrates all processing steps"""
    
    def __init__(
        self,
        document_detector,
        text_extractor,
        llm_processor,
        pdf_processor,
        storage_manager=None
    ):
        # Create processing steps
        self.detection_step = DocumentDetectionStep(document_detector)
        self.extraction_step = TextExtractionStep(text_extractor, pdf_processor)
        self.summary_step = SummaryGenerationStep(llm_processor)
        self.upload_step = StorageUploadStep()  # Storage disabled
        
        # Build the chain
        self.detection_step.set_next(self.extraction_step)
        self.extraction_step.set_next(self.summary_step)
        self.summary_step.set_next(self.upload_step)
    
    def process_document(
        self, 
        file_path: str, 
        filename: str, 
        process_id: str
    ) -> Dict[str, Any]:
        """Process document through the complete pipeline"""
        # Initialize context
        context = {
            'process_id': process_id,
            'original_filename': filename,
            'file_type': os.path.splitext(filename.lower())[1],
            'processing_path': file_path,
            'start_time': process_id  # We'll use this for timing
        }
        
        # Execute the pipeline
        result = self.detection_step.execute(file_path, context)
        
        # Add final metadata
        result['success'] = (
            result.get('extraction_success', False) and
            result.get('summary_success', False)
        )
        
        if result['success']:
            result['message'] = "Document processed successfully"
        else:
            result['message'] = "Document processing failed"
        
        return result
    
    def get_pipeline_status(self) -> Dict[str, bool]:
        """Get status of all pipeline components"""
        return {
            'detection_step': self.detection_step is not None,
            'extraction_step': self.extraction_step is not None,
            'summary_step': self.summary_step is not None,
            'upload_step': self.upload_step is not None
        }
