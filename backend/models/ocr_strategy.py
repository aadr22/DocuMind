"""
OCR Strategy Pattern Implementation
Allows for easy addition of new OCR engines without modifying existing code
"""
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

class OCRStrategy(ABC):
    """Abstract base class for OCR strategies"""
    
    @abstractmethod
    def can_process(self, image_path: str) -> bool:
        """Check if this strategy can process the given image"""
        pass
    
    @abstractmethod
    def extract_text(self, image_path: str) -> Dict[str, Any]:
        """Extract text from image using this strategy"""
        pass
    
    @abstractmethod
    def get_name(self) -> str:
        """Get the name of this OCR strategy"""
        pass
    
    @abstractmethod
    def is_available(self) -> bool:
        """Check if this strategy is available for use"""
        pass

class EasyOCRStrategy(OCRStrategy):
    """EasyOCR implementation of OCR strategy"""
    
    def __init__(self):
        self.reader = None
        self._initialize()
    
    def _initialize(self):
        """Initialize EasyOCR reader"""
        try:
            import easyocr
            self.reader = easyocr.Reader(['en'], gpu=False)
            logger.info("EasyOCR initialized successfully")
        except ImportError:
            logger.warning("EasyOCR not available")
            self.reader = None
        except Exception as e:
            logger.error(f"Error initializing EasyOCR: {e}")
            self.reader = None
    
    def can_process(self, image_path: str) -> bool:
        """EasyOCR can process most image formats"""
        return self.is_available()
    
    def extract_text(self, image_path: str) -> Dict[str, Any]:
        """Extract text using EasyOCR"""
        if not self.is_available():
            return {
                'text': '',
                'confidence': 0.0,
                'method': 'easyocr',
                'error': 'EasyOCR not available'
            }
        
        try:
            result = self.reader.readtext(image_path)
            
            if not result:
                return {
                    'text': '',
                    'confidence': 0.0,
                    'method': 'easyocr',
                    'error': 'No text detected'
                }
            
            text_parts = []
            total_confidence = 0
            count = 0
            
            for (bbox, text, confidence) in result:
                if text.strip() and confidence > 0.5:
                    text_parts.append(text)
                    total_confidence += confidence
                    count += 1
            
            if text_parts and count > 0:
                avg_confidence = total_confidence / count
                return {
                    'text': ' '.join(text_parts),
                    'confidence': avg_confidence,
                    'method': 'easyocr',
                    'error': None
                }
            else:
                return {
                    'text': '',
                    'confidence': 0.0,
                    'method': 'easyocr',
                    'error': 'No valid text found'
                }
                
        except Exception as e:
            logger.error(f"EasyOCR extraction failed: {e}")
            return {
                'text': '',
                'confidence': 0.0,
                'method': 'easyocr',
                'error': str(e)
            }
    
    def get_name(self) -> str:
        return 'easyocr'
    
    def is_available(self) -> bool:
        return self.reader is not None

class TesseractStrategy(OCRStrategy):
    """Tesseract implementation of OCR strategy"""
    
    def __init__(self):
        self.tesseract = None
        self._initialize()
    
    def _initialize(self):
        """Initialize Tesseract"""
        try:
            import pytesseract
            import subprocess
            
            # Check if tesseract is installed
            result = subprocess.run(['tesseract', '--version'], 
                                 capture_output=True, text=True, timeout=5)
            if result.returncode == 0:
                self.tesseract = pytesseract
                logger.info("Tesseract initialized successfully")
            else:
                logger.warning("Tesseract not available")
                self.tesseract = None
        except ImportError:
            logger.warning("Pytesseract not available")
            self.tesseract = None
        except Exception as e:
            logger.warning(f"Tesseract initialization failed: {e}")
            self.tesseract = None
    
    def can_process(self, image_path: str) -> bool:
        """Tesseract works best with clean, high-contrast images"""
        return self.is_available()
    
    def extract_text(self, image_path: str) -> Dict[str, Any]:
        """Extract text using Tesseract"""
        if not self.is_available():
            return {
                'text': '',
                'confidence': 0.0,
                'method': 'tesseract',
                'error': 'Tesseract not available'
            }
        
        try:
            import cv2
            import numpy as np
            
            # Preprocess image for better OCR
            image = cv2.imread(image_path)
            if image is None:
                return {
                    'text': '',
                    'confidence': 0.0,
                    'method': 'tesseract',
                    'error': 'Unable to read image'
                }
            
            # Convert to grayscale
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
            # Apply thresholding to get binary image
            _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            
            # Extract text
            text = self.tesseract.image_to_string(
                binary, 
                config='--psm 6 --oem 3'
            )
            
            if text.strip():
                clean_text = text.strip()
                if len(clean_text) > 10 and not clean_text.isupper():
                    return {
                        'text': clean_text,
                        'confidence': 0.7,  # Tesseract doesn't provide confidence scores
                        'method': 'tesseract',
                        'error': None
                    }
            
            return {
                'text': '',
                'confidence': 0.0,
                'method': 'tesseract',
                'error': 'No valid text extracted'
            }
            
        except Exception as e:
            logger.error(f"Tesseract extraction failed: {e}")
            return {
                'text': '',
                'confidence': 0.0,
                'method': 'tesseract',
                'error': str(e)
            }
    
    def get_name(self) -> str:
        return 'tesseract'
    
    def is_available(self) -> bool:
        return self.tesseract is not None

