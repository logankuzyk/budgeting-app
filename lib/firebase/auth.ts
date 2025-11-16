import { 
  signInWithCredential,
  signOut as firebaseSignOut,
  User,
  GoogleAuthProvider,
  onAuthStateChanged,
  Auth
} from 'firebase/auth';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';
import { auth } from './config';
import { logger } from '../utils/logger';

// Configure Google Sign-In
// iOS client ID from GoogleService-Info.plist: 480462233798-4inj7idc89dvk1kcgpp7433u5aaj7hr3.apps.googleusercontent.com
GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID, // From Firebase Console or Google Cloud Console
  iosClientId: '480462233798-4inj7idc89dvk1kcgpp7433u5aaj7hr3.apps.googleusercontent.com', // iOS client ID from GoogleService-Info.plist
  offlineAccess: true, // If you want to access Google API on behalf of the user FROM YOUR SERVER
  forceCodeForRefreshToken: true, // [Android] related to `serverAuthCode`, read the docs link below *.
});

export const signInWithGoogle = async (): Promise<User> => {
  const startTime = Date.now();
  logger.logAuthRequest('signInWithGoogle', { platform: Platform.OS });
  
  try {
    // Check if Google Web Client ID is configured
    const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
    if (!webClientId) {
      const error = new Error(
        'Google OAuth Client ID is not configured. Please set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in your .env file. ' +
        'You can get this from the Firebase Console or Google Cloud Console: https://console.cloud.google.com/apis/credentials'
      );
      logger.logAuthError('signInWithGoogle', error, { reason: 'missing_config' });
      throw error;
    }

    // Check if Google Play Services are available (Android only)
    if (Platform.OS === 'android') {
      logger.debug('Checking Google Play Services availability');
      await GoogleSignin.hasPlayServices();
    }

    // Sign in with Google
    logger.debug('Initiating Google Sign-In');
    await GoogleSignin.signIn();
    
    // Get the ID token
    logger.debug('Retrieving Google ID token');
    const { idToken } = await GoogleSignin.getTokens();
    
    if (!idToken) {
      const error = new Error('No ID token received from Google Sign-In');
      logger.logAuthError('signInWithGoogle', error, { reason: 'no_id_token' });
      throw error;
    }

    // Create a Google credential with the ID token
    const googleCredential = GoogleAuthProvider.credential(idToken);
    
    // Sign in to Firebase with the Google credential
    logger.debug('Signing in to Firebase with Google credential');
    const userCredential = await signInWithCredential(auth, googleCredential);
    
    const duration = Date.now() - startTime;
    logger.logAuthResponse('signInWithGoogle', duration, userCredential.user.uid);
    
    return userCredential.user;
  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    // Handle specific error cases
    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      const cancelledError = new Error('Google sign-in was cancelled');
      logger.logAuthError('signInWithGoogle', cancelledError, { 
        errorCode: error.code,
        duration: `${duration}ms`,
        reason: 'cancelled' 
      });
      throw cancelledError;
    } else if (error.code === statusCodes.IN_PROGRESS) {
      const inProgressError = new Error('Google sign-in is already in progress');
      logger.logAuthError('signInWithGoogle', inProgressError, { 
        errorCode: error.code,
        duration: `${duration}ms`,
        reason: 'in_progress' 
      });
      throw inProgressError;
    } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      const playServicesError = new Error('Google Play Services are not available');
      logger.logAuthError('signInWithGoogle', playServicesError, { 
        errorCode: error.code,
        duration: `${duration}ms`,
        reason: 'play_services_unavailable' 
      });
      throw playServicesError;
    }
    
    logger.logAuthError('signInWithGoogle', error, { 
      errorCode: error.code,
      duration: `${duration}ms` 
    });
    throw error;
  }
};

export const signOut = async (): Promise<void> => {
  const startTime = Date.now();
  const userId = auth.currentUser?.uid;
  logger.logAuthRequest('signOut', { userId });
  
  try {
    // Sign out from Google Sign-In
    try {
      logger.debug('Signing out from Google');
      await GoogleSignin.signOut();
    } catch (googleError) {
      // Ignore Google sign-out errors (user might not be signed in to Google)
      logger.warn('Google sign-out error (ignored)', {
        service: 'auth',
        operation: 'signOut',
        error: (googleError as Error).message,
      });
    }
    
    // Sign out from Firebase
    logger.debug('Signing out from Firebase');
    await firebaseSignOut(auth);
    
    const duration = Date.now() - startTime;
    logger.logAuthResponse('signOut', duration, userId);
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.logAuthError('signOut', error as Error, { 
      userId,
      duration: `${duration}ms` 
    });
    throw error;
  }
};

export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

export const onAuthStateChange = (callback: (user: User | null) => void) => {
  logger.debug('Setting up auth state listener');
  
  return onAuthStateChanged(auth, (user) => {
    if (user) {
      logger.info('Auth state changed: user signed in', {
        service: 'auth',
        operation: 'authStateChanged',
        userId: user.uid,
      });
    } else {
      logger.info('Auth state changed: user signed out', {
        service: 'auth',
        operation: 'authStateChanged',
      });
    }
    callback(user);
  });
};

