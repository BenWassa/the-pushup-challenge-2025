import { useCallback, useEffect, useMemo, useState } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorageMode, isDemoStorageMode } from '../utils/mode';

// Move appId outside hook to avoid recalculating on every render
export const APP_ID =
  typeof __app_id !== 'undefined' && __app_id ? __app_id : 'pushup-challenge-default';

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
  return (
    config.apiKey &&
    config.projectId &&
    !config.apiKey.includes('your-') &&
    !config.projectId.includes('your-')
  );
};

const getFirebase = (config) => {
  const existing = getApps();
  if (existing.length) {
    const app = existing[0];
    return { app, auth: getAuth(app), db: getFirestore(app) };
  }
  if (!isValidConfig(config)) {
    throw new Error('Firebase config not properly set up. Please check your .env.local file.');
  }
  const app = initializeApp(config);
  return { app, auth: getAuth(app), db: getFirestore(app) };
};

const getFriendlyAuthError = (error) => {
  const code = error?.code || '';

  if (code.includes('invalid-credential')) {
    return 'Invalid email or password.';
  }
  if (code.includes('user-not-found')) {
    return 'No account exists for this email.';
  }
  if (code.includes('email-already-in-use')) {
    return 'That email is already registered. Try signing in instead.';
  }
  if (code.includes('weak-password')) {
    return 'Password must be at least 6 characters.';
  }
  if (code.includes('too-many-requests')) {
    return 'Too many login attempts. Try again shortly.';
  }

  return error?.message || 'Authentication failed.';
};

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [authActionLoading, setAuthActionLoading] = useState(false);
  const [authActionError, setAuthActionError] = useState('');

  const storageMode = useMemo(() => getStorageMode(), []);
  const isDemoMode = isDemoStorageMode(storageMode);

  const config = useMemo(() => parseConfig(), []);
  const isConfigured = useMemo(() => isValidConfig(config), [config]);

  const error = useMemo(() => {
    if (isDemoMode) return null;

    if (!isConfigured) {
      return {
        type: 'CONFIG',
        message:
          'Firebase not configured. Please set up your .env.local file with valid Firebase credentials.',
      };
    }
    return null;
  }, [isConfigured, isDemoMode]);

  const firebaseInstance = useMemo(() => {
    if (isDemoMode || !isConfigured) return null;
    try {
      return getFirebase(config);
    } catch (e) {
      console.warn('Firebase initialization failed:', e.message);
      return null;
    }
  }, [config, isConfigured, isDemoMode]);

  const { auth, db } = firebaseInstance || { auth: null, db: null };
  const appId = APP_ID;

  useEffect(() => {
    if (isDemoMode) {
      setUser({ uid: 'demo-user', isDemo: true });
      setAuthReady(true);
      return undefined;
    }

    if (!auth) return undefined;

    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u || null);
      setAuthReady(true);
    });

    return () => unsubAuth();
  }, [auth, isDemoMode]);

  const signInWithEmail = useCallback(
    async (email, password) => {
      if (!auth || isDemoMode) return false;

      setAuthActionLoading(true);
      setAuthActionError('');

      try {
        await signInWithEmailAndPassword(auth, email, password);
        return true;
      } catch (signInError) {
        setAuthActionError(getFriendlyAuthError(signInError));
        return false;
      } finally {
        setAuthActionLoading(false);
      }
    },
    [auth, isDemoMode]
  );

  const logoutAuth = useCallback(async () => {
    if (!auth || isDemoMode) return;
    await signOut(auth);
  }, [auth, isDemoMode]);

  const loading = !error && !authReady;

  return {
    user,
    loading,
    db,
    appId,
    error,
    storageMode,
    isDemoMode,
    authActionLoading,
    authActionError,
    signInWithEmail,
    logoutAuth,
  };
};
