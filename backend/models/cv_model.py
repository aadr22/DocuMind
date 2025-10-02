"""
Computer Vision Model for Document Detection and Processing
"""
import cv2
import numpy as np
import logging
import os
from typing import Optional

logger = logging.getLogger(__name__)

class DocumentDetector:
    """Detects and crops document boundaries in images"""
    
    def __init__(self):
        self.min_area = 1000  # Minimum contour area to consider as document
        self.approx_epsilon = 0.02  # Approximation accuracy for contours
    
    def detect_document(self, image_path: str) -> Optional[str]:
        """
        Detect document boundaries and crop the image
        
        Args:
            image_path: Path to the input image
            
        Returns:
            Path to the cropped image, or None if detection fails
        """
        try:
            # Read image
            image = cv2.imread(image_path)
            if image is None:
                logger.error(f"Could not read image: {image_path}")
                return None
            
            # Convert to grayscale
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
            # Apply Gaussian blur to reduce noise
            blurred = cv2.GaussianBlur(gray, (5, 5), 0)
            
            # Apply edge detection
            edges = cv2.Canny(blurred, 50, 150)
            
            # Find contours
            contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            # Find the largest contour (likely the document)
            if not contours:
                logger.warning("No contours found in image")
                return None
            
            # Sort contours by area and find the largest
            contours = sorted(contours, key=cv2.contourArea, reverse=True)
            
            for contour in contours:
                area = cv2.contourArea(contour)
                if area < self.min_area:
                    continue
                
                # Approximate the contour to a polygon
                epsilon = self.approx_epsilon * cv2.arcLength(contour, True)
                approx = cv2.approxPolyDP(contour, epsilon, True)
                
                # If we have 4 points, it's likely a document
                if len(approx) == 4:
                    # Order the points (top-left, top-right, bottom-right, bottom-left)
                    pts = approx.reshape(4, 2)
                    rect = self._order_points(pts)
                    
                    # Get the width and height of the detected rectangle
                    (tl, tr, br, bl) = rect
                    widthA = np.sqrt(((br[0] - bl[0]) ** 2) + ((br[1] - bl[1]) ** 2))
                    widthB = np.sqrt(((tr[0] - tl[0]) ** 2) + ((tr[1] - tl[1]) ** 2))
                    maxWidth = max(int(widthA), int(widthB))
                    
                    heightA = np.sqrt(((tr[0] - br[0]) ** 2) + ((tr[1] - br[1]) ** 2))
                    heightB = np.sqrt(((tl[0] - bl[0]) ** 2) + ((tl[1] - bl[1]) ** 2))
                    maxHeight = max(int(heightA), int(heightB))
                    
                    # Define the destination points for perspective transform
                    dst = np.array([
                        [0, 0],
                        [maxWidth - 1, 0],
                        [maxWidth - 1, maxHeight - 1],
                        [0, maxHeight - 1]
                    ], dtype="float32")
                    
                    # Calculate the perspective transform matrix
                    M = cv2.getPerspectiveTransform(rect, dst)
                    
                    # Apply the perspective transform
                    warped = cv2.warpPerspective(image, M, (maxWidth, maxHeight))
                    
                    # Save the cropped image
                    output_path = self._save_cropped_image(image_path, warped)
                    logger.info(f"Document detected and cropped successfully: {output_path}")
                    return output_path
            
            logger.warning("No suitable document contour found")
            return None
            
        except Exception as e:
            logger.error(f"Error detecting document: {e}")
            return None
    
    def _order_points(self, pts):
        """Order points in a contour to be top-left, top-right, bottom-right, bottom-left"""
        rect = np.zeros((4, 2), dtype="float32")
        
        # The top-left point will have the smallest sum
        # The bottom-right point will have the largest sum
        s = pts.sum(axis=1)
        rect[0] = pts[np.argmin(s)]
        rect[2] = pts[np.argmax(s)]
        
        # The top-right point will have the smallest difference
        # The bottom-left point will have the largest difference
        diff = np.diff(pts, axis=1)
        rect[1] = pts[np.argmin(diff)]
        rect[3] = pts[np.argmax(diff)]
        
        return rect
    
    def _save_cropped_image(self, original_path: str, cropped_image) -> str:
        """Save the cropped image and return the path"""
        try:
            # Create output directory if it doesn't exist
            output_dir = os.path.join(os.path.dirname(original_path), "cropped")
            os.makedirs(output_dir, exist_ok=True)
            
            # Generate output filename
            base_name = os.path.splitext(os.path.basename(original_path))[0]
            output_path = os.path.join(output_dir, f"{base_name}_cropped.jpg")
            
            # Save the image
            cv2.imwrite(output_path, cropped_image)
            
            return output_path
            
        except Exception as e:
            logger.error(f"Error saving cropped image: {e}")
            return original_path
    
    def enhance_image(self, image_path: str) -> Optional[str]:
        """
        Enhance image quality for better OCR results
        
        Args:
            image_path: Path to the input image
            
        Returns:
            Path to the enhanced image, or None if enhancement fails
        """
        try:
            # Read image
            image = cv2.imread(image_path)
            if image is None:
                return None
            
            # Convert to grayscale
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
            # Apply adaptive histogram equalization
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
            enhanced = clahe.apply(gray)
            
            # Apply bilateral filter to reduce noise while preserving edges
            filtered = cv2.bilateralFilter(enhanced, 9, 75, 75)
            
            # Apply slight sharpening
            kernel = np.array([[-1, -1, -1],
                             [-1,  9, -1],
                             [-1, -1, -1]])
            sharpened = cv2.filter2D(filtered, -1, kernel)
            
            # Save enhanced image
            output_path = self._save_enhanced_image(image_path, sharpened)
            return output_path
            
        except Exception as e:
            logger.error(f"Error enhancing image: {e}")
            return None
    
    def _save_enhanced_image(self, original_path: str, enhanced_image) -> str:
        """Save the enhanced image and return the path"""
        try:
            # Create output directory if it doesn't exist
            output_dir = os.path.join(os.path.dirname(original_path), "enhanced")
            os.makedirs(output_dir, exist_ok=True)
            
            # Generate output filename
            base_name = os.path.splitext(os.path.basename(original_path))[0]
            output_path = os.path.join(output_dir, f"{base_name}_enhanced.jpg")
            
            # Save the image
            cv2.imwrite(output_path, enhanced_image)
            
            return output_path
            
        except Exception as e:
            logger.error(f"Error saving enhanced image: {e}")
            return original_path
