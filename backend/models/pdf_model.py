import PyPDF2
import os
from typing import Optional

class PDFProcessor:
    def __init__(self):
        """Initialize PDF processor"""
        self.supported_formats = {'.pdf'}
    
    def extract_text(self, pdf_path: str) -> str:
        """
        Extract text from PDF file using PyPDF2
        
        Args:
            pdf_path: Path to the PDF file
            
        Returns:
            Extracted text as string
        """
        try:
            with open(pdf_path, 'rb') as file:
                # Create PDF reader object
                pdf_reader = PyPDF2.PdfReader(file)
                
                # Check if PDF is encrypted
                if pdf_reader.is_encrypted:
                    return "Error: PDF is encrypted and cannot be read"
                
                # Extract text from all pages
                text_content = []
                for page_num in range(len(pdf_reader.pages)):
                    page = pdf_reader.pages[page_num]
                    page_text = page.extract_text()
                    if page_text:
                        text_content.append(page_text)
                
                # Join all page text
                full_text = '\n\n'.join(text_content)
                
                if not full_text.strip():
                    return "No text content found in PDF"
                
                return full_text
                
        except Exception as e:
            return f"Error extracting text from PDF: {str(e)}"
    
    def get_page_count(self, pdf_path: str) -> int:
        """
        Get the number of pages in the PDF
        
        Args:
            pdf_path: Path to the PDF file
            
        Returns:
            Number of pages
        """
        try:
            with open(pdf_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                return len(pdf_reader.pages)
        except Exception as e:
            print(f"Error getting page count: {e}")
            return 0
    
    def is_pdf_file(self, file_path: str) -> bool:
        """
        Check if file is a PDF
        
        Args:
            file_path: Path to the file
            
        Returns:
            True if file is a PDF
        """
        file_ext = os.path.splitext(file_path.lower())[1]
        return file_ext in self.supported_formats
