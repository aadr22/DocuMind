import React from 'react'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute requireAuth={true} redirectTo="/login">
      {children}
    </ProtectedRoute>
  )
}
