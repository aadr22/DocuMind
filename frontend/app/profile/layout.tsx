import React from 'react'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

export default function ProfileLayout({
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
