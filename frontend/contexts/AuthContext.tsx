'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification
} from 'firebase/auth'
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore'
import { auth, db } from '@/utils/firebaseConfig'

interface UserProfile {
  uid: string
  email: string
  displayName: string | null
  photoURL: string | null
  createdAt: Date
  lastLoginAt: Date
  isEmailVerified: boolean
  preferences?: {
    theme?: 'light' | 'dark'
    language?: string
    notifications?: boolean
  }
}

interface AuthContextType {
  user: User | null
  userProfile: UserProfile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, displayName: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  logout: () => Promise<void>
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>
  resetPassword: (email: string) => Promise<void>
  sendVerificationEmail: () => Promise<void>
  refreshUserProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  // Create or update user profile in Firestore
  const createUserProfile = async (user: User, displayName?: string) => {
    try {
      const userRef = doc(db, 'users', user.uid)
      
      const profile: UserProfile = {
        uid: user.uid,
        email: user.email!,
        displayName: displayName || user.displayName,
        photoURL: user.photoURL,
        createdAt: new Date(),
        lastLoginAt: new Date(),
        isEmailVerified: user.emailVerified,
        preferences: {
          theme: 'light' as const,
          language: 'en'
        }
      }

      await setDoc(userRef, profile)
      return profile
    } catch (error) {
      console.warn('Failed to create user profile in Firestore:', error)
              // Return a local profile if Firestore fails
        return {
          uid: user.uid,
          email: user.email!,
          displayName: displayName || user.displayName,
          photoURL: user.photoURL,
          createdAt: new Date(),
          lastLoginAt: new Date(),
          isEmailVerified: user.emailVerified,
          preferences: {
            theme: 'light' as const,
            language: 'en'
          }
        }
    }
  }

  // Fetch user profile from Firestore
  const fetchUserProfile = async (uid: string) => {
    try {
      const userRef = doc(db, 'users', uid)
      const userSnap = await getDoc(userRef)
      
      if (userSnap.exists()) {
        const data = userSnap.data()
        return {
          ...data,
          createdAt: data.createdAt?.toDate(),
          lastLoginAt: data.lastLoginAt?.toDate()
        } as UserProfile
      }
      return null
    } catch (error) {
      console.warn('Failed to fetch user profile from Firestore:', error)
      return null
    }
  }

  // Update user profile
  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!user) throw new Error('No user logged in')
    
    try {
      const userRef = doc(db, 'users', user.uid)
      await updateDoc(userRef, updates)
    } catch (error) {
      console.warn('Failed to update user profile in Firestore:', error)
      // Continue with local state update even if Firestore fails
    }
    
    // Update local state
    setUserProfile(prev => prev ? { ...prev, ...updates } : null)
  }

  // Refresh user profile from Firestore
  const refreshUserProfile = async () => {
    if (!user) return
    
    try {
      const profile = await fetchUserProfile(user.uid)
      setUserProfile(profile)
    } catch (error) {
      console.warn('Failed to refresh user profile:', error)
      // Keep existing profile if refresh fails
    }
  }

  // Reset password
  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email)
  }

  // Send verification email
  const sendVerificationEmail = async () => {
    if (!user) throw new Error('No user logged in')
    await sendEmailVerification(user)
  }

  useEffect(() => {
    // Set a timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      if (loading) {
        console.warn('Auth loading timeout, setting loading to false')
        setLoading(false)
      }
    }, 10000) // 10 second timeout

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        setUser(user)
        
        if (user) {
          try {
            // Check if user profile exists, create if not
            let profile = await fetchUserProfile(user.uid)
            
            if (!profile) {
              profile = await createUserProfile(user)
            } else {
              // Only update last login if it's been more than 1 hour
              const lastLogin = profile.lastLoginAt
              const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
              
              if (!lastLogin || lastLogin < oneHourAgo) {
                try {
                  await updateDoc(doc(db, 'users', user.uid), {
                    lastLoginAt: new Date(),
                    isEmailVerified: user.emailVerified
                  })
                  profile.lastLoginAt = new Date()
                  profile.isEmailVerified = user.emailVerified
                } catch (updateError) {
                  console.warn('Failed to update user profile:', updateError)
                  // Continue with local profile update
                  profile.lastLoginAt = new Date()
                  profile.isEmailVerified = user.emailVerified
                }
              }
            }
            
            setUserProfile(profile)
          } catch (error) {
            console.error('Error handling user profile:', error)
            // Set a basic profile if Firestore fails
            setUserProfile({
              uid: user.uid,
              email: user.email!,
              displayName: user.displayName,
              photoURL: user.photoURL,
              createdAt: new Date(),
              lastLoginAt: new Date(),
              isEmailVerified: user.emailVerified,
              preferences: {
                theme: 'light' as const,
                language: 'en'
              }
            })
          }
        } else {
          setUserProfile(null)
        }
      } catch (error) {
        console.error('Auth state change error:', error)
        setUser(null)
        setUserProfile(null)
      } finally {
        setLoading(false)
        clearTimeout(loadingTimeout)
      }
    })

    return () => {
      unsubscribe()
      clearTimeout(loadingTimeout)
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (error) {
      console.error('Sign in error:', error)
      throw error
    }
  }

  const signUp = async (email: string, password: string, displayName: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      
      // Update display name
      if (userCredential.user) {
        await updateProfile(userCredential.user, { displayName })
      }
    } catch (error) {
      console.error('Sign up error:', error)
      throw error
    }
  }

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth, provider)
    } catch (error) {
      console.error('Google sign in error:', error)
      throw error
    }
  }

  const logout = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error('Logout error:', error)
      throw error
    }
  }

  const value = {
    user,
    userProfile,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    logout,
    updateUserProfile,
    resetPassword,
    sendVerificationEmail,
    refreshUserProfile,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
