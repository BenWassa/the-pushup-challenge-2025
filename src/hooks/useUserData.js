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
              const todayDateStr = new Date().toDateString();
              const todayIsoStr = new Date().toISOString().split('T')[0];

              // Filter logs by today's date, handling both real-time and historical
              const validLogs = data.logs.filter((log) => {
                // Historical logs use submitted_date
                if (log.source === 'historical' && log.submitted_date) {
                  return log.submitted_date === todayIsoStr;
                }
                // Real-time logs use timestamp
                if (log.timestamp && isValidTimestamp(log.timestamp)) {
                  return getDateString(log.timestamp) === todayDateStr;
                }
                return false;
              });
              const todayTotal = validLogs.reduce((acc, curr) => acc + curr.amount, 0);
              setTodayReps(todayTotal);

              // Data integrity check: warn if any logs are invalid (excluding historical)
              const invalidCount = data.logs.filter(
                (log) => log.source !== 'historical' && !isValidTimestamp(log.timestamp)
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

  const deleteLogByIndex = useCallback(
    async (logIndex) => {
      if (!userData?.logs || logIndex < 0 || logIndex >= userData.logs.length || !db) return;
      const logs = [...userData.logs];
      const logToDelete = logs[logIndex];
      logs.splice(logIndex, 1);

      const userRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', userData.id);
      const logSeason = logToDelete.season || (isTraining ? 'TRAINING' : 'OFFICIAL');
      const fieldToUpdate = logSeason === 'TRAINING' ? 'training_reps' : 'official_reps';

      try {
        await updateDoc(userRef, {
          [fieldToUpdate]: increment(-logToDelete.amount),
          logs,
        });
      } catch (err) {
        console.error('Error deleting log:', err);
        throw err;
      }
    },
    [appId, db, isTraining, userData?.id, userData?.logs]
  );

  const addHistoricalReps = useCallback(
    async (date, amount) => {
      if (!userData?.id || !db || !amount || amount <= 0) return;
      const userRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', userData.id);
      const fieldToUpdate = isTraining ? 'training_reps' : 'official_reps';

      try {
        await updateDoc(userRef, {
          [fieldToUpdate]: increment(amount),
          last_active: serverTimestamp(),
          logs: arrayUnion({
            amount,
            submitted_date: date.toISOString().split('T')[0], // YYYY-MM-DD
            source: 'historical',
            season,
          }),
        });
      } catch (err) {
        console.error('Error adding historical reps:', err);
        throw err;
      }
    },
    [appId, db, isTraining, season, userData?.id]
  );

  const calculateStreak = useCallback(() => {
    if (!userData?.logs) return 0;
    const uniqueDays = new Set();

    userData.logs.forEach((log) => {
      // Historical logs use submitted_date (YYYY-MM-DD)
      if (log.source === 'historical' && log.submitted_date) {
        uniqueDays.add(log.submitted_date);
      }
      // Real-time logs use timestamp
      else if (log.timestamp && isValidTimestamp(log.timestamp)) {
        // Convert to YYYY-MM-DD for consistent comparison
        const date = log.timestamp.toDate ? log.timestamp.toDate() : log.timestamp;
        const dateStr = date.toISOString().split('T')[0];
        uniqueDays.add(dateStr);
      }
    });

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
    deleteLogByIndex: db ? deleteLogByIndex : () => {},
    addHistoricalReps: db ? addHistoricalReps : () => {},
    calculateStreak: db ? calculateStreak : () => 0,
    recentLogs: db ? recentLogs : [],
    lastLogAmount: db ? lastLogAmount : null,
    isUndoable: db ? isUndoable : false,
  };
};