class PaddleOCRStrategy(OCRStrategy):
    """PaddleOCR implementation of OCR strategy"""
    
    def __init__(self):
        self.paddleocr = None
        self._initialize()
    
    def _initialize(self):
        """Initialize PaddleOCR"""
        try:
            import paddleocr
            self.paddleocr = paddleocr.PaddleOCR(use_angle_cls=True, lang='en')
            logger.info("PaddleOCR initialized successfully")
        except ImportError:
            logger.warning("PaddleOCR not available")
            self.paddleocr = None
        except Exception as e:
            logger.error(f"Error initializing PaddleOCR: {e}")
            self.paddleocr = None
    
    def can_process(self, image_path: str) -> bool:
        """PaddleOCR is excellent for complex layouts"""
        return self.is_available()
    
    def extract_text(self, image_path: str) -> Dict[str, Any]:
        """Extract text using PaddleOCR"""
        if not self.is_available():
            return {
                'text': '',
                'confidence': 0.0,
                'method': 'paddleocr',
                'error': 'PaddleOCR not available'
            }
        
        try:
            result = self.paddleocr.ocr(image_path, cls=True)
            
            if not result or not result[0]:
                return {
                    'text': '',
                    'confidence': 0.0,
                    'method': 'paddleocr',
                    'error': 'No text detected'
                }
            
            text_parts = []
            total_confidence = 0
            count = 0
            
            for line in result[0]:
                if line and len(line) >= 2:
                    text = line[1][0]  # Extract text
                    confidence = line[1][1]  # Extract confidence
                    if text.strip() and confidence > 0.6:
                        text_parts.append(text)
                        total_confidence += confidence
                        count += 1
            
            if text_parts and count > 0:
                avg_confidence = total_confidence / count
                return {
                    'text': ' '.join(text_parts),
                    'confidence': avg_confidence,
                    'method': 'paddleocr',
                    'error': None
                }
            else:
                return {
                    'text': '',
                    'confidence': 0.0,
                    'method': 'paddleocr',
                    'error': 'No valid text found'
                }
                
        except Exception as e:
            logger.error(f"PaddleOCR extraction failed: {e}")
            return {
                'text': '',
                'confidence': 0.0,
                'method': 'paddleocr',
                'error': str(e)
            }
    
    def get_name(self) -> str:
        return 'paddleocr'
    
    def is_available(self) -> bool:
        return self.paddleocr is not None

class OCRProcessor:
    """Main OCR processor that uses different strategies"""
    
    def __init__(self):
        self.strategies = []
        self._initialize_strategies()
    
    def _initialize_strategies(self):
        """Initialize all available OCR strategies"""
        # Add strategies in order of preference
        self.strategies.append(EasyOCRStrategy())
        self.strategies.append(TesseractStrategy())
        self.strategies.append(PaddleOCRStrategy())
        
        available_strategies = [s.get_name() for s in self.strategies if s.is_available()]
        logger.info(f"Available OCR strategies: {available_strategies}")
    
    def extract_text(self, image_path: str) -> Dict[str, Any]:
        """Extract text using the best available strategy"""
        results = {
            'text': '',
            'confidence': 0.0,
            'method': 'unknown',
            'raw_results': {},
            'image_description': '',
            'error': None
        }
        
        # Try each strategy in order
        for strategy in self.strategies:
            if not strategy.is_available():
                continue
            
            try:
                strategy_result = strategy.extract_text(image_path)
                results['raw_results'][strategy.get_name()] = strategy_result
                
                # Use the first successful result with good confidence
                if (strategy_result['text'] and 
                    strategy_result['confidence'] > 0.6 and 
                    not strategy_result['error']):
                    
                    results['text'] = strategy_result['text']
                    results['confidence'] = strategy_result['confidence']
                    results['method'] = strategy_result['method']
                    logger.info(f"Using {strategy.get_name()} with confidence: {strategy_result['confidence']:.2f}")
                    break
                    
            except Exception as e:
                logger.warning(f"Strategy {strategy.get_name()} failed: {e}")
                continue
        
        # If no strategy worked, try OpenAI Vision API as fallback
        if not results['text']:
            vision_result = self._try_vision_api(image_path)
            if vision_result:
                results.update(vision_result)
        
        return results
    
    def _try_vision_api(self, image_path: str) -> Optional[Dict[str, Any]]:
        """Try OpenAI Vision API as fallback"""
        try:
            # This would be implemented in the EnhancedVisionModel
            # For now, return None to avoid circular imports
            return None
        except Exception as e:
            logger.warning(f"Vision API fallback failed: {e}")
            return None
    
    def get_available_strategies(self) -> list:
        """Get list of available strategy names"""
        return [s.get_name() for s in self.strategies if s.is_available()]
    
    def get_strategy_status(self) -> Dict[str, bool]:
        """Get status of all strategies"""
        return {s.get_name(): s.is_available() for s in self.strategies}
