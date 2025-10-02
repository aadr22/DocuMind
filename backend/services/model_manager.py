"""
Model Manager Service
Responsible for initializing, managing, and providing access to AI models
"""
import logging
from typing import Optional, Dict, Any
from models.cv_model import DocumentDetector
from models.enhanced_vision_model import EnhancedVisionModel
from models.llm_model import LLMProcessor
from models.pdf_model import PDFProcessor

logger = logging.getLogger(__name__)

class ModelManager:
    """Manages the lifecycle of all AI models in the system"""
    
    def __init__(self):
        self.models: Dict[str, Any] = {}
        self._initialize_models()
    
    def _initialize_models(self):
        """Initialize all required AI models"""
        try:
            # Initialize Computer Vision model
            self.models['document_detector'] = DocumentDetector()
            logger.info("Document detector initialized successfully")
            
            # Initialize Enhanced Vision model for OCR
            self.models['text_extractor'] = EnhancedVisionModel()
            logger.info("Enhanced vision model initialized successfully")
            
            # Initialize LLM processor
            self.models['llm_processor'] = LLMProcessor()
            logger.info("LLM processor initialized successfully")
            
            # Initialize PDF processor
            self.models['pdf_processor'] = PDFProcessor()
            logger.info("PDF processor initialized successfully")
            
        except Exception as e:
            logger.error(f"Error initializing models: {e}")
            # Set failed models to None
            if 'document_detector' not in self.models:
                self.models['document_detector'] = None
            if 'text_extractor' not in self.models:
                self.models['text_extractor'] = None
            if 'llm_processor' not in self.models:
                self.models['llm_processor'] = None
            if 'pdf_processor' not in self.models:
                self.models['pdf_processor'] = None
    
    def get_model(self, model_name: str) -> Optional[Any]:
        """Get a specific model by name"""
        return self.models.get(model_name)
    
    def get_document_detector(self) -> Optional[DocumentDetector]:
        """Get the document detector model"""
        return self.models.get('document_detector')
    
    def get_text_extractor(self) -> Optional[EnhancedVisionModel]:
        """Get the text extraction model"""
        return self.models.get('text_extractor')
    
    def get_llm_processor(self) -> Optional[LLMProcessor]:
        """Get the LLM processor model"""
        return self.models.get('llm_processor')
    
    def get_pdf_processor(self) -> Optional[PDFProcessor]:
        """Get the PDF processor model"""
        return self.models.get('pdf_processor')
    
    def are_all_models_loaded(self) -> bool:
        """Check if all required models are loaded"""
        return all(model is not None for model in self.models.values())
    
    def get_model_status(self) -> Dict[str, bool]:
        """Get the status of all models"""
        return {
            'document_detector': self.models.get('document_detector') is not None,
            'text_extractor': self.models.get('text_extractor') is not None,
            'llm_processor': self.models.get('llm_processor') is not None,
            'pdf_processor': self.models.get('pdf_processor') is not None,
            'storage': False  # Storage functionality removed
        }
    
    def reload_model(self, model_name: str) -> bool:
        """Attempt to reload a specific model"""
        try:
            if model_name == 'document_detector':
                self.models['document_detector'] = DocumentDetector()
            elif model_name == 'text_extractor':
                self.models['text_extractor'] = EnhancedVisionModel()
            elif model_name == 'llm_processor':
                self.models['llm_processor'] = LLMProcessor()
            elif model_name == 'pdf_processor':
                self.models['pdf_processor'] = PDFProcessor()
            else:
                logger.warning(f"Unknown model: {model_name}")
                return False
            
            logger.info(f"Model {model_name} reloaded successfully")
            return True
            
        except Exception as e:
            logger.error(f"Error reloading model {model_name}: {e}")
            return False
