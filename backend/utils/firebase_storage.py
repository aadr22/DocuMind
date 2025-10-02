"""
Optimized Firebase Storage Manager
Efficient file storage with 10MB limit, compression, and smart organization
"""
import os
import io
import gzip
import logging
from typing import Optional, Dict, Any, Tuple
from datetime import datetime, timedelta
import firebase_admin
from firebase_admin import credentials, storage
from google.cloud import storage as gcs
from google.cloud.exceptions import NotFound
import mimetypes
from dotenv import load_dotenv

# Load environment variables
load_dotenv('env.local')
load_dotenv()  # Also try loading from current directory

logger = logging.getLogger(__name__)

class FirebaseStorageManager:
    """Optimized Firebase Storage Manager with efficient file handling"""
    
    def __init__(self):
        self.bucket = None
        self.is_initialized_flag = False
        self.max_file_size = 10 * 1024 * 1024  # 10MB limit
        self.compression_threshold = 1024 * 1024  # 1MB - compress files larger than this
        
        try:
            # Initialize Firebase Admin SDK
            if not firebase_admin._apps:
                # Try to get service account from environment
                service_account_json = os.getenv('FIREBASE_SERVICE_ACCOUNT_JSON')
                
                if service_account_json and len(service_account_json) > 100:
                    try:
                        import json
                        cred_dict = json.loads(service_account_json)
                        cred = credentials.Certificate(cred_dict)
                        firebase_admin.initialize_app(cred)
                        logger.info("Firebase Admin SDK initialized with service account")
                    except Exception as e:
                        logger.warning(f"Failed to initialize with service account: {e}")
                        # Try default credentials
                        try:
                            firebase_admin.initialize_app()
                            logger.info("Firebase Admin SDK initialized with default credentials")
                        except Exception as e2:
                            logger.warning(f"Failed to initialize with default credentials: {e2}")
                            raise e2
                else:
                    logger.warning("No valid Firebase service account found, storage will be disabled")
                    return
            
            # Initialize Cloud Storage client
            self.bucket_name = os.getenv('FIREBASE_STORAGE_BUCKET')
            if not self.bucket_name:
                logger.warning("FIREBASE_STORAGE_BUCKET not set, storage will be disabled")
                return
                
            # Use the same credentials as Firebase Admin SDK
            from google.oauth2 import service_account
            import json
            cred_dict = json.loads(service_account_json)
            gcs_credentials = service_account.Credentials.from_service_account_info(cred_dict)
            self.bucket = gcs.Client(credentials=gcs_credentials).bucket(self.bucket_name)
            self.is_initialized_flag = True
            logger.info(f"Firebase Storage Manager initialized with bucket: {self.bucket_name}")
            
        except Exception as e:
            logger.warning(f"Firebase Storage not available: {e}")
            self.is_initialized_flag = False
    
    def is_initialized(self) -> bool:
        """Check if storage is properly initialized"""
        return self.is_initialized_flag and self.bucket is not None
    
    def _generate_file_path(self, user_id: str, original_filename: str, folder: str = "documents") -> str:
        """Generate organized file path: folder/user_id/year/month/filename"""
        now = datetime.now()
        file_ext = os.path.splitext(original_filename)[1]
        base_name = os.path.splitext(original_filename)[0]
        
        # Sanitize filename
        safe_filename = "".join(c for c in base_name if c.isalnum() or c in (' ', '-', '_')).rstrip()
        safe_filename = safe_filename.replace(' ', '_')
        
        # Add timestamp to avoid conflicts
        timestamp = now.strftime("%Y%m%d_%H%M%S")
        filename = f"{safe_filename}_{timestamp}{file_ext}"
        
        return f"{folder}/{user_id}/{now.year}/{now.month:02d}/{filename}"
    
    def _compress_file(self, file_bytes: bytes, filename: str) -> Tuple[bytes, bool]:
        """Compress file if it's larger than threshold and appropriate file type"""
        # Don't compress files that should be viewable in browser (PDFs, images)
        file_ext = os.path.splitext(filename)[1].lower()
        viewable_extensions = ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.txt', '.json']
        
        if file_ext in viewable_extensions:
            # Don't compress viewable files
            return file_bytes, False
        
        if len(file_bytes) > self.compression_threshold:
            try:
                compressed = gzip.compress(file_bytes)
                # Only use compression if it actually reduces size
                if len(compressed) < len(file_bytes):
                    return compressed, True
            except Exception as e:
                logger.warning(f"Compression failed: {e}")
        
        return file_bytes, False
    
    def _get_content_type(self, filename: str) -> str:
        """Get content type for file"""
        content_type, _ = mimetypes.guess_type(filename)
        return content_type or 'application/octet-stream'
    
    def upload_file_from_bytes(
        self, 
        file_bytes: bytes, 
        original_filename: str, 
        user_id: str,
        folder: str = "documents"
    ) -> Optional[Dict[str, Any]]:
        """
        Upload file from bytes with optimization
        
        Args:
            file_bytes: File content as bytes
            original_filename: Original filename
            user_id: User ID for organization
            folder: Storage folder
            
        Returns:
            Dict with file info or None if failed
        """
        if not self.is_initialized():
            logger.error("Firebase Storage not initialized")
            return None
        
        # Check file size
        if len(file_bytes) > self.max_file_size:
            logger.error(f"File too large: {len(file_bytes)} bytes (max: {self.max_file_size})")
            return None
        
        try:
            # Generate file path
            file_path = self._generate_file_path(user_id, original_filename, folder)
            
            # Compress if beneficial (but not for viewable files)
            compressed_bytes, is_compressed = self._compress_file(file_bytes, original_filename)
            
            # Get content type
            content_type = self._get_content_type(original_filename)
            if is_compressed:
                content_type = 'application/gzip'
            
            # Create blob
            blob = self.bucket.blob(file_path)
            
            # Set metadata
            blob.metadata = {
                'original_filename': original_filename,
                'user_id': user_id,
                'uploaded_at': datetime.now().isoformat(),
                'compressed': str(is_compressed),
                'original_size': str(len(file_bytes)),
                'stored_size': str(len(compressed_bytes))
            }
            
            # Set proper cache control for viewable files
            cache_control = 'public, max-age=3600' if not is_compressed else 'private, max-age=300'
            
            # Upload file
            blob.upload_from_string(
                compressed_bytes,
                content_type=content_type
            )
            
            # Set cache control after upload
            blob.cache_control = cache_control
            blob.patch()
            
            # Make file publicly readable (or use signed URLs for security)
            blob.make_public()
            
            # Generate download URL
            download_url = blob.public_url
            
            logger.info(f"File uploaded successfully: {file_path}")
            
            return {
                'file_path': file_path,
                'download_url': download_url,
                'original_filename': original_filename,
                'file_size': len(file_bytes),
                'stored_size': len(compressed_bytes),
                'compressed': is_compressed,
                'content_type': content_type,
                'uploaded_at': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Failed to upload file: {e}")
        return None
    
    def upload_file(self, file_path: str, original_filename: str, user_id: str, folder: str = "documents"):
        """Upload file from local path"""
        try:
            with open(file_path, 'rb') as f:
                file_bytes = f.read()
            return self.upload_file_from_bytes(file_bytes, original_filename, user_id, folder)
        except Exception as e:
            logger.error(f"Failed to read file {file_path}: {e}")
        return None
    
    def delete_file(self, file_path: str) -> bool:
        """Delete file from storage"""
        if not self.is_initialized():
            logger.error("Firebase Storage not initialized")
            return False
        
        try:
            blob = self.bucket.blob(file_path)
            blob.delete()
            logger.info(f"File deleted successfully: {file_path}")
            return True
        except NotFound:
            logger.warning(f"File not found: {file_path}")
            return False
        except Exception as e:
            logger.error(f"Failed to delete file {file_path}: {e}")
        return False
    
    def get_file_info(self, file_path: str) -> Optional[Dict[str, Any]]:
        """Get file information"""
        if not self.is_initialized():
            return None
        
        try:
            blob = self.bucket.blob(file_path)
            blob.reload()
            
            return {
                'file_path': file_path,
                'size': blob.size,
                'content_type': blob.content_type,
                'created': blob.time_created.isoformat() if blob.time_created else None,
                'updated': blob.updated.isoformat() if blob.updated else None,
                'metadata': blob.metadata or {}
            }
        except NotFound:
            return None
        except Exception as e:
            logger.error(f"Failed to get file info for {file_path}: {e}")
            return None
    
    def generate_signed_url(self, file_path: str, expiration_hours: int = 24) -> Optional[str]:
        """Generate signed URL for secure file access"""
        if not self.is_initialized():
            return None
        
        try:
            blob = self.bucket.blob(file_path)
            expiration = datetime.now() + timedelta(hours=expiration_hours)
            
            url = blob.generate_signed_url(
                version="v4",
                expiration=expiration,
                method="GET"
            )
            return url
        except Exception as e:
            logger.error(f"Failed to generate signed URL for {file_path}: {e}")
        return None

    def list_user_files(self, user_id: str, folder: str = "documents") -> list:
        """List all files for a user"""
        if not self.is_initialized():
            return []
        
        try:
            prefix = f"{folder}/{user_id}/"
            blobs = self.bucket.list_blobs(prefix=prefix)
            
            files = []
            for blob in blobs:
                files.append({
                    'file_path': blob.name,
                    'size': blob.size,
                    'content_type': blob.content_type,
                    'created': blob.time_created.isoformat() if blob.time_created else None,
                    'metadata': blob.metadata or {}
                })
            
            return files
        except Exception as e:
            logger.error(f"Failed to list files for user {user_id}: {e}")
            return []
    
    def cleanup_old_files(self, user_id: str, days_old: int = 30, folder: str = "documents") -> int:
        """Clean up files older than specified days"""
        if not self.is_initialized():
            return 0
        
        try:
            cutoff_date = datetime.now() - timedelta(days=days_old)
            prefix = f"{folder}/{user_id}/"
            blobs = self.bucket.list_blobs(prefix=prefix)
            
            deleted_count = 0
            for blob in blobs:
                if blob.time_created and blob.time_created.replace(tzinfo=None) < cutoff_date:
                    blob.delete()
                    deleted_count += 1
                    logger.info(f"Deleted old file: {blob.name}")
            
            logger.info(f"Cleaned up {deleted_count} old files for user {user_id}")
            return deleted_count
        except Exception as e:
            logger.error(f"Failed to cleanup old files for user {user_id}: {e}")
            return 0