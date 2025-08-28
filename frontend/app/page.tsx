'use client'

import React, { useState, useEffect } from 'react'
import FileUpload from '@/components/FileUpload'
import ChatPanel from '@/components/ChatPanel'
import ResultsPanel from '@/components/ResultsPanel'
import ProcessingDashboard from '@/components/ProcessingDashboard'
import FloatingParticles from '@/components/FloatingParticles'
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
    console.log('handleProcessingStart called with:', processId) // Debug log
    setCurrentProcessId(processId)
    setIsProcessing(true)
    console.log('Processing state set to true') // Debug log
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      <FloatingParticles />
      {/* Header */}
             <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-700 sticky top-0 z-50 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
                             <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25 animate-float">
                 <Brain className="h-6 w-6 text-white" />
               </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                DocuMind AI
              </h1>
            </div>
            <div className="text-sm text-slate-300">
              AI-Powered Document Analysis
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
      </main>
    </div>
  )
}
