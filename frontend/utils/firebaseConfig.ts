import { initializeApp, getApps } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getStorage, connectStorageEmulator } from 'firebase/storage'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'

// Check if Firebase environment variables are configured
const hasFirebaseConfig = process.env.NEXT_PUBLIC_FIREBASE_API_KEY && 
                         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID

const firebaseConfig = hasFirebaseConfig ? {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
} : {
  // Fallback config for development/testing
  apiKey: "demo-api-key",
  authDomain: "demo-project.firebaseapp.com",
  projectId: "demo-project",
  storageBucket: "demo-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "demo-app-id"
}

// Initialize Firebase
let app
try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
} catch (error) {
  console.warn('Firebase initialization failed:', error)
  // Create a minimal app for development
  app = initializeApp({
    apiKey: "demo",
    authDomain: "demo.firebaseapp.com",
    projectId: "demo",
    storageBucket: "demo.appspot.com",
    messagingSenderId: "123",
    appId: "demo"
  })
}

// Initialize Firebase services
export const auth = getAuth(app)
export const storage = getStorage(app)
export const db = getFirestore(app)

// Only connect to emulators if explicitly configured and in development
if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true') {
  try {
    // Only connect if not already connected and emulators are available
    if (!auth.config.authDomain?.includes('localhost')) {
      connectAuthEmulator(auth, 'http://localhost:9099')
      connectStorageEmulator(storage, 'localhost', 9199)
      connectFirestoreEmulator(db, 'localhost', 8080)
    }
  } catch (error) {
    console.log('Firebase emulators not running, using production services')
  }
}

export default app
