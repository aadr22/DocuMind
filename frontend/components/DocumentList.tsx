'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import documentService, { DocumentMetadata } from '@/utils/documentService'
import LoadingSpinner from '@/components/LoadingSpinner'
import { 
  Search, 
  Filter, 
  File, 
  Download, 
  Trash2, 
  Edit, 
  Eye, 
  Calendar,
  HardDrive,
  Tag,
  MoreVertical,
  Plus,
  RefreshCw
} from 'lucide-react'
import { toast } from '@/utils/toast'



export default function DocumentList() {
  const { user } = useAuth()
  const [documents, setDocuments] = useState<DocumentMetadata[]>([])
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'uploadedAt' | 'fileName' | 'fileSize'>('uploadedAt')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [stats, setStats] = useState<{
    totalFiles: number
    totalSize: number
    categories: { [key: string]: { count: number; size: number } }
  }>({ totalFiles: 0, totalSize: 0, categories: {} })
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [totalDocuments, setTotalDocuments] = useState(0)
  const documentsPerPage = 20

  useEffect(() => {
    if (user) {
      loadDocuments()
      loadCategories()
    }
  }, [user, sortBy, sortDirection, selectedCategory, currentPage])

  // Update stats whenever documents change
  useEffect(() => {
    if (user && documents.length > 0) {
      loadStats()
    }
  }, [documents])

  const loadDocuments = async (isRefresh = false) => {
    if (!user) return
    
    try {
      setLoading(true)
      console.log('Loading documents for user:', user.uid)
      
      // Reset pagination if refreshing
      if (isRefresh) {
        setCurrentPage(1)
        setHasMore(true)
        setDocuments([]) // Clear existing documents
      }
      
      // For initial load or refresh, don't use pagination
      const docs = await documentService.getUserDocuments(user.uid, {
        limit: documentsPerPage,
        orderBy: sortBy,
        orderDirection: sortDirection,
        category: selectedCategory === 'all' ? undefined : selectedCategory,
        useCache: true // Enable caching for better performance
      })
      
      console.log('Documents loaded:', docs.length)
      setDocuments(docs)
      
      // Check if we have more documents
      setHasMore(docs.length === documentsPerPage)
      
      // Get total count for pagination info
      const total = await documentService.getUserDocumentsCount(
        user.uid, 
        selectedCategory === 'all' ? undefined : selectedCategory
      )
      setTotalDocuments(total)
      console.log('Total documents:', total)
      
    } catch (error) {
      console.error('Error loading documents:', error)
      toast.error('Failed to load documents. Please try again.')
      // Set empty documents array on error
      setDocuments([])
    } finally {
      setLoading(false)
    }
  }

  const loadMoreDocuments = async () => {
    if (!loading && hasMore && documents.length > 0 && user) {
      try {
        setLoading(true)
        console.log('Loading more documents...')
        
        // Get the last document for pagination
        const lastDocument = documents[documents.length - 1]
        
        const moreDocs = await documentService.getUserDocuments(user.uid, {
          limit: documentsPerPage,
          orderBy: sortBy,
          orderDirection: sortDirection,
          category: selectedCategory === 'all' ? undefined : selectedCategory,
          startAfter: lastDocument,
          useCache: false // Don't cache pagination results
        })
        
        console.log('More documents loaded:', moreDocs.length)
        setDocuments(prev => [...prev, ...moreDocs])
        setHasMore(moreDocs.length === documentsPerPage)
        setCurrentPage(prev => prev + 1)
        
      } catch (error) {
        console.error('Error loading more documents:', error)
        toast.error('Failed to load more documents')
      } finally {
        setLoading(false)
      }
    }
  }

  const refreshDocuments = () => {
    loadDocuments(true)
  }

  const loadCategories = async () => {
    if (!user) return
    
    try {
      const cats = await documentService.getUserDocumentCategories(user.uid)
      setCategories(cats)
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  const loadStats = async () => {
    if (!user) return
    
    try {
      // Calculate real stats from documents
      const realStats = {
        totalFiles: documents.length,
        totalSize: documents.reduce((sum, doc) => sum + (doc.fileSize || 0), 0),
        categories: documents.reduce((acc, doc) => {
          const category = doc.category || 'Uncategorized'
          if (!acc[category]) {
            acc[category] = { count: 0, size: 0 }
          }
          acc[category].count++
          acc[category].size += doc.fileSize || 0
          return acc
        }, {} as { [key: string]: { count: number; size: number } })
      }
      setStats(realStats)
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const handleSearch = async () => {
    if (!user || !searchTerm.trim()) {
      await loadDocuments()
      return
    }
    
    try {
      setLoading(true)
      const results = await documentService.searchDocuments(user.uid, searchTerm.trim(), {
        category: selectedCategory === 'all' ? undefined : selectedCategory
      })
      setDocuments(results)
    } catch (error) {
      console.error('Error searching documents:', error)
      toast.error('Search failed')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      return
    }
    
    try {
      await documentService.deleteDocument(documentId)
      setDocuments(prev => prev.filter(doc => doc.id !== documentId))
      await loadStats() // Refresh stats
      toast.success('Document deleted successfully')
    } catch (error) {
      console.error('Error deleting document:', error)
      toast.error('Failed to delete document')
    }
  }

  const handleSort = (field: 'uploadedAt' | 'fileName' | 'fileSize') => {
    if (sortBy === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortDirection('desc')
    }
  }

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (date: Date | string) => {
    if (!date) return 'N/A'
    const dateObj = typeof date === 'string' ? new Date(date) : date
    if (isNaN(dateObj.getTime())) return 'Invalid date'
    
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(dateObj)
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return '📄'
    if (mimeType.includes('image')) return '🖼️'
    if (mimeType.includes('text')) return '📝'
    if (mimeType.includes('word') || mimeType.includes('document')) return '📄'
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊'
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📽️'
    return '📁'
  }

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Please sign in to view your documents</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Documents</h2>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Files</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{stats.totalFiles}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400">Storage Used</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{formatFileSize(stats.totalSize)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="w-full md:w-48">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div className="w-full md:w-48">
            <select
              value={`${sortBy}-${sortDirection}`}
              onChange={(e) => {
                const [field, direction] = e.target.value.split('-')
                setSortBy(field as 'uploadedAt' | 'fileName' | 'fileSize')
                setSortDirection(direction as 'asc' | 'desc')
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="uploadedAt-desc">Newest First</option>
              <option value="uploadedAt-asc">Oldest First</option>
              <option value="fileName-asc">Name A-Z</option>
              <option value="fileName-desc">Name Z-A</option>
              <option value="fileSize-desc">Largest First</option>
              <option value="fileSize-asc">Smallest First</option>
            </select>
          </div>

          {/* Search Button */}
          <button
            onClick={handleSearch}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          >
            Search
          </button>
        </div>
      </div>

      {/* Documents List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        {loading ? (
          <div className="p-8 text-center">
            <LoadingSpinner />
            <p className="mt-2 text-gray-500">Loading documents...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="p-8 text-center">
            <File className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No documents found</p>
            {searchTerm && (
              <p className="text-sm text-gray-400 mt-2">
                Try adjusting your search terms or filters
              </p>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {documents.map((document) => (
              <div key={document.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-2xl">{getFileIcon(document.mimeType)}</div>
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        {document.originalName}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mt-1">
                        <span className="flex items-center">
                          <HardDrive className="w-4 h-4 mr-1" />
                          {formatFileSize(document.fileSize)}
                        </span>
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {formatDate(document.uploadedAt)}
                        </span>
                        {document.category && (
                          <span className="flex items-center">
                            <Tag className="w-4 h-4 mr-1" />
                            {document.category}
                          </span>
                        )}
                      </div>
                      {document.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                          {document.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {document.downloadURL && (
                      <>
                        <a
                          href={document.downloadURL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-colors"
                          title="View document"
                        >
                          <Eye className="w-4 h-4" />
                        </a>
                        <a
                          href={document.downloadURL}
                          download={document.originalName}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                          title="Download document"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      </>
                    )}

                    <button
                      onClick={() => document.id && handleDeleteDocument(document.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                      title="Delete document"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Pagination */}
        {documents.length > 0 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing {documents.length} of {totalDocuments} documents
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={refreshDocuments}
                disabled={loading}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              
              {hasMore && (
                <button
                  onClick={loadMoreDocuments}
                  disabled={loading}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Loading...' : 'Load More'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
