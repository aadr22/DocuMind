'use client'

import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { User, Mail, Settings, LogOut, Save, X, Camera, Eye, EyeOff, Lock } from 'lucide-react'

export default function UserProfile() {
  const { user, userProfile, updateUserProfile, logout } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [formData, setFormData] = useState({
    displayName: userProfile?.displayName || '',
    email: userProfile?.email || '',
    theme: userProfile?.preferences?.theme || 'light',
    language: userProfile?.preferences?.language || 'en',
    notifications: userProfile?.preferences?.notifications !== false
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSaveProfile = async () => {
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      await updateUserProfile({
        displayName: formData.displayName,
        preferences: {
          theme: formData.theme as 'light' | 'dark',
          language: formData.language,
          notifications: formData.notifications
        }
      })
      
      setSuccess('Profile updated successfully!')
      setIsEditing(false)
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000)
    } catch (error: any) {
      setError(error.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelEdit = () => {
    setFormData({
      displayName: userProfile?.displayName || '',
      email: userProfile?.email || '',
      theme: userProfile?.preferences?.theme || 'light',
      language: userProfile?.preferences?.language || 'en',
      notifications: userProfile?.preferences?.notifications !== false
    })
    setIsEditing(false)
    setError('')
  }

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'N/A'
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (!user || !userProfile) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading profile...</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-8 text-white">
          <div className="flex items-center space-x-4">
            <div className="relative">
              {userProfile.photoURL ? (
                <img
                  src={userProfile.photoURL}
                  alt={userProfile.displayName || 'User'}
                  className="w-20 h-20 rounded-full border-4 border-white"
                />
              ) : (
                <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <User className="w-10 h-10" />
                </div>
              )}
              <button className="absolute bottom-0 right-0 bg-white rounded-full p-1 text-gray-600 hover:text-gray-800">
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <div>
              <h1 className="text-2xl font-bold">{userProfile.displayName || 'User'}</h1>
              <p className="text-blue-100">{userProfile.email}</p>
              <p className="text-sm text-blue-200">
                Member since {formatDate(userProfile.createdAt)}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {success && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded flex items-center">
              <span className="mr-2">✓</span>
              {success}
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded flex items-center">
              <span className="mr-2">✗</span>
              {error}
            </div>
          )}

          {/* Profile Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <User className="w-5 h-5 mr-2" />
                Profile Information
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Display Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="displayName"
                      value={formData.displayName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white">{userProfile.displayName || 'Not set'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <p className="text-gray-900 dark:text-white flex items-center">
                    <Mail className="w-4 h-4 mr-2" />
                    {userProfile.email}
                    {userProfile.isEmailVerified && (
                      <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        Verified
                      </span>
                    )}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Last Login
                  </label>
                  <p className="text-gray-900 dark:text-white">
                    {formatDate(userProfile.lastLoginAt)}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Preferences
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Theme
                  </label>
                  {isEditing ? (
                    <select
                      name="theme"
                      value={formData.theme}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                    </select>
                  ) : (
                    <p className="text-gray-900 dark:text-white capitalize">{userProfile.preferences?.theme || 'light'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Language
                  </label>
                  {isEditing ? (
                    <select
                      name="language"
                      value={formData.language}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                    </select>
                  ) : (
                    <p className="text-gray-900 dark:text-white">
                      {userProfile.preferences?.language === 'en' ? 'English' : 
                       userProfile.preferences?.language === 'es' ? 'Spanish' :
                       userProfile.preferences?.language === 'fr' ? 'French' :
                       userProfile.preferences?.language === 'de' ? 'German' : 'English'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="notifications"
                      checked={formData.notifications}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Enable notifications
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-wrap gap-4">
            {isEditing ? (
              <>
                <button
                  onClick={handleSaveProfile}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-md flex items-center"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md flex items-center"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
              >
                <Settings className="w-4 h-4 mr-2" />
                Edit Profile
              </button>
            )}

            <button
              onClick={() => setShowPasswordForm(!showPasswordForm)}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-md flex items-center"
            >
              <Lock className="w-4 h-4 mr-2" />
              Change Password
            </button>

            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md flex items-center"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </button>
          </div>

          {/* Password Change Form */}
          {showPasswordForm && (
            <div className="mt-8 p-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Change Password
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                      placeholder="Current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                      placeholder="New password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                      placeholder="Confirm password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md">
                  Update Password
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
