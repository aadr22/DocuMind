'use client'

import React, { useState, useEffect } from 'react'
import { CheckCircle, AlertCircle, Clock, FileText, Brain, Upload, CheckSquare } from 'lucide-react'

interface ProcessingStep {
  name: string
  completed: boolean
  current: boolean
  error?: string
}

interface ProcessingStatus {
  id: string
  file_name: string
  file_size: number
  status: 'initializing' | 'processing' | 'completed' | 'error'
  progress: number
  current_step: string
  start_time: string
  steps: string[]
  completed_steps: string[]
  errors: Array<{ message: string; timestamp: string }>
  warnings: Array<{ message: string; timestamp: string }>
}

interface ProcessingDashboardProps {
  processId?: string
  isVisible: boolean
  onComplete?: (result: any) => void
}

export default function ProcessingDashboard({ processId, isVisible, onComplete }: ProcessingDashboardProps) {
  const [status, setStatus] = useState<ProcessingStatus | null>(null)
  const [isPolling, setIsPolling] = useState(false)

  // Poll for status updates
  useEffect(() => {
    if (!processId || !isVisible) return

    setIsPolling(true)
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_URL}/process-status/${processId}`)
        if (response.ok) {
          const data = await response.json()
          setStatus(data)
          
          // If completed, stop polling and call onComplete
          if (data.status === 'completed' && onComplete) {
            setIsPolling(false)
            clearInterval(pollInterval)
            onComplete(data.result)
          }
          
          // If error, stop polling
          if (data.status === 'error') {
            setIsPolling(false)
            clearInterval(pollInterval)
          }
        }
      } catch (error) {
        console.error('Error polling process status:', error)
      }
              }, 500) // Poll every 500ms for faster updates

    return () => {
      clearInterval(pollInterval)
      setIsPolling(false)
    }
  }, [processId, isVisible, onComplete])

  if (!isVisible || !status) return null

     const getStepIcon = (stepName: string) => {
     if (status.completed_steps.includes(stepName)) {
       return <CheckCircle className="h-5 w-5 text-emerald-400 drop-shadow-lg" />
     }
     if (status.current_step.includes(stepName)) {
       return <Clock className="h-5 w-5 text-blue-400 animate-pulse drop-shadow-lg" />
     }
     return <CheckSquare className="h-5 w-5 text-slate-500" />
   }

     const getStatusColor = () => {
     switch (status.status) {
       case 'completed':
         return 'text-emerald-400 bg-emerald-900/30 border-emerald-500/50'
       case 'error':
         return 'text-red-400 bg-red-900/30 border-red-500/50'
       case 'processing':
         return 'text-blue-400 bg-blue-900/30 border-blue-500/50'
       default:
         return 'text-slate-400 bg-slate-700/50 border-slate-500/50'
     }
   }

  const getStatusIcon = () => {
    switch (status.status) {
      case 'completed':
        return <CheckCircle className="h-6 w-6 text-green-500" />
      case 'error':
        return <AlertCircle className="h-6 w-6 text-red-500" />
      case 'processing':
        return <Clock className="h-6 w-6 text-blue-500 animate-spin" />
      default:
        return <Clock className="h-6 w-6 text-gray-500" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString()
  }

  return (
    <div className="bg-slate-800 rounded-xl shadow-2xl border border-slate-700 p-6 max-w-2xl mx-auto backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Document Processing</h3>
            <p className="text-sm text-slate-300">{status.file_name}</p>
          </div>
        </div>
                 <div className={`px-4 py-2 rounded-full border-2 text-sm font-semibold ${getStatusColor()} shadow-lg`}>
           <div className="flex items-center space-x-2">
             {getStatusIcon()}
             <span className="capitalize">{status.status}</span>
           </div>
         </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-3">
          <span className="font-medium">Processing Progress</span>
          <span className="font-bold text-lg text-blue-600">{status.progress}%</span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-4 shadow-inner border border-slate-600">
          <div 
            className={`h-4 rounded-full transition-all duration-500 ease-out shadow-sm ${
              status.status === 'completed' 
                ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                : status.status === 'error' 
                ? 'bg-gradient-to-r from-red-500 to-pink-500' 
                : 'bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500'
            }`}
            style={{ width: `${status.progress}%` }}
          />
        </div>
        {/* Progress Steps */}
        <div className="mt-3 flex justify-between text-xs text-slate-400">
          <span>0%</span>
          <span>25%</span>
          <span>50%</span>
          <span>75%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Current Step */}
      <div className="mb-6 p-4 bg-blue-900/20 rounded-lg border border-blue-500/30 backdrop-blur-sm">
        <div className="flex items-center space-x-3">
          <Clock className="h-5 w-5 text-blue-400 animate-pulse" />
          <div>
            <p className="text-sm font-medium text-blue-200">Current Step</p>
            <p className="text-blue-300">{status.current_step}</p>
          </div>
        </div>
      </div>

      {/* Processing Steps */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-white mb-3">Processing Steps</h4>
        <div className="space-y-3">
          {status.steps.map((step, index) => (
            <div key={step} className="flex items-center space-x-3">
              {getStepIcon(step)}
              <span className={`text-sm ${
                status.completed_steps.includes(step)
                  ? 'text-emerald-400 font-medium'
                  : status.current_step.includes(step)
                  ? 'text-blue-400 font-medium'
                  : 'text-slate-400'
              }`}>
                {step}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* File Info */}
      <div className="mb-6 p-4 bg-slate-700/50 rounded-lg border border-slate-600">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-slate-400">File Size</p>
            <p className="font-medium text-white">{formatFileSize(status.file_size)}</p>
          </div>
          <div>
            <p className="text-slate-400">Started</p>
            <p className="font-medium text-white">{formatTime(status.start_time)}</p>
          </div>
        </div>
      </div>

             {/* Errors and Warnings */}
       {status.errors.length > 0 && (
         <div className="mb-4 p-4 bg-red-900/20 rounded-lg border border-red-500/30 backdrop-blur-sm">
           <h4 className="text-sm font-medium text-red-300 mb-2 flex items-center">
             <AlertCircle className="h-4 w-4 mr-2 text-red-400" />
             Errors
           </h4>
           <div className="space-y-2">
             {status.errors.map((error, index) => (
               <div key={index} className="flex items-start space-x-2 p-2 bg-red-900/10 rounded border border-red-500/20">
                 <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                 <div>
                   <p className="text-sm text-red-200">{error.message}</p>
                   <p className="text-xs text-red-400">{formatTime(error.timestamp)}</p>
                 </div>
               </div>
             ))}
           </div>
         </div>
       )}

       {status.warnings.length > 0 && (
         <div className="mb-4 p-4 bg-yellow-900/20 rounded-lg border border-yellow-500/30 backdrop-blur-sm">
           <h4 className="text-sm font-medium text-yellow-300 mb-2 flex items-center">
             <AlertCircle className="h-4 w-4 mr-2 text-yellow-400" />
             Warnings
           </h4>
           <div className="space-y-2">
             {status.warnings.map((warning, index) => (
               <div key={index} className="flex items-start space-x-2 p-2 bg-yellow-900/10 rounded border border-yellow-500/20">
                 <AlertCircle className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                 <div>
                   <p className="text-sm text-yellow-200">{warning.message}</p>
                   <p className="text-xs text-yellow-400">{formatTime(warning.timestamp)}</p>
                 </div>
               </div>
             ))}
           </div>
         </div>
       )}

      {/* Polling Status */}
      {isPolling && (
        <div className="text-center text-sm text-slate-400">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
            <span>Live updates enabled</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            ⏱️ Expected processing time: 10-30 seconds
          </div>
        </div>
      )}
    </div>
  )
}
