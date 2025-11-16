import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { initializeAuth, getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getAnalytics, Analytics, isSupported } from 'firebase/analytics';
import { Platform } from 'react-native';

// Detect platform
const getPlatform = (): 'ios' | 'android' | 'web' => {
  if (Platform.OS === 'ios') return 'ios';
  if (Platform.OS === 'android') return 'android';
  return 'web';
};

const platform = getPlatform();

// Helper function to get platform-specific env var with fallback
const getEnvVar = (key: string, platformSuffix: string = '', required: boolean = true): string => {
  const platformKey = platformSuffix 
    ? `EXPO_PUBLIC_${key}_${platformSuffix.toUpperCase()}`
    : `EXPO_PUBLIC_${key}`;
  
  // Try platform-specific first, then fallback to generic
  const value = process.env[platformKey] || process.env[`EXPO_PUBLIC_${key}`] || '';
  
  if (required && !value) {
    throw new Error(
      `Missing required Firebase configuration: ${platformKey} or EXPO_PUBLIC_${key}. ` +
      `Please set it in your .env file.`
    );
  }
  
  return value;
};

// Firebase configuration - platform-specific from environment variables
const firebaseConfig = {
  apiKey: getEnvVar('FIREBASE_API_KEY', platform),
  authDomain: getEnvVar('FIREBASE_AUTH_DOMAIN', platform),
  projectId: getEnvVar('FIREBASE_PROJECT_ID', platform),
  storageBucket: getEnvVar('FIREBASE_STORAGE_BUCKET', platform),
  messagingSenderId: getEnvVar('FIREBASE_MESSAGING_SENDER_ID', platform),
  appId: getEnvVar('FIREBASE_APP_ID', platform),
  measurementId: platform === 'web' ? getEnvVar('FIREBASE_MEASUREMENT_ID', platform, false) : undefined,
};

// Initialize Firebase
let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Initialize Auth with AsyncStorage persistence for React Native
let auth: Auth;
if (Platform.OS !== 'web') {
  // Use initializeAuth with AsyncStorage for React Native (iOS/Android)
  try {
    // Dynamically import AsyncStorage and getReactNativePersistence to avoid web bundling
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    // @ts-ignore - getReactNativePersistence exists at runtime even if TypeScript doesn't see it
    const { getReactNativePersistence } = require('firebase/auth');
    
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (error: any) {
    // If auth is already initialized, get the existing instance
    if (error.code === 'auth/already-initialized') {
      auth = getAuth(app);
    } else {
      // Fallback to regular getAuth if initializeAuth fails
      console.warn('Failed to initialize auth with persistence, using default:', error.message);
      auth = getAuth(app);
    }
  }
} else {
  // Use regular getAuth for web
  auth = getAuth(app);
}

export { auth };
export const db = getFirestore(app);
export const storage = getStorage(app);

// Initialize Analytics (web only, and only if supported)
let analytics: Analytics | null = null;
if (platform === 'web') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

export { analytics };

export default app;

