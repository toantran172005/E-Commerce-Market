import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, initializeAuth, type Auth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyCPkVyg1V7erOSe2KWUvp9pDfO5EgVsJs4",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "e-commerce-market-e2875.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "e-commerce-market-e2875",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "e-commerce-market-e2875.firebasestorage.app",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "794360087185",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:794360087185:web:ee816e20e5d8d6d1cb3530",
};

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

function initAuth(): Auth {
  // Check if running inside React Native runtime
  const isRN = typeof navigator !== 'undefined' && (navigator as any).product === 'ReactNative';
  if (isRN) {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const authModule = require('firebase/auth');
      if (typeof authModule.getReactNativePersistence === 'function') {
        return initializeAuth(app, {
          persistence: authModule.getReactNativePersistence(AsyncStorage),
        });
      }
    } catch {
      // Fallback to getAuth
    }
  }
  return getAuth(app);
}

export const auth = initAuth();
export const db = getFirestore(app);
