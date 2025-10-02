# DocuMind AI Frontend Interfaces Package
# This package contains focused interfaces following ISP

from .document_interfaces import *
from .auth_interfaces import *
from .storage_interfaces import *

__all__ = [
    # Document interfaces
    'IDocumentStorage',
    'IDocumentMetadata',
    'IDocumentSearch',
    'IDocumentAnalytics',
    
    # Auth interfaces
    'IAuthentication',
    'IUserProfile',
    'IUserManagement',
    
    # Storage interfaces
    'IFileStorage',
    'IStorageManager'
]
