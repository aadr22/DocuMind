'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Brain } from 'lucide-react'
import { cn } from '@/utils/cn'

export default function LoginPage() {
  const router = useRouter()

  const handleDemoAccess = () => {
    router.push('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center gradient-bg py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-glow">
            <Brain className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            DocuMind AI
          </h1>
          <p className="text-slate-600 font-medium">
            Demo Mode - No Authentication Required
          </p>
        </div>

        {/* Demo Access Card */}
        <div className="glass-card">
          <div className="text-center space-y-6">
            <div className="p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                🚀 Ready to Test!
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                DocuMind AI is running in demo mode. You can test all features without signing in.
              </p>
              
              <button
                onClick={handleDemoAccess}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
              >
                Start Using DocuMind AI
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-slate-500">
          <p>AI-powered document reading and analysis</p>
          <p className="mt-1">Demo mode - No login required</p>
        </div>
      </div>
    </div>
  )
}
