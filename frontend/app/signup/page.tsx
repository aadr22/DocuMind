'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Brain, ArrowLeft } from 'lucide-react'
import SignupForm from '@/components/auth/SignupForm'
import Link from 'next/link'

export default function SignupPage() {
  const router = useRouter()

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
            Create your account to get started
          </p>
        </div>

        {/* Signup Form */}
        <div className="glass-card">
          <SignupForm />
        </div>

        {/* Navigation */}
        <div className="text-center">
          <Link 
            href="/login"
            className="inline-flex items-center text-sm text-slate-600 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Already have an account? Sign in
          </Link>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-slate-500">
          <p>AI-powered document reading and analysis</p>
          <p className="mt-1">Secure, fast, and intelligent</p>
        </div>
      </div>
    </div>
  )
}
