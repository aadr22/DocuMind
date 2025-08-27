import firebase_admin
from firebase_admin import credentials, storage
import os
import json
import tempfile
from typing import Optional
import logging
from datetime import datetime
import uuid

logger = logging.getLogger(__name__)

class FirebaseStorageManager:
    def __init__(self):
        """Initialize Firebase Admin SDK with service account"""
        self.bucket = None
        self._initialize_firebase()
    
    def _initialize_firebase(self):
        """Initialize Firebase Admin SDK"""
        try:
            # Get service account JSON from environment variable
            service_account_json = os.getenv('FIREBASE_SERVICE_ACCOUNT_JSON')
            if not service_account_json:
                logger.warning("FIREBASE_SERVICE_ACCOUNT_JSON not found in environment variables")
                return
            
            # Parse the JSON string
            service_account_info = json.loads(service_account_json)
            
            # Get bucket name from environment or use default
            bucket_name = os.getenv('FIREBASE_STORAGE_BUCKET')
            if not bucket_name:
                # Try to extract from service account
                project_id = service_account_info.get('project_id')
                if project_id:
                    bucket_name = f"{project_id}.appspot.com"
                else:
                    logger.error("Could not determine Firebase Storage bucket name")
                    return
            
            # Initialize Firebase Admin SDK if not already initialized
            if not firebase_admin._apps:
                cred = credentials.Certificate(service_account_info)
                firebase_admin.initialize_app(cred, {
                    'storageBucket': bucket_name
                })
                logger.info(f"Firebase Admin SDK initialized with bucket: {bucket_name}")
            
            # Get storage bucket
            self.bucket = storage.bucket()
            logger.info("Firebase Storage bucket initialized successfully")
            
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in FIREBASE_SERVICE_ACCOUNT_JSON: {e}")
        except Exception as e:
            logger.error(f"Error initializing Firebase Storage: {e}")
    
    def upload_file(self, file_path: str, original_filename: str, folder: str = "documents") -> Optional[str]:
        """
        Upload a file to Firebase Storage
        
        Args:
            file_path: Local path to the file to upload
            original_filename: Original filename to preserve
            folder: Folder path in Firebase Storage (default: "documents")
            
        Returns:
            Public URL of the uploaded file or None if upload fails
        """
        if not self.bucket:
            logger.error("Firebase Storage not initialized")
            return None
        
        try:
            # Generate unique filename to avoid conflicts
            file_extension = os.path.splitext(original_filename)[1]
            unique_filename = f"{uuid.uuid4().hex}{file_extension}"
            
            # Create storage path
            timestamp = datetime.now().strftime("%Y/%m/%d")
            storage_path = f"{folder}/{timestamp}/{unique_filename}"
            
            # Create blob and upload file
            blob = self.bucket.blob(storage_path)
            
            # Set metadata
            blob.metadata = {
                'original_filename': original_filename,
                'upload_timestamp': datetime.now().isoformat(),
                'content_type': self._get_content_type(file_extension)
            }
            
            # Upload the file
            blob.upload_from_filename(file_path)
            
            # Make the blob publicly readable
            blob.make_public()
            
            # Get public URL
            public_url = blob.public_url
            
            logger.info(f"File uploaded successfully to Firebase Storage: {storage_path}")
            logger.info(f"Public URL: {public_url}")
            
            return public_url
            
        except Exception as e:
            logger.error(f"Error uploading file to Firebase Storage: {e}")
            return None
    
    def upload_file_from_bytes(self, file_bytes: bytes, original_filename: str, folder: str = "documents") -> Optional[str]:
        """
        Upload file bytes to Firebase Storage
        
        Args:
            file_bytes: File content as bytes
            original_filename: Original filename to preserve
            folder: Folder path in Firebase Storage (default: "documents")
            
        Returns:
            Public URL of the uploaded file or None if upload fails
        """
        if not self.bucket:
            logger.error("Firebase Storage not initialized")
            return None
        
        try:
            # Generate unique filename
            file_extension = os.path.splitext(original_filename)[1]
            unique_filename = f"{uuid.uuid4().hex}{file_extension}"
            
            # Create storage path
            timestamp = datetime.now().strftime("%Y/%m/%d")
            storage_path = f"{folder}/{timestamp}/{unique_filename}"
            
            # Create blob and upload bytes
            blob = self.bucket.blob(storage_path)
            
            # Set metadata
            blob.metadata = {
                'original_filename': original_filename,
                'upload_timestamp': datetime.now().isoformat(),
                'content_type': self._get_content_type(file_extension)
            }
            
            # Upload the bytes
            blob.upload_from_string(file_bytes, content_type=self._get_content_type(file_extension))
            
            # Make the blob publicly readable
            blob.make_public()
            
            # Get public URL
            public_url = blob.public_url
            
            logger.info(f"File bytes uploaded successfully to Firebase Storage: {storage_path}")
            logger.info(f"Public URL: {public_url}")
            
            return public_url
            
        except Exception as e:
            logger.error(f"Error uploading file bytes to Firebase Storage: {e}")
            return None
    
    def delete_file(self, file_url: str) -> bool:
        """
        Delete a file from Firebase Storage
        
        Args:
            file_url: Public URL of the file to delete
            
        Returns:
            True if deletion successful, False otherwise
        """
        if not self.bucket:
            logger.error("Firebase Storage not initialized")
            return False
        
        try:
            # Extract blob name from URL
            # URL format: https://storage.googleapis.com/BUCKET_NAME/path/to/file
            url_parts = file_url.split('/')
            if len(url_parts) < 5:
                logger.error(f"Invalid Firebase Storage URL format: {file_url}")
                return False
            
            # Get the path after bucket name
            bucket_name = url_parts[3]
            blob_path = '/'.join(url_parts[4:])
            
            # Get blob and delete
            blob = self.bucket.blob(blob_path)
            blob.delete()
            
            logger.info(f"File deleted successfully from Firebase Storage: {blob_path}")
            return True
            
        except Exception as e:
            logger.error(f"Error deleting file from Firebase Storage: {e}")
            return False
    
    def _get_content_type(self, file_extension: str) -> str:
        """
        Get MIME content type based on file extension
        
        Args:
            file_extension: File extension (e.g., '.pdf', '.jpg')
            
        Returns:
            MIME content type string
        """
        content_types = {
            '.pdf': 'application/pdf',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.bmp': 'image/bmp',
            '.tiff': 'image/tiff',
            '.tif': 'image/tiff'
        }
        
        return content_types.get(file_extension.lower(), 'application/octet-stream')
    
    def is_initialized(self) -> bool:
        """Check if Firebase Storage is properly initialized"""
        return self.bucket is not None
