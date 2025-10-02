/**
 * Document-related interfaces following Interface Segregation Principle
 * Each interface has a single, focused responsibility
 */

export interface IDocumentStorage {
  /** File storage operations */
  upload(file: File, metadata: Partial<DocumentMetadata>): Promise<string>
  delete(path: string): Promise<void>
  getDownloadURL(path: string): Promise<string>
}

export interface IDocumentMetadata {
  /** Document metadata operations */
  create(metadata: DocumentMetadata): Promise<void>
  update(id: string, updates: Partial<DocumentMetadata>): Promise<void>
  get(id: string): Promise<DocumentMetadata | null>
  delete(id: string): Promise<void>
}

export interface IDocumentSearch {
  /** Document search operations */
  search(query: string, options?: SearchOptions): Promise<DocumentMetadata[]>
  getByCategory(category: string): Promise<DocumentMetadata[]>
  getByTags(tags: string[]): Promise<DocumentMetadata[]>
}

export interface IDocumentAnalytics {
  /** Document analytics operations */
  getStorageStats(uid: string): Promise<StorageStats>
  getCategories(uid: string): Promise<string[]>
  getProcessingStats(uid: string): Promise<ProcessingStats>
}

// Supporting types
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

export interface SearchOptions {
  limit?: number
  category?: string
  tags?: string[]
  dateRange?: {
    start: Date
    end: Date
  }
}

export interface StorageStats {
  totalFiles: number
  totalSize: number
  categories: { [key: string]: { count: number; size: number } }
}

export interface ProcessingStats {
  totalProcessed: number
  successRate: number
  averageProcessingTime: number
  processingMethods: { [key: string]: number }
}
