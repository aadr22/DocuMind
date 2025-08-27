'use client'

import React, { useState, useEffect } from 'react'
import FileUpload from '@/components/FileUpload'
import ChatPanel from '@/components/ChatPanel'
import ResultsPanel from '@/components/ResultsPanel'
import { Brain, Upload, MessageSquare, FileText } from 'lucide-react'

interface ProcessedDocument {
  extracted_text: string
  summary: string
  file_url: string
  success: boolean
  message: string
}

export default function HomePage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [processedDocument, setProcessedDocument] = useState<ProcessedDocument | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleFileSelect = (file: File) => {
    setSelectedFile(file)
  }

  const handleFileUpload = async (file: File, document: ProcessedDocument) => {
    setProcessedDocument(document)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                DocuMind AI
              </h1>
            </div>
            <div className="text-sm text-gray-600">
              AI-Powered Document Analysis
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* File Upload */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-800">Upload Document</h2>
            <FileUpload 
              onFileSelect={handleFileSelect}
              onFileUpload={handleFileUpload} 
            />
          </div>

          {/* Results Panel */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-800">Document Analysis</h2>
            <ResultsPanel document={processedDocument} isLoading={isProcessing} />
          </div>
        </div>

        {/* Chat Panel */}
        <div className="mt-8">
          <ChatPanel
            extractedText={processedDocument?.extracted_text || ''}
            isEnabled={true}
          />
        </div>
      </main>
    </div>
  )
}
