import { useCallback, useEffect, useMemo, useState } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  connectAuthEmulator,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
} from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, doc, getDoc } from 'firebase/firestore';
import { getStorageMode, isDemoStorageMode } from '../utils/mode';

// Move appId outside hook to avoid recalculating on every render
export const APP_ID =
  typeof __app_id !== 'undefined' && __app_id ? __app_id : 'pushup-challenge-default';

const localEmulatorsEnabled = () =>
  import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true' &&
  typeof window !== 'undefined' &&
  ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname);
const connectedEmulators = new WeakSet();
const parseConfig = () => {
  if (localEmulatorsEnabled())
    return {
      apiKey: 'demo-pushup-local-key',
      projectId: 'demo-pushup-2027',
      authDomain: 'demo-pushup-2027.firebaseapp.com',
      appId: 'demo-pushup-2027',
    };
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
  if (!isValidConfig(config)) throw new Error('Firebase configuration is unavailable.');
  const appName = localEmulatorsEnabled() ? 'pushup-local-emulator' : '[DEFAULT]';
  const app =
    getApps().find((candidate) => candidate.name === appName) || initializeApp(config, appName);
  const auth = getAuth(app);
  const db = getFirestore(app);
  if (localEmulatorsEnabled() && !connectedEmulators.has(app)) {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
    connectedEmulators.add(app);
  }
  return { app, auth, db };
};

const getFriendlyAuthError = (error) => {
  const code = error?.code || '';

  if (
    code.includes('cancelled-popup-request') ||
    code.includes('popup-closed-by-user') ||
    code.includes('user-cancelled')
  )
    return '';
  if (code.includes('network-request-failed'))
    return 'Cannot connect. Check your connection and try again.';
  if (code.includes('too-many-requests')) return 'Too many sign-in attempts. Try again shortly.';
  return 'Unable to sign in with Google. Try again.';
};

const DEMO_USER = { uid: 'demo-user', isDemo: true };

export const useAuth = () => {
  const [signedInUser, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [authActionLoading, setAuthActionLoading] = useState(false);
  const [authActionError, setAuthActionError] = useState('');
  const [access, setAccess] = useState({ uid: null, status: 'checking' });

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
    if (isDemoMode) return undefined;

    if (!auth) return undefined;

    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u || null);
      setAuthReady(true);
    });

    return () => unsubAuth();
  }, [auth, isDemoMode]);

  // Reports a failed return from Google's full-page sign-in. Success arrives via onAuthStateChanged.
  useEffect(() => {
    if (!auth || isDemoMode) return;
    getRedirectResult(auth).catch((redirectError) =>
      setAuthActionError(getFriendlyAuthError(redirectError))
    );
  }, [auth, isDemoMode]);

  // Closed beta: anyone can sign in with Google, but only emails the owner has added to the
  // allowlist get in. Firestore rules enforce this; this check only chooses which screen to show.
  const userUid = signedInUser?.uid || null;
  const userEmail = signedInUser?.email || '';
  useEffect(() => {
    if (isDemoMode || !userUid || !db) return undefined;
    let cancelled = false;
    getDoc(doc(db, 'allowlist', userEmail.toLowerCase()))
      .then(
        (entry) =>
          !cancelled && setAccess({ uid: userUid, status: entry.exists() ? 'approved' : 'pending' })
      )
      .catch((accessError) => {
        if (cancelled) return;
        // Only a clear refusal blocks the screen; offline or flaky checks stay optimistic
        // because the rules still guard every read and write.
        setAccess({
          uid: userUid,
          status: accessError?.code === 'permission-denied' ? 'pending' : 'approved',
        });
      });
    return () => {
      cancelled = true;
    };
  }, [db, isDemoMode, userEmail, userUid]);
  const accessStatus = isDemoMode
    ? 'approved'
    : !userUid
      ? 'none'
      : access.uid === userUid
        ? access.status
        : 'checking';

  const signInWithGoogle = useCallback(async () => {
    if (!auth || isDemoMode) return false;

    setAuthActionLoading(true);
    setAuthActionError('');

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      try {
        // A popup works when the app and Firebase's sign-in handler are on different domains
        // (GitHub Pages vs firebaseapp.com), where browsers now block redirect sign-in storage.
        await signInWithPopup(auth, provider);
      } catch (popupError) {
        const code = popupError?.code || '';
        if (!code.includes('popup-blocked') && !code.includes('operation-not-supported')) {
          throw popupError;
        }
        await signInWithRedirect(auth, provider);
        // The page is leaving for Google, so keep the button disabled until it returns.
        return true;
      }
      setAuthActionLoading(false);
      return true;
    } catch (signInError) {
      setAuthActionError(getFriendlyAuthError(signInError));
      setAuthActionLoading(false);
      return false;
    }
  }, [auth, isDemoMode]);

  const logoutAuth = useCallback(async () => {
    if (!auth || isDemoMode) return;
    try {
      await signOut(auth);
      setAuthActionError('');
    } catch {
      setAuthActionError('Unable to sign out. Check your connection and try again.');
    }
  }, [auth, isDemoMode]);

  const user = isDemoMode ? DEMO_USER : signedInUser;
  const loading =
    !error && !isDemoMode && Boolean(auth) && (!authReady || accessStatus === 'checking');

  return {
    user,
    loading,
    db,
    appId,
    error,
    storageMode,
    isDemoMode,
    accessStatus,
    authActionLoading,
    authActionError,
    signInWithGoogle,
    logoutAuth,
  };
};
