import { User } from 'firebase/auth'
import { doc, setDoc, getDoc, updateDoc, serverTimestamp, collection } from 'firebase/firestore'
import { db } from './firebaseConfig'

export interface UserSession {
  uid: string
  email: string
  displayName: string | null
  photoURL: string | null
  lastActive: Date
  isOnline: boolean
  deviceInfo?: {
    userAgent: string
    platform: string
    language: string
    timezone: string
  }
  preferences?: {
    theme: 'light' | 'dark'
    language: string
    notifications: boolean
  }
}

export interface SessionActivity {
  uid: string
  action: string
  timestamp: Date
  details?: any
  ipAddress?: string
  userAgent?: string
}

export class SessionService {
  private static instance: SessionService
  private sessionTimeout: NodeJS.Timeout | null = null
  private activityInterval: NodeJS.Timeout | null = null
  private activityEventListeners: (() => void)[] = []

  static getInstance(): SessionService {
    if (!SessionService.instance) {
      SessionService.instance = new SessionService()
    }
    return SessionService.instance
  }

  // Initialize user session
  async initializeSession(user: User): Promise<UserSession> {
    try {
      const sessionData: UserSession = {
        uid: user.uid,
        email: user.email!,
        displayName: user.displayName,
        photoURL: user.photoURL,
        lastActive: new Date(),
        isOnline: true,
        deviceInfo: this.getDeviceInfo(),
        preferences: {
          theme: 'light',
          language: navigator.language || 'en',
          notifications: true
        }
      }

      // Save session to Firestore
      const sessionRef = doc(db, 'sessions', user.uid)
      await setDoc(sessionRef, {
        ...sessionData,
        lastActive: serverTimestamp(),
        createdAt: serverTimestamp()
      })

      // Start session monitoring
      this.startSessionMonitoring(user.uid)
      this.startActivityTracking(user.uid)

      // Set up session timeout (30 minutes of inactivity)
      this.setupSessionTimeout(user.uid)

      return sessionData
    } catch (error) {
      console.error('Error initializing session:', error)
      throw new Error(`Failed to initialize session: ${error}`)
    }
  }

  // Update session activity
  async updateSessionActivity(uid: string, action: string, details?: any): Promise<void> {
    try {
      const sessionRef = doc(db, 'sessions', uid)
      await updateDoc(sessionRef, {
        lastActive: serverTimestamp(),
        isOnline: true
      })

      // Log activity
      await this.logActivity(uid, action, details)

      // Reset session timeout
      this.setupSessionTimeout(uid)
    } catch (error) {
      console.error('Error updating session activity:', error)
    }
  }

  // End user session
  async endSession(uid: string): Promise<void> {
    try {
      const sessionRef = doc(db, 'sessions', uid)
      await updateDoc(sessionRef, {
        isOnline: false,
        lastActive: serverTimestamp()
      })

      // Stop session monitoring
      this.stopSessionMonitoring()
      this.stopActivityTracking()
      this.clearSessionTimeout()

      // Log logout activity
      await this.logActivity(uid, 'logout')
    } catch (error) {
      console.error('Error ending session:', error)
    }
  }

  // Get current session
  async getCurrentSession(uid: string): Promise<UserSession | null> {
    try {
      const sessionRef = doc(db, 'sessions', uid)
      const sessionSnap = await getDoc(sessionRef)
      
      if (sessionSnap.exists()) {
        const data = sessionSnap.data()
        return {
          ...data,
          lastActive: data.lastActive?.toDate()
        } as UserSession
      }
      return null
    } catch (error) {
      console.error('Error getting current session:', error)
      return null
    }
  }

  // Update user preferences
  async updateUserPreferences(uid: string, preferences: Partial<UserSession['preferences']>): Promise<void> {
    try {
      const sessionRef = doc(db, 'sessions', uid)
      await updateDoc(sessionRef, {
        preferences: preferences,
        lastActive: serverTimestamp()
      })
    } catch (error) {
      console.error('Error updating user preferences:', error)
      throw new Error(`Failed to update preferences: ${error}`)
    }
  }

  // Get user's active sessions across devices
  async getUserActiveSessions(uid: string): Promise<UserSession[]> {
    try {
      // This would typically query a sessions collection
      // For now, we'll return the current session
      const currentSession = await this.getCurrentSession(uid)
      return currentSession ? [currentSession] : []
    } catch (error) {
      console.error('Error getting user active sessions:', error)
      return []
    }
  }

  // Log user activity
  private async logActivity(uid: string, action: string, details?: any): Promise<void> {
    try {
      const activityData: SessionActivity = {
        uid,
        action,
        timestamp: new Date(),
        details,
        userAgent: navigator.userAgent
      }

      // Save to Firestore (you might want to limit this for performance)
      const activityRef = doc(collection(db, 'user_activities'))
      await setDoc(activityRef, {
        ...activityData,
        timestamp: serverTimestamp()
      })
    } catch (error) {
      console.error('Error logging activity:', error)
    }
  }

  // Get device information
  private getDeviceInfo() {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language || 'en',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    }
  }

  // Start session monitoring
  private startSessionMonitoring(uid: string): void {
    // Update session every 5 minutes to keep it active
    this.activityInterval = setInterval(async () => {
      try {
        await this.updateSessionActivity(uid, 'heartbeat')
      } catch (error) {
        console.error('Error updating session heartbeat:', error)
      }
    }, 5 * 60 * 1000) // 5 minutes
  }

  // Stop session monitoring
  private stopSessionMonitoring(): void {
    if (this.activityInterval) {
      clearInterval(this.activityInterval)
      this.activityInterval = null
    }
  }

  // Start activity tracking
  private startActivityTracking(uid: string): void {
    // Track user interactions
    const trackActivity = () => {
      this.updateSessionActivity(uid, 'user_interaction')
    }

    // Track various user activities
    document.addEventListener('click', trackActivity)
    document.addEventListener('keypress', trackActivity)
    document.addEventListener('scroll', trackActivity)

    // Store event listeners for cleanup
    this.activityEventListeners = [
      () => document.removeEventListener('click', trackActivity),
      () => document.removeEventListener('keypress', trackActivity),
      () => document.removeEventListener('scroll', trackActivity)
    ]
  }

  // Stop activity tracking
  private stopActivityTracking(): void {
    if (this.activityEventListeners) {
      this.activityEventListeners.forEach(cleanup => cleanup())
      this.activityEventListeners = []
    }
  }

  // Setup session timeout
  private setupSessionTimeout(uid: string): void {
    // Clear existing timeout
    this.clearSessionTimeout()

    // Set new timeout (30 minutes of inactivity)
    this.sessionTimeout = setTimeout(async () => {
      try {
        await this.endSession(uid)
        // Optionally redirect to login or show session expired message
        window.location.href = '/login?session=expired'
      } catch (error) {
        console.error('Error handling session timeout:', error)
      }
    }, 30 * 60 * 1000) // 30 minutes
  }

  // Clear session timeout
  private clearSessionTimeout(): void {
    if (this.sessionTimeout) {
      clearTimeout(this.sessionTimeout)
      this.sessionTimeout = null
    }
  }

  // Cleanup method
  cleanup(): void {
    this.stopSessionMonitoring()
    this.stopActivityTracking()
    this.clearSessionTimeout()
  }
}

export default SessionService.getInstance()
