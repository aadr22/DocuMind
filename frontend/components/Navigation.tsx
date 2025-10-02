'use client'

import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, usePathname } from 'next/navigation'
import { Brain, Home, LayoutDashboard, User, LogOut, LogIn, UserPlus } from 'lucide-react'
import Link from 'next/link'

export default function Navigation() {
  const { user, userProfile, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const isActive = (path: string) => pathname === path

  return (
    <nav className="bg-slate-900/80 backdrop-blur-md border-b border-slate-700 sticky top-0 z-50 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25 animate-float">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                DocuMind AI
              </h1>
            </Link>
          </div>

          {/* Navigation Links */}
          {user && (
            <div className="hidden md:flex items-center space-x-1">
              <Link
                href="/"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/') 
                    ? 'bg-slate-700 text-white' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
              >
                <Home className="h-4 w-4 inline mr-2" />
                Home
              </Link>
              <Link
                href="/dashboard"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/dashboard') 
                    ? 'bg-slate-700 text-white' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
              >
                                 <LayoutDashboard className="h-4 w-4 inline mr-2" />
                Dashboard
              </Link>
              <Link
                href="/profile"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/profile') 
                    ? 'bg-slate-700 text-white' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
              >
                <User className="h-4 w-4 inline mr-2" />
                Profile
              </Link>
            </div>
          )}

          {/* User Menu / Auth Buttons */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="text-sm text-slate-300">
                  Welcome, {userProfile?.displayName || user.email}
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  href="/login"
                  className="text-slate-300 hover:text-white transition-colors flex items-center space-x-2"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Sign In</span>
                </Link>
                <Link
                  href="/signup"
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 flex items-center space-x-2"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Get Started</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
