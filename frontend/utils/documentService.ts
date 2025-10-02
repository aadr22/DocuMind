// Firebase Storage imports removed - storage functionality disabled
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  addDoc,
  serverTimestamp,
  startAfter
} from 'firebase/firestore'
import { db } from './firebaseConfig'

export interface DocumentMetadata {
  id?: string
  uid: string
  fileName: string
  originalName: string
  fileSize: number
  fileType: string
  mimeType: string
  storagePath: string
  downloadURL?: string
  uploadedAt: Date
  lastModified?: Date
  tags?: string[]
  description?: string
  isPublic?: boolean
  category?: string
  processingStatus?: 'pending' | 'processing' | 'uploading' | 'completed' | 'failed'
  aiAnalysis?: {
    summary?: string
    keywords?: string[]
    sentiment?: 'positive' | 'negative' | 'neutral'
    confidence?: number
  }
}

export interface UploadProgress {
  bytesTransferred: number
  totalBytes: number
  percentage: number
}

export class DocumentService {
  private static instance: DocumentService
  private documentCache: Map<string, { data: DocumentMetadata[]; timestamp: number }> = new Map()
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  static getInstance(): DocumentService {
    if (!DocumentService.instance) {
      DocumentService.instance = new DocumentService()
    }
    return DocumentService.instance
  }

  // Clear expired cache entries
  private clearExpiredCache() {
    const now = Date.now()
    const keysToDelete: string[] = []
    
    this.documentCache.forEach((value, key) => {
      if (now - value.timestamp > this.CACHE_DURATION) {
        keysToDelete.push(key)
      }
    })
    
    keysToDelete.forEach(key => {
      this.documentCache.delete(key)
    })
  }

  // Get cache key for user documents
  private getCacheKey(uid: string, options: any): string {
    return `${uid}_${JSON.stringify(options)}`
  }

  // Process document (storage functionality removed)
  async uploadDocument(
    file: File, 
    uid: string, 
    metadata: Partial<DocumentMetadata> = {},
    onProgress?: (progress: UploadProgress) => void
  ): Promise<DocumentMetadata> {
    try {
      // Create unique filename
      const timestamp = Date.now()
      const uniqueFileName = `${timestamp}_${file.name}`
      const storagePath = '' // Storage disabled
      
      // Create document metadata (no storage)
      const documentMetadata: DocumentMetadata = {
        uid,
        fileName: uniqueFileName,
        originalName: file.name,
        fileSize: file.size,
        fileType: file.name.split('.').pop() || '',
        mimeType: file.type,
        storagePath,
        uploadedAt: new Date(),
        lastModified: new Date(file.lastModified),
        processingStatus: 'completed', // Direct processing, no upload
        ...metadata
      }
      
      // Save metadata to Firestore
      const docRef = doc(collection(db, 'documents'))
      await setDoc(docRef, {
        ...documentMetadata,
        id: docRef.id,
        uploadedAt: serverTimestamp(),
        lastModified: serverTimestamp()
      })
      
      // Update local metadata with the ID
      const finalMetadata = { ...documentMetadata, id: docRef.id }
      
      // Simulate processing progress
      if (onProgress) {
        // Simulate processing steps
        onProgress({ bytesTransferred: 0, totalBytes: file.size, percentage: 25 })
        await new Promise(resolve => setTimeout(resolve, 500))
        onProgress({ bytesTransferred: 0, totalBytes: file.size, percentage: 50 })
        await new Promise(resolve => setTimeout(resolve, 500))
        onProgress({ bytesTransferred: 0, totalBytes: file.size, percentage: 75 })
        await new Promise(resolve => setTimeout(resolve, 500))
        onProgress({ bytesTransferred: 0, totalBytes: file.size, percentage: 100 })
      }
      
             // Clear cache when new document is processed
       this.documentCache.clear()
       
       // Return the complete metadata
       return finalMetadata
     } catch (error) {
       console.error('Processing failed:', error)
       throw error
     }
   }

  // Helper method to update document status
  private async updateDocumentStatus(documentId: string, status: 'pending' | 'processing' | 'uploading' | 'completed' | 'failed') {
    try {
      const docRef = doc(db, 'documents', documentId)
      await updateDoc(docRef, {
        processingStatus: status,
        lastModified: serverTimestamp()
      })
    } catch (error) {
      console.warn('Failed to update document status:', error)
    }
  }

