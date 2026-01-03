import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  arrayUnion,
  doc,
  increment,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { getDateString, isValidTimestamp } from '../utils/timestamp';

/* eslint-disable react-hooks/preserve-manual-memoization */

// Handles user profile, logging reps, undo, and derived stats.
export const useUserData = ({ db, appId, season, isTraining }) => {
  const [userData, setUserData] = useState(null);
  const [todayReps, setTodayReps] = useState(0);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const profileUnsub = useRef(null);

  const clearProfile = useCallback(() => {
    if (profileUnsub.current) profileUnsub.current();
    profileUnsub.current = null;
    setUserData(null);
    setTodayReps(0);
  }, []);

  const loadUserProfile = useCallback(
    (name) => {
      if (!db || !name) return;
      const cleanName = name.toLowerCase().trim();
      setLoadingProfile(true);

      if (profileUnsub.current) profileUnsub.current();

      const userRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', cleanName);
      profileUnsub.current = onSnapshot(
        userRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUserData({ id: cleanName, ...data });

            if (data.logs) {
              const today = new Date().toDateString();
              // Filter logs by today's date, with validation of timestamps
              const validLogs = data.logs.filter((log) => {
                if (!log.timestamp || !isValidTimestamp(log.timestamp)) {
                  console.warn('Invalid or missing timestamp in log:', log);
                  return false;
                }
                return getDateString(log.timestamp) === today;
              });
              const todayTotal = validLogs.reduce((acc, curr) => acc + curr.amount, 0);
              setTodayReps(todayTotal);

              // Data integrity check: warn if any logs are invalid
              const invalidCount = data.logs.filter(
                (log) => !isValidTimestamp(log.timestamp)
              ).length;
              if (invalidCount > 0) {
                console.warn(`Data integrity issue: ${invalidCount} logs have invalid timestamps`);
              }
            }
          } else {
            const newUser = {
              displayName: name,
              training_reps: 0,
              official_reps: 0,
              created_at: serverTimestamp(),
              logs: [],
            };
            setDoc(userRef, newUser).catch((err) => console.error('Error creating user:', err));
            setUserData({ id: cleanName, ...newUser });
          }
          setLoadingProfile(false);
        },
        (error) => {
          console.error('Error fetching user data:', error);
          setLoadingProfile(false);
        }
      );
    },
    [appId, db]
  );

  useEffect(() => {
    return () => {
      if (profileUnsub.current) profileUnsub.current();
    };
  }, []);

  const addReps = useCallback(
    async (amount) => {
      if (!userData?.id || !db) return;
      const userRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', userData.id);
      const fieldToUpdate = isTraining ? 'training_reps' : 'official_reps';

      try {
        await updateDoc(userRef, {
          [fieldToUpdate]: increment(amount),
          last_active: serverTimestamp(),
          logs: arrayUnion({
            amount,
            timestamp: serverTimestamp(),
            season,
          }),
        });
      } catch (err) {
        console.error('Error adding reps:', err);
      }
    },
    [appId, db, isTraining, season, userData?.id]
  );

  const undoLastAction = useCallback(async () => {
    if (!userData?.logs?.length || !db) return;
    const logs = [...userData.logs];
    const lastLog = logs.pop();
    const userRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', userData.id);

    const logSeason = lastLog.season || (isTraining ? 'TRAINING' : 'OFFICIAL');
    const fieldToUpdate = logSeason === 'TRAINING' ? 'training_reps' : 'official_reps';

    try {
      await updateDoc(userRef, {
        [fieldToUpdate]: increment(-lastLog.amount),
        logs,
      });
    } catch (err) {
      console.error('Error undoing:', err);
    }
  }, [appId, db, isTraining, userData?.id, userData?.logs]);

  const calculateStreak = useCallback(() => {
    if (!userData?.logs) return 0;
    const uniqueDays = new Set(
      userData.logs
        .filter((l) => isValidTimestamp(l.timestamp))
        .map((l) => getDateString(l.timestamp))
        .filter(Boolean)
    );
    return uniqueDays.size;
  }, [userData?.logs]);

  const recentLogs = useMemo(
    () => (userData?.logs ? [...userData.logs].reverse().slice(0, 3) : []),
    [userData?.logs]
  );
  const lastLog = useMemo(
    () => (userData?.logs?.length ? userData.logs[userData.logs.length - 1] : null),
    [userData?.logs]
  );
  const lastLogAmount = lastLog ? lastLog.amount : 0;
  const isUndoable = Boolean(userData?.logs?.length);

  return {
    userData: db ? userData : null,
    todayReps: db ? todayReps : 0,
    loadingProfile: db ? loadingProfile : false,
    loadUserProfile: db ? loadUserProfile : () => {},
    clearProfile: db ? clearProfile : () => {},
    addReps: db ? addReps : () => {},
    undoLastAction: db ? undoLastAction : () => {},
    calculateStreak: db ? calculateStreak : () => 0,
    recentLogs: db ? recentLogs : [],
    lastLogAmount: db ? lastLogAmount : null,
    isUndoable: db ? isUndoable : false,
  };
};
