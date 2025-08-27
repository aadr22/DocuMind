'use client'

import React, { useEffect, useState } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { toast, Toast as ToastType } from '@/utils/toast'
import { cn } from '@/utils/cn'

const toastIcons = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle
}

const toastStyles = {
  success: 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 text-green-800',
  error: 'bg-gradient-to-r from-red-50 to-pink-50 border-red-200 text-red-800',
  info: 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 text-blue-800',
  warning: 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200 text-yellow-800'
}

const iconStyles = {
  success: 'text-green-500',
  error: 'text-red-500',
  info: 'text-blue-500',
  warning: 'text-yellow-500'
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastType[]>([])

  useEffect(() => {
    const unsubscribe = toast.subscribe(setToasts)
    return unsubscribe
  }, [])

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toastItem) => {
        const Icon = toastIcons[toastItem.type]
        return (
                     <div
             key={toastItem.id}
             className={cn(
               'flex items-center p-4 border rounded-2xl shadow-2xl max-w-sm transition-all duration-300 ease-in-out backdrop-blur-sm',
               toastStyles[toastItem.type]
             )}
           >
            <Icon className={cn('h-5 w-5 mr-3 flex-shrink-0', iconStyles[toastItem.type])} />
            <p className="text-sm font-medium flex-1">{toastItem.message}</p>
            <button
              onClick={() => toast.removeToast(toastItem.id)}
              className="ml-3 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
