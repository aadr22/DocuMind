"""
File Validation Service
Responsible for validating file types, sizes, and formats
"""
import os
import logging
from typing import List, Tuple, Optional
from pathlib import Path

logger = logging.getLogger(__name__)

class FileValidationService:
    """Handles all file validation logic"""
    
    def __init__(self):
        # Supported file extensions
        self.supported_extensions = {'.pdf', '.jpg', '.jpeg', '.png'}
        
        # File size limits (in bytes)
        self.max_file_size = 10 * 1024 * 1024  # 10MB
        
        # MIME type validation
        self.allowed_mime_types = {
            'application/pdf',
            'image/jpeg',
            'image/jpg', 
            'image/png'
        }
    
    def validate_file(self, file_path: str, original_filename: str, file_size: int) -> Tuple[bool, str]:
        """
        Comprehensive file validation
        
        Args:
            file_path: Path to the file
            original_filename: Original filename
            file_size: File size in bytes
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        # Check file size
        if not self._validate_file_size(file_size):
            return False, f"File size {file_size} bytes exceeds maximum allowed size of {self.max_file_size} bytes"
        
        # Check file extension
        if not self._validate_file_extension(original_filename):
            return False, f"File extension not supported. Allowed: {', '.join(self.supported_extensions)}"
        
        # Check if file exists and is readable
        if not self._validate_file_access(file_path):
            return False, "File is not accessible or readable"
        
        # Check file content (basic validation)
        if not self._validate_file_content(file_path, original_filename):
            return False, "File content validation failed"
        
        return True, "File validation passed"
    
    def _validate_file_size(self, file_size: int) -> bool:
        """Validate file size"""
        return file_size <= self.max_file_size and file_size > 0
    
    def _validate_file_extension(self, filename: str) -> bool:
        """Validate file extension"""
        file_ext = os.path.splitext(filename.lower())[1]
        return file_ext in self.supported_extensions
    
    def _validate_file_access(self, file_path: str) -> bool:
        """Validate file accessibility"""
        try:
            path = Path(file_path)
            return path.exists() and path.is_file() and os.access(file_path, os.R_OK)
        except Exception as e:
            logger.warning(f"File access validation failed for {file_path}: {e}")
            return False
    
    def _validate_file_content(self, file_path: str, filename: str) -> bool:
        """Basic file content validation"""
        try:
            file_ext = os.path.splitext(filename.lower())[1]
            
            # Check file header for basic validation
            with open(file_path, 'rb') as f:
                header = f.read(8)  # Read first 8 bytes
                
                if file_ext == '.pdf':
                    # PDF files should start with %PDF
                    return header.startswith(b'%PDF')
                elif file_ext in ['.jpg', '.jpeg']:
                    # JPEG files should start with SOI marker
                    return header.startswith(b'\xff\xd8')
                elif file_ext == '.png':
                    # PNG files should start with PNG signature
                    return header.startswith(b'\x89PNG\r\n\x1a\n')
                else:
                    return True  # Unknown extension, assume valid
                    
        except Exception as e:
            logger.warning(f"File content validation failed for {file_path}: {e}")
            return False
    
    def get_supported_extensions(self) -> List[str]:
        """Get list of supported file extensions"""
        return list(self.supported_extensions)
    
    def get_max_file_size(self) -> int:
        """Get maximum allowed file size in bytes"""
        return self.max_file_size
    
    def get_max_file_size_mb(self) -> float:
        """Get maximum allowed file size in MB"""
        return self.max_file_size / (1024 * 1024)
    
    def is_image_file(self, filename: str) -> bool:
        """Check if file is an image based on extension"""
        file_ext = os.path.splitext(filename.lower())[1]
        return file_ext in ['.jpg', '.jpeg', '.png']
    
    def is_pdf_file(self, filename: str) -> bool:
        """Check if file is a PDF based on extension"""
        file_ext = os.path.splitext(filename.lower())[1]
        return file_ext == '.pdf'
    
    def get_file_type_category(self, filename: str) -> str:
        """Get the category of file type"""
        if self.is_pdf_file(filename):
            return 'pdf'
        elif self.is_image_file(filename):
            return 'image'
        else:
            return 'unknown'
