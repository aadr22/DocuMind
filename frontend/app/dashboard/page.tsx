'use client'

import React, { useState } from 'react'
import { Brain, FileText, MessageCircle } from 'lucide-react'
import FileUpload from '@/components/FileUpload'
import ResultsPanel from '@/components/ResultsPanel'
import ChatPanel from '@/components/ChatPanel'

interface ProcessedDocument {
  extracted_text: string
  summary: string
  file_url: string
  success: boolean
  message: string
}

export default function DashboardPage() {
  const [processedDocument, setProcessedDocument] = useState<ProcessedDocument | null>(null)

  const handleFileSelect = (file: File) => {
    // File selected, ready for upload
    console.log('File selected:', file.name)
  }

  const handleFileUpload = (file: File, document: ProcessedDocument) => {
    setProcessedDocument(document)
    
    // Show success toast
    import('@/utils/toast').then(({ toast }) => {
      toast.success('Document processed successfully!')
    })
  }

  return (
    <div className="min-h-screen gradient-bg">
      {/* Modern Navbar */}
      <header className="glass-card mx-4 mt-4 mb-6">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-glow">
              <Brain className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                DocuMind AI
              </h1>
              <p className="text-sm text-slate-500 font-medium">Intelligent Document Processing</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-slate-600 bg-white/60 px-3 py-2 rounded-lg">
              <span className="font-medium">Demo Mode</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Dashboard Layout */}
      <main className="px-4 pb-8">
        {!processedDocument ? (
          // Upload Section - Full Width
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold text-slate-800 mb-4">
                Upload Your Document
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Drop a PDF, JPG, or PNG file to extract text and get an AI-powered summary. 
                Our advanced OCR and AI technology will analyze your document in seconds.
              </p>
            </div>
            
            <FileUpload
              onFileSelect={handleFileSelect}
              onFileUpload={handleFileUpload}
            />
          </div>
        ) : (
          // Two-Column Layout: Left (Upload + Results) + Right (Chat)
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              {/* Left Column - Upload + Results */}
              <div className="xl:col-span-2 space-y-8">
                {/* Upload Section */}
                <div className="card">
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-slate-800 mb-2">
                      Process Another Document
                    </h3>
                    <p className="text-slate-600">
                      Upload a new file to analyze
                    </p>
                  </div>
                  
                  <FileUpload
                    onFileSelect={handleFileSelect}
                    onFileUpload={handleFileUpload}
                  />
                </div>

                {/* Results Panel */}
                <ResultsPanel document={processedDocument} />
              </div>

              {/* Right Column - Chat Panel */}
              <div className="xl:col-span-1">
                <ChatPanel
                  extractedText={processedDocument.extracted_text}
                  isEnabled={true}
                />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
