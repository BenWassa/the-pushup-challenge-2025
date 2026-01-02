import { useEffect, useState } from 'react';
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
    const cfg =
      typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config || '{}') : {};
    return cfg;
  } catch (e) {
    console.error('Failed to parse firebase config', e);
    return {};
  }
};

const getFirebase = () => {
  const existing = getApps();
  if (existing.length) {
    const app = existing[0];
    return { app, auth: getAuth(app), db: getFirestore(app) };
  }
  const app = initializeApp(parseConfig());
  return { app, auth: getAuth(app), db: getFirestore(app) };
};

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const { auth, db } = getFirebase();
  const appId = typeof __app_id !== 'undefined' && __app_id ? __app_id : 'pushup-challenge-default';

  useEffect(() => {
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
        setLoading(false);
      });
    };

    initAuth();
    return () => {
      if (unsubAuth) unsubAuth();
    };
  }, [auth]);

  return { user, loading, db, appId };
};
