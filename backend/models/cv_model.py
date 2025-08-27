import cv2
import numpy as np
from PIL import Image
import os
from typing import Optional, Tuple
import tempfile

class DocumentDetector:
    def __init__(self):
        """Initialize basic document detection capabilities"""
        self.model = None  # No external model dependency for now
    
    def detect_document(self, image_path: str) -> Optional[str]:
        """
        Basic document detection using edge detection and contour finding
        
        Args:
            image_path: Path to the input image
            
        Returns:
            Path to cropped document image or None if detection fails
        """
        try:
            # Load image
            image = cv2.imread(image_path)
            if image is None:
                return None
            
            # Convert to grayscale
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
            # Apply Gaussian blur
            blurred = cv2.GaussianBlur(gray, (5, 5), 0)
            
            # Edge detection
            edges = cv2.Canny(blurred, 50, 150)
            
            # Find contours
            contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            if not contours:
                return None
            
            # Find the largest contour (assumed to be the document)
            largest_contour = max(contours, key=cv2.contourArea)
            
            # Get bounding rectangle
            x, y, w, h = cv2.boundingRect(largest_contour)
            
            # Ensure coordinates are within image bounds
            height, width = image.shape[:2]
            x = max(0, x)
            y = max(0, y)
            w = min(w, width - x)
            h = min(h, height - y)
            
            # Crop image
            cropped = image[y:y+h, x:x+w]
            
            # Save cropped image to temporary file
            temp_dir = tempfile.gettempdir()
            temp_path = os.path.join(temp_dir, f"cropped_doc_{os.path.basename(image_path)}")
            
            cv2.imwrite(temp_path, cropped)
            return temp_path
            
        except Exception as e:
            print(f"Error in document detection: {e}")
            return None
    
    def _crop_image(self, image_path: str, coords: np.ndarray) -> Image.Image:
        """
        Crop image based on bounding box coordinates
        
        Args:
            image_path: Path to the input image
            coords: Bounding box coordinates [x1, y1, x2, y2]
            
        Returns:
            Cropped PIL Image
        """
        # Load image
        image = cv2.imread(image_path)
        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Extract coordinates
        x1, y1, x2, y2 = map(int, coords)
        
        # Ensure coordinates are within image bounds
        height, width = image.shape[:2]
        x1 = max(0, x1)
        y1 = max(0, y1)
        x2 = min(width, x2)
        y2 = min(height, y2)
        
        # Crop image
        cropped = image[y1:y2, x1:x2]
        
        # Convert to PIL Image
        return Image.fromarray(cropped)
    
    def cleanup_temp_files(self, temp_paths: list):
        """
        Clean up temporary files
        
        Args:
            temp_paths: List of temporary file paths to delete
        """
        for path in temp_paths:
            try:
                if os.path.exists(path):
                    os.remove(path)
            except Exception as e:
                print(f"Error deleting temporary file {path}: {e}")
