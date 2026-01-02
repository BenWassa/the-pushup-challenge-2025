import { useEffect, useMemo, useState } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  signInAnonymously,
  signInWithCustomToken,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const parseConfig = () => {
  try {
    // Check for injected runtime variable first (production)
    if (typeof __firebase_config !== 'undefined' && __firebase_config) {
      return JSON.parse(__firebase_config);
    }

    // Fall back to environment variables for local development
    const envConfig = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    };

    // Filter out undefined values
    const filteredConfig = Object.fromEntries(
      Object.entries(envConfig).filter(([, value]) => value !== undefined)
    );

    return filteredConfig;
  } catch (e) {
    console.error('Failed to parse firebase config', e);
    return {};
  }
};

const isValidConfig = (config) => {
  // Check if config has required fields and no placeholder values
  return (
    config.apiKey &&
    config.projectId &&
    !config.apiKey.includes('your-') &&
    !config.projectId.includes('your-')
  );
};

const getFirebase = () => {
  const existing = getApps();
  if (existing.length) {
    const app = existing[0];
    return { app, auth: getAuth(app), db: getFirestore(app) };
  }
  const config = parseConfig();
  if (!isValidConfig(config)) {
    throw new Error('Firebase config not properly set up. Please check your .env.local file.');
  }
  const app = initializeApp(config);
  return { app, auth: getAuth(app), db: getFirestore(app) };
};

export const useAuth = () => {
  const [user, setUser] = useState(null);

  const config = parseConfig();
  const isConfigured = isValidConfig(config);

  // Calculate error and loading states
  const error = useMemo(() => {
    if (!isConfigured) {
      return 'Firebase not configured. Please set up your .env.local file with valid Firebase credentials.';
    }
    return null;
  }, [isConfigured]);

  // Initialize Firebase synchronously if configured
  const firebaseInstance = useMemo(() => {
    if (!isConfigured) return null;
    try {
      return getFirebase();
    } catch (e) {
      console.warn('Firebase initialization failed:', e.message);
      return null;
    }
  }, [isConfigured]);

  const loading = useMemo(() => {
    if (error) return false;
    if (!firebaseInstance) return true;
    return user === null; // Still loading if we have Firebase but no user state yet
  }, [error, firebaseInstance, user]);

  const { auth, db } = firebaseInstance || { auth: null, db: null };
  const appId = typeof __app_id !== 'undefined' && __app_id ? __app_id : 'pushup-challenge-default';

  useEffect(() => {
    if (!auth) return;

    let unsubAuth;
    const initAuth = async () => {
      const token = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
      try {
        if (token) {
          await signInWithCustomToken(auth, token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (e) {
        console.error('Auth init failed, falling back to anonymous', e);
        try {
          await signInAnonymously(auth);
        } catch (err) {
          console.error('Anonymous auth failed', err);
        }
      }

      unsubAuth = onAuthStateChanged(auth, (u) => {
        setUser(u || null);
      });
    };

    initAuth();
    return () => {
      if (unsubAuth) unsubAuth();
    };
  }, [auth]);

  return { user, loading, db, appId, error };
};
