'use client'

import React, { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAuth?: boolean
  redirectTo?: string
}

export default function ProtectedRoute({ 
  children, 
  requireAuth = true, 
  redirectTo = '/login' 
}: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (requireAuth && !user) {
        // User is not authenticated and route requires auth
        router.push(redirectTo)
      } else if (!requireAuth && user) {
        // User is authenticated but route doesn't require auth (e.g., login page)
        router.push('/dashboard')
      }
    }
  }, [user, loading, requireAuth, redirectTo, router])

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  // If route requires auth and user is not authenticated, don't render children
  if (requireAuth && !user) {
    return null
  }

  // If route doesn't require auth and user is authenticated, don't render children
  if (!requireAuth && user) {
    return null
  }

  // Render children if authentication requirements are met
  return <>{children}</>
}

// Higher-order component for protecting routes
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  requireAuth: boolean = true,
  redirectTo: string = '/login'
) {
  return function AuthenticatedComponent(props: P) {
    return (
      <ProtectedRoute requireAuth={requireAuth} redirectTo={redirectTo}>
        <Component {...props} />
      </ProtectedRoute>
    )
  }
}

// Hook for checking if user can access a specific route
export function useRouteAccess(requiredRole?: string) {
  const { user, userProfile } = useAuth()
  
  const canAccess = () => {
    if (!user) return false
    if (!requiredRole) return true
    
    // Add role-based access control here if needed
    // For now, all authenticated users can access all routes
    return true
  }

  return {
    canAccess: canAccess(),
    user,
    userProfile
  }
}
