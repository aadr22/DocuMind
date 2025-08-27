'use client'

import React, { useState, useCallback } from 'react'
import { Upload, File, X, Loader2 } from 'lucide-react'
import { cn } from '@/utils/cn'

interface ProcessedDocument {
  extracted_text: string
  summary: string
  file_url: string
  success: boolean
  message: string
}

interface FileUploadProps {
  onFileSelect: (file: File) => void
  onFileUpload: (file: File, document: ProcessedDocument) => void
  acceptedTypes?: string[]
}

export default function FileUpload({ 
  onFileSelect, 
  onFileUpload, 
  acceptedTypes = ['.pdf', '.jpg', '.jpeg', '.png']
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)

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
    if (selectedFile) {
      try {
        setIsUploading(true)
        setUploadProgress(0)
        
        // Simulate upload progress
        const interval = setInterval(() => {
          setUploadProgress(prev => {
            if (prev >= 90) {
              clearInterval(interval)
              return 90
            }
            return prev + 10
          })
        }, 100)

        // Send file to backend API
        const formData = new FormData()
        formData.append('file', selectedFile)

        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8000'
        const response = await fetch(`${backendUrl}/process-document`, {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        
        if (data.success) {
          setUploadProgress(100)
          
          // Call the callback with the processed document
          onFileUpload(selectedFile, data)
          
          // Reset state
          setSelectedFile(null)
          setUploadProgress(0)
        } else {
          throw new Error(data.message || 'Failed to process document')
        }
      } catch (error) {
        console.error('Upload failed:', error)
        setUploadProgress(0)
        // Show error toast
        import('@/utils/toast').then(({ toast }) => {
          toast.error(error instanceof Error ? error.message : 'Upload failed. Please try again.')
        })
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
             ? "border-blue-400 bg-blue-50/50 shadow-glow" 
             : "border-slate-300 hover:border-blue-300 hover:shadow-md",
           selectedFile && "border-green-400 bg-green-50/50 shadow-glow"
         )}
         onDragEnter={handleDrag}
         onDragLeave={handleDrag}
         onDragOver={handleDrag}
         onDrop={handleDrop}
       >
        {!selectedFile ? (
          <>
                                   <div className="mx-auto h-16 w-16 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mb-4 shadow-soft">
                         <Upload className="h-8 w-8 text-blue-600" />
                       </div>
                       <p className="text-xl font-semibold text-slate-800 mb-2">
                         Drop your document here
                       </p>
                       <p className="text-slate-600 mb-4">
                         or click to browse files
                       </p>
                       <p className="text-sm text-slate-500">
                         Supported formats: {acceptedTypes.join(', ')}
                       </p>
            <input
              type="file"
              accept={acceptedTypes.join(',')}
              onChange={handleFileInput}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="btn-primary inline-block cursor-pointer"
            >
              Choose File
            </label>
          </>
        ) : (
                                 <div className="space-y-4">
                         <div className="flex items-center justify-center space-x-3">
                           <div className="p-2 bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl">
                             <File className="h-6 w-6 text-green-600" />
                           </div>
                           <div className="text-left">
                             <p className="font-semibold text-slate-800">{selectedFile.name}</p>
                             <p className="text-sm text-slate-500">
                               {formatFileSize(selectedFile.size)}
                             </p>
                           </div>
                           <button
                             onClick={removeFile}
                             className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                           >
                             <X className="h-5 w-5 text-slate-500" />
                           </button>
                         </div>
            
                                   {/* Upload Progress */}
                       {uploadProgress > 0 && (
                         <div className="w-full bg-slate-200 rounded-full h-3 shadow-inner">
                           <div 
                             className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full transition-all duration-300 shadow-sm"
                             style={{ width: `${uploadProgress}%` }}
                           />
                         </div>
                       )}
            
            {/* Upload Button */}
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className={cn(
                "btn-primary w-full",
                isUploading && "opacity-50 cursor-not-allowed"
              )}
            >
              {isUploading ? (
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
