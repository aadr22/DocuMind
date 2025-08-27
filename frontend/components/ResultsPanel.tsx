'use client'

import React, { useState } from 'react'
import { FileText, Copy, Check, ExternalLink, Download } from 'lucide-react'
import { cn } from '@/utils/cn'

interface ProcessedDocument {
  extracted_text: string
  summary: string
  file_url: string
  success: boolean
  message: string
  image_description?: string
  processing_method?: string
  confidence?: number
}

interface ResultsPanelProps {
  document: ProcessedDocument | null
  isLoading?: boolean
}

export default function ResultsPanel({ document, isLoading = false }: ResultsPanelProps) {
  const [copiedText, setCopiedText] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'summary' | 'text' | 'analysis'>('summary')

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedText(type)
      setTimeout(() => setCopiedText(null), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const downloadText = (text: string, filename: string) => {
    if (typeof window === 'undefined' || !window.document) return;
    
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = window.document.createElement('a')
    a.href = url
    a.download = filename
    window.document.body.appendChild(a)
    a.click()
    window.document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <div className="card">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  if (!document || !document.success) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500">
            {document?.message || 'Upload a document to see results'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
                       {/* Header */}
                 <div className="flex items-center justify-between mb-6">
                   <div>
                     <h2 className="text-2xl font-bold text-slate-800 mb-1">Document Results</h2>
                     <p className="text-slate-600">AI-powered analysis of your document</p>
                   </div>
                   {document.file_url && (
                     <div className="flex space-x-2">
                       <a
                         href={document.file_url}
                         target="_blank"
                         rel="noopener noreferrer"
                         className="btn-secondary text-sm flex items-center space-x-2"
                       >
                         <ExternalLink className="h-4 w-4" />
                         <span>View File</span>
                       </a>
                     </div>
                   )}
                 </div>

                       {/* Tabs */}
                 <div className="border-b border-slate-200 mb-6">
                   <nav className="-mb-px flex space-x-8">
                     <button
                       onClick={() => setActiveTab('summary')}
                       className={cn(
                         'py-3 px-1 border-b-2 font-semibold text-sm transition-colors duration-200',
                         activeTab === 'summary'
                           ? 'border-blue-500 text-blue-600'
                           : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                       )}
                     >
                       Summary
                     </button>
                     <button
                       onClick={() => setActiveTab('text')}
                       className={cn(
                         'py-3 px-1 border-b-2 font-semibold text-sm transition-colors duration-200',
                         activeTab === 'text'
                           ? 'border-blue-500 text-blue-600'
                           : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                       )}
                     >
                       Full Text
                     </button>
                     {document.image_description && (
                       <button
                         onClick={() => setActiveTab('analysis')}
                         className={cn(
                           'py-3 px-1 border-b-2 font-semibold text-sm transition-colors duration-200',
                           activeTab === 'analysis'
                             ? 'border-blue-500 text-blue-600'
                             : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                         )}
                       >
                         Image Analysis
                       </button>
                     )}
                   </nav>
                 </div>

      {/* Content */}
      <div className="space-y-4">
        {activeTab === 'summary' ? (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium text-gray-900">AI Summary</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => copyToClipboard(document.summary, 'summary')}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Copy summary"
                >
                  {copiedText === 'summary' ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
                <button
                  onClick={() => downloadText(document.summary, 'summary.txt')}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Download summary"
                >
                  <Download className="h-4 w-4" />
                </button>
              </div>
            </div>
                                   <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                         <p className="text-slate-700 leading-relaxed text-lg">{document.summary}</p>
                       </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium text-gray-900">Extracted Text</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => copyToClipboard(document.extracted_text, 'text')}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Copy text"
                >
                  {copiedText === 'text' ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
                <button
                  onClick={() => downloadText(document.extracted_text, 'extracted_text.txt')}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Download text"
                >
                  <Download className="h-4 w-4" />
                </button>
              </div>
            </div>
                                   <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl p-6 border border-slate-200 max-h-96 overflow-y-auto">
                         <p className="text-slate-700 whitespace-pre-wrap leading-relaxed text-base">
                           {document.extracted_text}
                         </p>
                       </div>
          </div>
        )}

        {/* Image Analysis Tab */}
        {activeTab === 'analysis' && document.image_description && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium text-gray-900">Image Analysis</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => copyToClipboard(document.image_description!, 'analysis')}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Copy analysis"
                >
                  {copiedText === 'analysis' ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
                <button
                  onClick={() => downloadText(document.image_description!, 'image_analysis.txt')}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Download analysis"
                >
                  <Download className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Processing Information */}
            {(document.processing_method || document.confidence) && (
              <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-100">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {document.processing_method && (
                    <div>
                      <span className="font-semibold text-purple-700">Processing Method:</span>
                      <span className="ml-2 text-purple-600 capitalize">{document.processing_method.replace('_', ' ')}</span>
                    </div>
                  )}
                  {document.confidence && (
                    <div>
                      <span className="font-semibold text-purple-700">Confidence:</span>
                      <span className="ml-2 text-purple-600">{(document.confidence * 100).toFixed(1)}%</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Image Description */}
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-100">
              <h4 className="font-semibold text-purple-800 mb-3">Visual Analysis</h4>
              <p className="text-slate-700 leading-relaxed text-base">
                {document.image_description}
              </p>
            </div>
          </div>
        )}
      </div>

                       {/* Success Message */}
                 <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
                   <div className="flex items-center">
                     <Check className="h-5 w-5 text-green-600 mr-3" />
                     <p className="text-green-700 text-sm font-semibold">
                       {document.message}
                     </p>
                   </div>
                 </div>
    </div>
  )
}
