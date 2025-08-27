import easyocr
import os
from typing import List, Tuple, Optional
import tempfile

class TextExtractor:
    def __init__(self):
        """Initialize EasyOCR for text extraction"""
        try:
            # Initialize EasyOCR with English language
            self.ocr = easyocr.Reader(['en'], gpu=False)
        except Exception as e:
            print(f"Error initializing EasyOCR: {e}")
            self.ocr = None
    
    def extract_text(self, image_path: str) -> str:
        """
        Extract text from image using EasyOCR
        
        Args:
            image_path: Path to the input image
            
        Returns:
            Extracted text as string
        """
        if not self.ocr:
            return "Error: OCR model not initialized"
        
        try:
            # Run OCR
            result = self.ocr.readtext(image_path)
            
            if not result:
                return "No text detected in the image"
            
            # Extract text from results
            extracted_text = []
            for (bbox, text, confidence) in result:
                # Only include text with reasonable confidence
                if confidence > 0.5:
                    extracted_text.append(text)
            
            # Join all detected text
            full_text = ' '.join(extracted_text)
            
            if not full_text.strip():
                return "No readable text found in the image"
            
            return full_text
            
        except Exception as e:
            print(f"Error in text extraction: {e}")
            return f"Error extracting text: {str(e)}"
    
    def extract_text_with_confidence(self, image_path: str) -> List[Tuple[str, float]]:
        """
        Extract text with confidence scores
        
        Args:
            image_path: Path to the input image
            
        Returns:
            List of tuples (text, confidence)
        """
        if not self.ocr:
            return []
        
        try:
            result = self.ocr.readtext(image_path)
            
            if not result:
                return []
            
            text_with_confidence = []
            for (bbox, text, confidence) in result:
                text_with_confidence.append((text, confidence))
            
            return text_with_confidence
            
        except Exception as e:
            print(f"Error in text extraction with confidence: {e}")
            return []
    
    def is_image_file(self, file_path: str) -> bool:
        """
        Check if file is a supported image format
        
        Args:
            file_path: Path to the file
            
        Returns:
            True if file is a supported image format
        """
        supported_formats = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.tif'}
        file_ext = os.path.splitext(file_path.lower())[1]
        return file_ext in supported_formats
