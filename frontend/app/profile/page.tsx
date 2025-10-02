'use client'

import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Brain, ArrowLeft } from 'lucide-react'
import UserProfile from '@/components/auth/UserProfile'
import LoadingSpinner from '@/components/LoadingSpinner'
import Link from 'next/link'

export default function ProfilePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  // Show loading spinner while authentication is being checked
  if (loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading profile..." />
      </div>
    )
  }

  // Show loading spinner while redirecting
  if (!user) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <LoadingSpinner size="lg" text="Redirecting to login..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen gradient-bg py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-glow">
              <Brain className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                User Profile
              </h1>
              <p className="text-slate-600 font-medium">Manage your account settings</p>
            </div>
          </div>
          
          <Link
            href="/"
            className="inline-flex items-center text-sm text-slate-600 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
        </div>

        {/* Profile Component */}
        <div className="glass-card">
          <UserProfile />
        </div>
      </div>
    </div>
  )
}
