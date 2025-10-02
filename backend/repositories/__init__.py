# DocuMind AI Repositories Package
# This package contains data access abstractions using Repository pattern

from .document_repository import DocumentRepository, IDocumentRepository
from .user_repository import UserRepository, IUserRepository

__all__ = [
    'DocumentRepository',
    'IDocumentRepository',
    'UserRepository', 
    'IUserRepository'
]
