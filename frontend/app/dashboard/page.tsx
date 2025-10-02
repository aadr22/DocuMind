'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { FileText, Plus, ArrowLeft } from 'lucide-react'
import DocumentList from '@/components/DocumentList'
import LoadingSpinner from '@/components/LoadingSpinner'
import { toast } from '@/utils/toast'

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [refreshDocuments, setRefreshDocuments] = useState(0)

  useEffect(() => {
    // Only redirect if we're sure there's no user and not loading
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  const handleDocumentDeleted = () => {
    // Refresh document list when a document is deleted
    setRefreshDocuments(prev => prev + 1)
    toast.success('Document deleted successfully')
  }

  // Show loading spinner while authentication is being checked
  if (loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </div>
    )
  }

  // Show loading spinner while redirecting
  if (!user) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <LoadingSpinner size="lg" text="Redirecting to login..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen gradient-bg">
      {/* Main Dashboard Layout */}
      <main className="px-4 pb-8 pt-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-slate-800 mb-2">
                My Documents
              </h1>
              <p className="text-lg text-slate-600">
                Manage and organize all your processed documents
              </p>
            </div>
            
            {/* Upload New Document Button */}
            <button
              onClick={() => router.push('/')}
              className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Plus className="h-5 w-5" />
              <span>Upload New Document</span>
            </button>
          </div>

          {/* Back to Home Button */}
          <div className="mb-6">
            <button
              onClick={() => router.push('/')}
              className="flex items-center space-x-2 text-slate-600 hover:text-slate-800 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Home</span>
            </button>
          </div>

          {/* Document List */}
          <div className="card">
            <DocumentList 
              key={refreshDocuments} // Force re-render when documents change
              onDocumentDeleted={handleDocumentDeleted}
            />
          </div>
        </div>
      </main>
    </div>
  )
}