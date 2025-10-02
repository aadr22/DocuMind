'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import FileUpload from '@/components/FileUpload'
import ChatPanel from '@/components/ChatPanel'
import ResultsPanel from '@/components/ResultsPanel'
import ProcessingDashboard from '@/components/ProcessingDashboard'
import FloatingParticles from '@/components/FloatingParticles'
import { Upload, MessageSquare, FileText } from 'lucide-react'

interface ProcessedDocument {
  extracted_text: string
  summary: string
  file_url: string
  success: boolean
  message: string
}

export default function HomePage() {
  const { user } = useAuth()
  const router = useRouter()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [processedDocument, setProcessedDocument] = useState<ProcessedDocument | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentProcessId, setCurrentProcessId] = useState<string | null>(null)

  const handleFileSelect = (file: File) => {
    setSelectedFile(file)
  }

  const handleFileUpload = async (file: File, document: ProcessedDocument) => {
    setProcessedDocument(document)
    setIsProcessing(false)
    setCurrentProcessId(null)
  }

  const handleProcessingStart = (processId: string) => {
    console.log('handleProcessingStart called with:', processId)
    setCurrentProcessId(processId)
    setIsProcessing(true)
    console.log('Processing state set to true')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      <FloatingParticles />
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!user ? (
          // Welcome Section for Unauthenticated Users
          <div className="text-center py-20">
            <div className="max-w-3xl mx-auto space-y-8">
              <h2 className="text-5xl font-bold text-white mb-6">
                Welcome to DocuMind AI
              </h2>
              <p className="text-xl text-slate-300 mb-8">
                The intelligent document processing platform that reads, analyzes, and helps you understand your documents with AI-powered insights. Documents are processed in real-time without storage.
              </p>
              <div className="flex items-center justify-center space-x-6">
                <button
                  onClick={() => router.push('/signup')}
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 shadow-2xl shadow-blue-500/25"
                >
                  Start Free Trial
                </button>
                <button
                  onClick={() => router.push('/login')}
                  className="border border-slate-600 text-slate-300 px-8 py-4 rounded-xl text-lg font-semibold hover:border-slate-500 hover:text-white transition-all duration-200"
                >
                  Sign In
                </button>
              </div>
            </div>
          </div>
        ) : (
          // Document Processing for Authenticated Users
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* File Upload */}
              <div className="space-y-6">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/25">
                    <Upload className="h-4 w-4 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">Upload Document</h2>
                </div>
                <FileUpload 
                  onFileSelect={handleFileSelect}
                  onFileUpload={handleFileUpload}
                  onProcessingStart={handleProcessingStart}
                />
              </div>

              {/* Results Panel */}
              <div className="space-y-6">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-green-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/25">
                    <FileText className="h-4 w-4 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">Document Analysis</h2>
                </div>
                <ResultsPanel document={processedDocument} isLoading={isProcessing} />
              </div>
            </div>

            {/* Real-time Processing Dashboard */}
            {isProcessing && currentProcessId && (
              <div className="mt-12">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full mb-4 shadow-2xl shadow-blue-500/25 animate-pulse">
                    <span className="text-2xl">🚀</span>
                  </div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent mb-3">
                    Processing Your Document
                  </h3>
                  <p className="text-slate-300 text-lg">
                    Watch the real-time progress as AI analyzes your document
                  </p>
                </div>
                <ProcessingDashboard
                  processId={currentProcessId}
                  isVisible={isProcessing}
                  onComplete={(result) => {
                    if (selectedFile) {
                      handleFileUpload(selectedFile, result)
                    }
                  }}
                />
              </div>
            )}

            {/* Chat Panel */}
            <div className="mt-12">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/25">
                  <MessageSquare className="h-4 w-4 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white">AI Chat Assistant</h2>
              </div>
              <ChatPanel
                extractedText={processedDocument?.extracted_text || ''}
                isEnabled={!!processedDocument?.extracted_text}
              />
            </div>

            {/* Dashboard Link */}
            <div className="mt-8 text-center">
              <p className="text-slate-400 mb-4">
                Want to manage your processed documents?
              </p>
              <button
                onClick={() => router.push('/dashboard')}
                className="inline-flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors"
              >
                <FileText className="h-4 w-4" />
                <span>View My Documents</span>
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
