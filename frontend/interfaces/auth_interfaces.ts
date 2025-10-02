/**
 * Authentication-related interfaces following Interface Segregation Principle
 * Each interface has a single, focused responsibility
 */

export interface IAuthentication {
  /** Core authentication operations */
  signIn(email: string, password: string): Promise<void>
  signUp(email: string, password: string, displayName: string): Promise<void>
  signInWithGoogle(): Promise<void>
  logout(): Promise<void>
}

export interface IUserProfile {
  /** User profile operations */
  userProfile: UserProfile | null
  updateUserProfile(updates: Partial<UserProfile>): Promise<void>
  refreshUserProfile(): Promise<void>
}

export interface IUserManagement {
  /** User management operations */
  resetPassword(email: string): Promise<void>
  sendVerificationEmail(): Promise<void>
  updateEmail(newEmail: string): Promise<void>
  updatePassword(newPassword: string): Promise<void>
}

// Supporting types
export interface UserProfile {
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

export interface AuthState {
  user: any | null
  userProfile: UserProfile | null
  loading: boolean
}
