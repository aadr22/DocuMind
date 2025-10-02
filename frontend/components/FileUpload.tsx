'use client'

import React, { useState, useCallback } from 'react'
import { Upload, File, X, Loader2, AlertCircle } from 'lucide-react'
import { cn } from '@/utils/cn'
import { useAuth } from '@/contexts/AuthContext'
import documentService, { DocumentMetadata, UploadProgress } from '@/utils/documentService'
import { toast } from '@/utils/toast'

interface ProcessedDocument {
  extracted_text: string
  summary: string
  file_url: string  // Will always be empty - storage disabled
  success: boolean
  message: string
}

interface FileUploadProps {
  onFileSelect: (file: File) => void
  onFileUpload: (file: File, document: ProcessedDocument) => void
  onProcessingStart?: (processId: string) => void
  acceptedTypes?: string[]
  onDocumentUploaded?: (document: DocumentMetadata) => void
}

export default function FileUpload({ 
  onFileSelect, 
  onFileUpload, 
  onProcessingStart,
  acceptedTypes = ['.pdf', '.jpg', '.jpeg', '.png'],
  onDocumentUploaded
}: FileUploadProps) {
  const { user } = useAuth()
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStep, setProcessingStep] = useState('')
  const [error, setError] = useState('')

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      handleFileSelect(file)
    }
  }, [])

  const handleFileSelect = (file: File) => {
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
    
    // Check file size (max 10MB for performance)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      alert(`File too large! Please select a file smaller than 10MB. Current size: ${(file.size / 1024 / 1024).toFixed(1)}MB`)
      return
    }
    
    if (acceptedTypes.includes(fileExtension)) {
      setSelectedFile(file)
      onFileSelect(file)
    } else {
      alert(`Please select a valid file type: ${acceptedTypes.join(', ')}`)
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!user) {
      setError('Please sign in to upload documents')
      toast.error('Please sign in to upload documents')
      return
    }

    if (selectedFile) {
      try {
        setIsUploading(true)
        setIsProcessing(true)
        setUploadProgress(0)
        setProcessingStep('Preparing upload...')
        setError('')
        
        console.log('Starting upload for file:', selectedFile.name)
        
        // Create FormData for file upload
        const formData = new FormData()
        formData.append('file', selectedFile)
        formData.append('user_id', user.uid) // Add user ID to the request
        
        console.log('Uploading with user_id:', user.uid) // Debug log
        
        setProcessingStep('Uploading document...')
        setUploadProgress(10)
        
        // Call the backend API to process the document
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_URL}/process-document`, {
          method: 'POST',
          body: formData,
        })
        
        if (!response.ok) {
          throw new Error(`Upload failed: ${response.statusText}`)
        }
        
        const result = await response.json()
        console.log('Backend response:', result)
        
        if (!result.process_id) {
          throw new Error('No process ID returned from backend')
        }
        
        // Start polling for processing status
        const processId = result.process_id
        setProcessingStep('Processing document...')
        setUploadProgress(25)
        
        // Poll for processing status
        const pollStatus = async () => {
          try {
            const statusResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_URL}/process-status/${processId}`)
            if (!statusResponse.ok) {
              throw new Error('Failed to get processing status')
            }
            
            const status = await statusResponse.json()
            console.log('Processing status:', status)
            
            // Update progress based on status
            setUploadProgress(Math.min(status.progress || 0, 90))
            setProcessingStep(status.current_step || 'Processing...')
            
            if (status.status === 'completed') {
              setUploadProgress(100)
              setProcessingStep('Document processed successfully!')
              
              // Create document metadata from the processed result
              const document: DocumentMetadata = {
                uid: user.uid,
                fileName: selectedFile.name,
                originalName: selectedFile.name,
                fileSize: selectedFile.size,
                fileType: selectedFile.name.split('.').pop() || '',
                mimeType: selectedFile.type,
                storagePath: '', // Storage disabled
                uploadedAt: new Date(),
                lastModified: new Date(selectedFile.lastModified),
                category: 'General',
                description: `Processed via DocuMind on ${new Date().toLocaleDateString()}`,
                tags: ['processed', 'documind'],
                processingStatus: 'completed',
                aiAnalysis: {
                  summary: status.result?.summary || 'AI summary generated',
                  keywords: status.result?.keywords || ['processed', 'documind'],
                  sentiment: 'neutral',
                  confidence: 0.9
                }
              }
              
              console.log('Processing completed, document:', document)
              
              // Call the callback for document processed
              if (onDocumentUploaded) {
                onDocumentUploaded(document)
              }
              
              // Call the file upload callback with the processed document
              const processedDoc: ProcessedDocument = {
                extracted_text: status.result?.extracted_text || '',
                summary: status.result?.summary || '',
                file_url: '',
                success: true,
                message: 'Document processed successfully'
              }
              
              if (onFileUpload) {
                onFileUpload(selectedFile, processedDoc)
              }
              
              // Reset state after successful processing
              setTimeout(() => {
                setSelectedFile(null)
                setUploadProgress(0)
                setIsProcessing(false)
                setProcessingStep('')
                toast.success('Document processed successfully!')
              }, 2000)
              
            } else if (status.status === 'error') {
              throw new Error(status.errors?.[0] || 'Processing failed')
            } else {
              // Continue polling
              setTimeout(pollStatus, 1000)
            }
            
          } catch (error) {
            console.error('Error polling status:', error)
            throw error
          }
        }
        
        // Start polling
        await pollStatus()

      } catch (error) {
        console.error('Upload failed:', error)
        const errorMessage = error instanceof Error ? error.message : 'Upload failed. Please try again.'
        setError(errorMessage)
        setUploadProgress(0)
        setIsProcessing(false)
        setProcessingStep('')
        toast.error(errorMessage)
      } finally {
        setIsUploading(false)
      }
    }
  }

  const removeFile = () => {
    setSelectedFile(null)
    setUploadProgress(0)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="w-full">
             {/* Drag and Drop Area */}
               <div
          className={cn(
            "border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300",
            dragActive 
              ? "border-blue-400 bg-blue-900/20 shadow-glow border-opacity-60" 
              : "border-slate-600 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/20",
            selectedFile && "border-emerald-400 bg-emerald-900/20 shadow-glow border-opacity-60"
          )}
         onDragEnter={handleDrag}
         onDragLeave={handleDrag}
         onDragOver={handleDrag}
         onDrop={handleDrop}
       >
        {!selectedFile ? (
          <>
                                           <div className="mx-auto h-16 w-16 bg-gradient-to-r from-blue-900/40 to-indigo-900/40 rounded-2xl flex items-center justify-center mb-4 shadow-soft border border-blue-500/30">
          <Upload className="h-8 w-8 text-blue-400" />
        </div>
        <p className="text-xl font-semibold text-white mb-2">
          Drop your document here
        </p>
        <p className="text-slate-300 mb-4">
          or click to browse files
        </p>
        <p className="text-sm text-slate-400">
          Supported formats: {acceptedTypes.join(', ')}
        </p>
        
        {/* Error Display */}
        {error && (
          <div className="mt-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <span className="text-sm text-red-300">{error}</span>
          </div>
        )}
            <input
              type="file"
              accept={acceptedTypes.join(',')}
              onChange={handleFileInput}
              className="hidden"
              id="file-upload"
            />
                         <label
               htmlFor="file-upload"
               className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105 cursor-pointer border border-blue-500/30 mt-4"
             >
               <Upload className="h-4 w-4 mr-2" />
               Choose File
             </label>
          </>
        ) : (
                                 <div className="space-y-4">
                                                   <div className="flex items-center justify-center space-x-3">
                            <div className="p-2 bg-gradient-to-r from-emerald-900/40 to-green-900/40 rounded-xl border border-emerald-500/30">
                              <File className="h-6 w-6 text-emerald-400" />
                            </div>
                            <div className="text-left">
                              <p className="font-semibold text-white">{selectedFile.name}</p>
                              <p className="text-sm text-slate-300">
                                {formatFileSize(selectedFile.size)}
                              </p>
                            </div>
                                                       <button
                              onClick={removeFile}
                              className="p-2 hover:bg-slate-700/50 rounded-full transition-all duration-200 hover:scale-110 hover:shadow-lg hover:shadow-red-500/20 group"
                            >
                              <X className="h-5 w-5 text-slate-400 group-hover:text-red-400 transition-colors" />
                            </button>
                         </div>
            
                                               {/* Enhanced Progress Display */}
            {(uploadProgress > 0 || isProcessing) && (
              <div className="space-y-3">
                {/* Progress Bar */}
                <div className="w-full bg-slate-800 rounded-full h-4 shadow-inner border border-slate-700">
                  <div 
                    className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 h-4 rounded-full transition-all duration-300 shadow-sm"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                
                {/* Progress Info */}
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-300 font-medium">
                    {uploadProgress < 100 ? 'Uploading...' : 'Processing...'}
                  </span>
                  <span className="text-blue-400 font-bold text-lg">{uploadProgress}%</span>
                </div>
                
                {/* Current Step */}
                {processingStep && (
                  <div className="text-center p-3 bg-blue-900/20 rounded-lg border border-blue-500/30 backdrop-blur-sm">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                      <span className="text-sm text-blue-300 font-medium">{processingStep}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
            
                         {/* Upload Button */}
                           <button
                onClick={handleUpload}
                disabled={isUploading || isProcessing}
                className={cn(
                  "w-full px-6 py-4 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:shadow-emerald-500/25 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 disabled:shadow-lg border border-emerald-500/30",
                  (isUploading || isProcessing) && "animate-pulse"
                )}
              >
               {isUploading ? (
                 <>
                   <Loader2 className="h-4 w-4 animate-spin mr-2" />
                   Uploading...
                 </>
               ) : isProcessing ? (
                 <>
                   <Loader2 className="h-4 w-4 animate-spin mr-2" />
                   Processing...
                 </>
               ) : (
                 'Process Document'
               )}
             </button>
          </div>
        )}
      </div>
    </div>
  )
}