  // Retry failed processing (storage functionality removed)
  async retryFailedUpload(documentId: string, file: File, uid: string): Promise<DocumentMetadata> {
    try {
      // Update status to processing
      await this.updateDocumentStatus(documentId, 'processing')
      
      // Get the document to get its metadata
      const docRef = doc(db, 'documents', documentId)
      const docSnap = await getDoc(docRef)
      
      if (!docSnap.exists()) {
        throw new Error('Document not found')
      }
      
      const existingData = docSnap.data()
      
      // Simulate reprocessing
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Update the document with completed status
      await updateDoc(docRef, {
        processingStatus: 'completed',
        lastModified: serverTimestamp()
      })
      
      return {
        ...existingData,
        id: documentId,
        processingStatus: 'completed'
      } as DocumentMetadata
      
    } catch (error) {
      console.error('Error retrying processing:', error)
      throw error
    }
  }

  // Get document by ID
  async getDocument(id: string): Promise<DocumentMetadata | null> {
    try {
      const docRef = doc(db, 'documents', id)
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        const data = docSnap.data()
        return {
          ...data,
          uploadedAt: data.uploadedAt?.toDate(),
          lastModified: data.lastModified?.toDate()
        } as DocumentMetadata
      }
      return null
    } catch (error) {
      console.error('Error getting document:', error)
      throw new Error(`Failed to get document: ${error}`)
    }
  }

  // Get all documents for a user with pagination, caching, and performance optimization
  async getUserDocuments(
    uid: string, 
    options: {
      limit?: number
      orderBy?: 'uploadedAt' | 'fileName' | 'fileSize'
      orderDirection?: 'asc' | 'desc'
      category?: string
      tags?: string[]
      startAfter?: any // For pagination
      useCache?: boolean // Whether to use cache
    } = {}
  ): Promise<DocumentMetadata[]> {
    try {
      console.log('Fetching documents for user:', uid, 'with options:', options)
      
      // Use backend API to fetch documents from Firebase Storage
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8000'
      const response = await fetch(`${backendUrl}/documents/${uid}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch documents: ${response.statusText}`)
      }
      
      const data = await response.json()
      let documents: DocumentMetadata[] = data.documents || []
      
      // Apply client-side filtering and sorting
      // Apply category filter
      if (options.category) {
        documents = documents.filter(doc => doc.category === options.category)
      }
      
      // Apply tags filter
      if (options.tags && options.tags.length > 0) {
        documents = documents.filter(doc => 
          doc.tags && options.tags!.some(tag => doc.tags!.includes(tag))
        )
      }
      
      // Apply sorting
      if (options.orderBy) {
        documents.sort((a, b) => {
          let aValue: any, bValue: any
          
          switch (options.orderBy) {
            case 'uploadedAt':
              aValue = new Date(a.uploadedAt).getTime()
              bValue = new Date(b.uploadedAt).getTime()
              break
            case 'fileName':
              aValue = a.fileName.toLowerCase()
              bValue = b.fileName.toLowerCase()
              break
            case 'fileSize':
              aValue = a.fileSize
              bValue = b.fileSize
              break
            default:
              return 0
          }
          
          if (options.orderDirection === 'asc') {
            return aValue > bValue ? 1 : -1
          } else {
            return aValue < bValue ? 1 : -1
          }
        })
      }
      
      // Apply pagination
      if (options.startAfter) {
        const startIndex = documents.findIndex(doc => doc.id === options.startAfter)
        if (startIndex !== -1) {
          documents = documents.slice(startIndex + 1)
        }
      }
      
      // Apply limit
      if (options.limit) {
        documents = documents.slice(0, options.limit)
      }
      
      console.log(`Found ${documents.length} documents for user ${uid}`)
      return documents
      
    } catch (error) {
      console.error('Error fetching user documents:', error)
      throw new Error(`Failed to fetch documents: ${error}`)
    }
  }

  // Get documents count for pagination
  async getUserDocumentsCount(uid: string, category?: string): Promise<number> {
    try {
      let q = query(
        collection(db, 'documents'),
        where('uid', '==', uid)
      )
      
      if (category) {
        q = query(q, where('category', '==', category))
      }
      
      const querySnapshot = await getDocs(q)
      return querySnapshot.size
    } catch (error) {
      console.error('Error getting document count:', error)
      return 0
    }
  }

  // Update document metadata
  async updateDocument(
    id: string, 
    updates: Partial<DocumentMetadata>
  ): Promise<void> {
    try {
      const docRef = doc(db, 'documents', id)
      await updateDoc(docRef, {
        ...updates,
        lastModified: serverTimestamp()
      })
      
      // Clear cache when document is updated
      this.documentCache.clear()
    } catch (error) {
      console.error('Error updating document:', error)
      throw new Error(`Failed to update document: ${error}`)
    }
  }

  // Delete document from Firebase Storage via backend API
  async deleteDocument(id: string): Promise<void> {
    try {
      // Call backend API to delete the document
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8000'
      const response = await fetch(`${backendUrl}/documents/${encodeURIComponent(id)}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || `Failed to delete document: ${response.statusText}`)
      }
      
      const result = await response.json()
      console.log('Document deleted:', result)
      
      // Clear cache when document is deleted
      this.documentCache.clear()
    } catch (error) {
      console.error('Error deleting document:', error)
      throw new Error(`Failed to delete document: ${error}`)
    }
  }

  // Search documents by text (searches in filename, description, and tags)
  async searchDocuments(
    uid: string, 
    searchTerm: string,
    options: {
      limit?: number
      category?: string
    } = {}
  ): Promise<DocumentMetadata[]> {
    try {
      // Note: Firestore doesn't support full-text search natively
      // This is a simple implementation that searches in specific fields
      // For production, consider using Algolia or similar search service
      
      let q = query(
        collection(db, 'documents'),
        where('uid', '==', uid)
      )
      
      if (options.category) {
        q = query(q, where('category', '==', options.category))
      }
      
      if (options.limit) {
        q = query(q, limit(options.limit))
      }
      
      const querySnapshot = await getDocs(q)
      const documents: DocumentMetadata[] = []
      
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        const document = {
          ...data,
          id: doc.id,
          uploadedAt: data.uploadedAt?.toDate(),
          lastModified: data.lastModified?.toDate()
        } as DocumentMetadata
        
        // Simple text search
        const searchLower = searchTerm.toLowerCase()
        const matches = 
          document.fileName.toLowerCase().includes(searchLower) ||
          document.originalName.toLowerCase().includes(searchLower) ||
          document.description?.toLowerCase().includes(searchLower) ||
          document.tags?.some(tag => tag.toLowerCase().includes(searchLower))
        
        if (matches) {
          documents.push(document)
        }
      })
      
      return documents
    } catch (error) {
      console.error('Error searching documents:', error)
      throw new Error(`Failed to search documents: ${error}`)
    }
  }

  // Get document categories for a user
  async getUserDocumentCategories(uid: string): Promise<string[]> {
    try {
      const documents = await this.getUserDocuments(uid)
      const categories = new Set<string>()
      
      documents.forEach(doc => {
        if (doc.category) {
          categories.add(doc.category)
        }
      })
      
      return Array.from(categories)
    } catch (error) {
      console.error('Error getting document categories:', error)
      throw new Error(`Failed to get document categories: ${error}`)
    }
  }

  // Get documents by processing status
  async getDocumentsByStatus(uid: string, status: 'pending' | 'processing' | 'uploading' | 'completed' | 'failed'): Promise<DocumentMetadata[]> {
    try {
      const q = query(
        collection(db, 'documents'),
        where('uid', '==', uid),
        where('processingStatus', '==', status)
      )
      
      const querySnapshot = await getDocs(q)
      const documents: DocumentMetadata[] = []
      
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        const document = {
          ...data,
          id: doc.id,
          uploadedAt: data.uploadedAt?.toDate(),
          lastModified: data.lastModified?.toDate()
        } as DocumentMetadata
        documents.push(document)
      })
      
      return documents
    } catch (error) {
      console.error('Error getting documents by status:', error)
      throw new Error(`Failed to get documents by status: ${error}`)
    }
  }

  // Get documents that are still uploading
  async getUploadingDocuments(uid: string): Promise<DocumentMetadata[]> {
    return this.getDocumentsByStatus(uid, 'uploading')
  }

  // Get document statistics for a user (storage functionality removed)
  async getUserStorageStats(uid: string): Promise<{
    totalFiles: number
    totalSize: number
    categories: { [key: string]: { count: number; size: number } }
  }> {
    try {
      const documents = await this.getUserDocuments(uid)
      const stats = {
        totalFiles: documents.length,
        totalSize: 0, // Storage disabled
        categories: {} as { [key: string]: { count: number; size: number } }
      }
      
      documents.forEach(doc => {
        // No storage size calculation
        const category = doc.category || 'Uncategorized'
        if (!stats.categories[category]) {
          stats.categories[category] = { count: 0, size: 0 }
        }
        stats.categories[category].count++
        stats.categories[category].size += 0 // Storage disabled
      })
      
      return stats
    } catch (error) {
      console.error('Error getting document stats:', error)
      throw new Error(`Failed to get document stats: ${error}`)
    }
  }
}

export default DocumentService.getInstance()
