import os
import tempfile
import subprocess
import requests
from typing import Dict, List, Tuple, Optional
import logging

logger = logging.getLogger(__name__)

class EnhancedVisionModel:
    def __init__(self):
        """Initialize enhanced vision model with multiple OCR engines"""
        self.ocr_engines = {}
        self.vision_api_key = os.getenv('OPENAI_API_KEY')
        self.initialize_engines()
    
    def initialize_engines(self):
        """Initialize different OCR engines"""
        try:
            # Try to initialize PaddleOCR (better than EasyOCR)
            import paddleocr
            try:
                self.ocr_engines['paddleocr'] = paddleocr.PaddleOCR(use_angle_cls=True, lang='en')
                logger.info("PaddleOCR initialized successfully")
            except Exception as e:
                logger.warning(f"PaddleOCR initialization failed: {e}, falling back to other engines")
        except ImportError:
            logger.warning("PaddleOCR not available, falling back to EasyOCR")
        
        # Try to initialize EasyOCR
        try:
            import easyocr
            self.ocr_engines['easyocr'] = easyocr.Reader(['en'], gpu=False)
            logger.info("EasyOCR initialized successfully")
        except ImportError:
            logger.error("EasyOCR not available")
        
        # Try to initialize Tesseract if available
        try:
            import pytesseract
            # Check if tesseract is installed
            result = subprocess.run(['tesseract', '--version'], 
                                 capture_output=True, text=True, timeout=5)
            if result.returncode == 0:
                self.ocr_engines['tesseract'] = pytesseract
                logger.info("Tesseract initialized successfully")
        except ImportError:
            logger.warning("Tesseract not available")
        except Exception as e:
            logger.warning(f"Tesseract check failed: {e}")
        
        # Ensure we have at least one engine
        if not self.ocr_engines:
            logger.error("No OCR engines available!")
        else:
            logger.info(f"Initialized OCR engines: {list(self.ocr_engines.keys())}")
    
    def extract_text_from_image(self, image_path: str) -> Dict[str, any]:
        """
        Extract text from image using multiple OCR engines and vision AI
        
        Args:
            image_path: Path to the image file
            
        Returns:
            Dictionary with extracted text and confidence scores
        """
        results = {
            'text': '',
            'confidence': 0.0,
            'method': 'unknown',
            'raw_results': {},
            'image_description': ''
        }
        
        # Method 1: Try EasyOCR first (most reliable on Windows)
        if 'easyocr' in self.ocr_engines:
            try:
                easy_result = self.ocr_engines['easyocr'].readtext(image_path)
                if easy_result:
                    text_parts = []
                    total_confidence = 0
                    count = 0
                    
                    for (bbox, text, confidence) in easy_result:
                        if text.strip() and confidence > 0.5:  # Higher confidence threshold
                            text_parts.append(text)
                            total_confidence += confidence
                            count += 1
                    
                    if text_parts and count > 0:
                        avg_confidence = total_confidence / count
                        results['raw_results']['easyocr'] = {
                            'text': ' '.join(text_parts),
                            'confidence': avg_confidence
                        }
                        
                        # Use EasyOCR if confidence is good
                        if avg_confidence > 0.7:
                            results['text'] = ' '.join(text_parts)
                            results['confidence'] = avg_confidence
                            results['method'] = 'easyocr'
                            logger.info(f"EasyOCR extracted text with confidence: {avg_confidence:.2f}")
                            return results
            except Exception as e:
                logger.warning(f"EasyOCR failed: {e}")
        
        # Method 2: Try Tesseract (good for clean text)
        if 'tesseract' in self.ocr_engines and not results['text']:
            try:
                import cv2
                import numpy as np
                
                # Preprocess image for better OCR
                image = cv2.imread(image_path)
                if image is not None:
                    # Convert to grayscale
                    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
                    
                    # Apply thresholding to get binary image
                    _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
                    
                    # Extract text
                    tesseract_text = self.ocr_engines['tesseract'].image_to_string(
                        binary, 
                        config='--psm 6 --oem 3'
                    )
                    
                    if tesseract_text.strip():
                        # Basic validation - check if text looks reasonable
                        clean_text = tesseract_text.strip()
                        if len(clean_text) > 10 and not clean_text.isupper():  # Basic sanity checks
                            results['raw_results']['tesseract'] = {
                                'text': clean_text,
                                'confidence': 0.7
                            }
                            
                            if not results['text']:
                                results['text'] = clean_text
                                results['confidence'] = 0.7
                                results['method'] = 'tesseract'
                                logger.info("Tesseract extracted text")
            except Exception as e:
                logger.warning(f"Tesseract failed: {e}")
        
        # Method 3: Try PaddleOCR (best for complex layouts)
        if 'paddleocr' in self.ocr_engines and not results['text']:
            try:
                paddle_result = self.ocr_engines['paddleocr'].ocr(image_path, cls=True)
                if paddle_result and paddle_result[0]:
                    text_parts = []
                    total_confidence = 0
                    count = 0
                    
                    for line in paddle_result[0]:
                        if line and len(line) >= 2:
                            text = line[1][0]  # Extract text
                            confidence = line[1][1]  # Extract confidence
                            if text.strip() and confidence > 0.6:  # Higher threshold
                                text_parts.append(text)
                                total_confidence += confidence
                                count += 1
                    
                    if text_parts and count > 0:
                        avg_confidence = total_confidence / count
                        results['raw_results']['paddleocr'] = {
                            'text': ' '.join(text_parts),
                            'confidence': avg_confidence
                        }
                        
                        # Use PaddleOCR if confidence is very good
                        if avg_confidence > 0.8:
                            results['text'] = ' '.join(text_parts)
                            results['confidence'] = avg_confidence
                            results['method'] = 'paddleocr'
                            logger.info(f"PaddleOCR extracted text with confidence: {avg_confidence:.2f}")
            except Exception as e:
                logger.warning(f"PaddleOCR failed: {e}")
        
        # Method 4: Use OpenAI Vision API ONLY if we have a valid API key and no good OCR results
        if not results['text'] and self.vision_api_key and self.vision_api_key != 'test-key':
            try:
                vision_result = self._extract_text_with_vision_api(image_path)
                if vision_result and vision_result.get('text'):
                    # Validate Vision API results
                    vision_text = vision_result['text']
                    if len(vision_text.strip()) > 10:  # Basic validation
                        results['raw_results']['vision_api'] = vision_result
                        results['text'] = vision_text
                        results['confidence'] = vision_result.get('confidence', 0.9)
                        results['method'] = 'vision_api'
                        results['image_description'] = vision_result.get('image_description', '')
                        logger.info("OpenAI Vision API provided text extraction")
            except Exception as e:
                logger.warning(f"Vision API failed: {e}")
        
        # Method 5: Basic image analysis as final fallback (no hallucination risk)
        if not results['text']:
            try:
                basic_description = self._basic_image_analysis(image_path)
                if basic_description and not basic_description.startswith("Basic analysis failed"):
                    results['text'] = f"Image Analysis: {basic_description}"
                    results['image_description'] = basic_description
                    results['confidence'] = 0.6
                    results['method'] = 'basic_analysis'
                    logger.info("Using basic image analysis as fallback")
                else:
                    # Last resort: very conservative message
                    results['text'] = "Image Analysis: Unable to extract text. This appears to be an image file that could not be processed by available OCR engines."
                    results['confidence'] = 0.1
                    results['method'] = 'fallback'
                    logger.warning("All image processing methods failed")
            except Exception as e:
                logger.error(f"Basic analysis failed: {e}")
                # Final fallback
                results['text'] = "Image Analysis: Processing failed. Please try a different image or contact support."
                results['confidence'] = 0.0
                results['method'] = 'error'
        
        return results
    
    def _extract_text_with_vision_api(self, image_path: str) -> Optional[Dict]:
        """Use OpenAI Vision API for complex image understanding"""
        if not self.vision_api_key:
            return None
        
        try:
            import base64
            
            # Encode image to base64
            with open(image_path, "rb") as image_file:
                encoded_image = base64.b64encode(image_file.read()).decode('utf-8')
            
            # Prepare API request for comprehensive analysis
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.vision_api_key}"
            }
            
            payload = {
                "model": "gpt-4o",
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": """Analyze this image comprehensively and provide:

1. TEXT EXTRACTION: Extract all readable text content, maintaining structure and formatting. If there are tables, lists, or structured content, preserve that format.

2. IMAGE DESCRIPTION: Provide a detailed description of what you see in the image, including:
   - Objects, people, scenes, or content
   - Layout and structure
   - Colors, style, and visual elements
   - Any charts, graphs, diagrams, or visual data
   - Context and purpose of the image

Format your response as:
TEXT: [extracted text here]
DESCRIPTION: [detailed image description here]

If no text is readable, focus on the description. If the image is primarily text, focus on accurate text extraction."""
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{encoded_image}"
                                }
                            }
                        ]
                    }
                ],
                "max_tokens": 1500
            }
            
            # Make API call
            response = requests.post(
                "https://api.openai.com/v1/chat/completions",
                headers=headers,
                json=payload,
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                full_response = result['choices'][0]['message']['content']
                
                # Parse the response to extract text and description
                text_content = ""
                image_description = ""
                
                # Look for TEXT: and DESCRIPTION: markers
                if "TEXT:" in full_response and "DESCRIPTION:" in full_response:
                    parts = full_response.split("DESCRIPTION:")
                    if len(parts) == 2:
                        text_part = parts[0].replace("TEXT:", "").strip()
                        desc_part = parts[1].strip()
                        
                        if text_part and text_part != "No readable text found":
                            text_content = text_part
                        image_description = desc_part
                else:
                    # Fallback: if no markers, treat as description
                    image_description = full_response
                
                return {
                    'text': text_content,
                    'image_description': image_description,
                    'confidence': 0.9,  # Vision API is very reliable
                    'full_response': full_response
                }
            
        except Exception as e:
            logger.error(f"Vision API error: {e}")
        
        return None
    
    def _basic_image_analysis(self, image_path: str) -> str:
        """Provide basic image analysis using OpenCV when all else fails"""
        try:
            import cv2
            import numpy as np
            
            # Read image
            image = cv2.imread(image_path)
            if image is None:
                return "Unable to read image file"
            
            # Get basic image properties
            height, width = image.shape[:2]
            channels = image.shape[2] if len(image.shape) > 2 else 1
            
            # Determine if image is color or grayscale
            if channels == 3:
                color_type = "color"
                # Get dominant colors
                pixels = image.reshape(-1, 3)
                mean_color = np.mean(pixels, axis=0)
                color_names = ["blue", "green", "red"]
                dominant_color = color_names[np.argmax(mean_color)]
            else:
                color_type = "grayscale"
                dominant_color = "N/A"
            
            # Check image brightness
            if color_type == "color":
                gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            else:
                gray = image
            
            brightness = np.mean(gray)
            if brightness < 85:
                brightness_level = "dark"
            elif brightness > 170:
                brightness_level = "bright"
            else:
                brightness_level = "medium"
            
            # Check for edges (indicates content complexity)
            edges = cv2.Canny(gray, 50, 150)
            edge_density = np.sum(edges > 0) / (height * width)
            
            if edge_density > 0.1:
                complexity = "high detail"
            elif edge_density > 0.05:
                complexity = "medium detail"
            else:
                complexity = "low detail"
            
            # Create description
            description = f"Image dimensions: {width}x{height} pixels, {color_type} image. "
            description += f"Brightness: {brightness_level}, Detail level: {complexity}. "
            
            if color_type == "color":
                description += f"Dominant color tone: {dominant_color}. "
            
            # Add file size info if available
            try:
                file_size = os.path.getsize(image_path)
                if file_size > 1024 * 1024:
                    size_desc = f"{file_size / (1024 * 1024):.1f} MB"
                else:
                    size_desc = f"{file_size / 1024:.1f} KB"
                description += f"File size: {size_desc}."
            except:
                pass
            
            return description
            
        except Exception as e:
            logger.error(f"Basic image analysis failed: {e}")
            return f"Basic analysis failed: {str(e)}"
    
    def get_supported_formats(self) -> List[str]:
        """Get list of supported image formats"""
        return ['.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.tif', '.webp']
    
    def is_image_file(self, file_path: str) -> bool:
        """Check if file is a supported image format"""
        file_ext = os.path.splitext(file_path.lower())[1]
        return file_ext in self.get_supported_formats()
