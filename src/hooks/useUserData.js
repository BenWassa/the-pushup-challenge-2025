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
import { getDateString, isValidTimestamp, toDate } from '../utils/timestamp';
import { isDemoStorageMode } from '../utils/mode';
import { getDemoUserByName, saveDemoUser, upsertDemoUserByName } from '../utils/localStore';

/* eslint-disable react-hooks/preserve-manual-memoization */

const getTodayRepTotal = (logs = []) => {
  const todayDateStr = new Date().toDateString();
  const todayIsoStr = new Date().toISOString().split('T')[0];

  const validLogs = logs.filter((log) => {
    if (log.source === 'historical' && log.submitted_date) {
      return log.submitted_date === todayIsoStr;
    }

    if (log.timestamp && isValidTimestamp(log.timestamp)) {
      return getDateString(log.timestamp) === todayDateStr;
    }

    return false;
  });

  return validLogs.reduce((acc, curr) => acc + curr.amount, 0);
};

// Handles user profile, logging reps, undo, and derived stats.
export const useUserData = ({ db, appId, season, isTraining, storageMode }) => {
  const [userData, setUserData] = useState(null);
  const [todayReps, setTodayReps] = useState(0);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const profileUnsub = useRef(null);
  const isDemoMode = isDemoStorageMode(storageMode);

  const setActiveUser = useCallback((nextUser) => {
    setUserData(nextUser);
    setTodayReps(getTodayRepTotal(nextUser?.logs || []));
  }, []);

  const clearProfile = useCallback(() => {
    if (profileUnsub.current) profileUnsub.current();
    profileUnsub.current = null;
    setUserData(null);
    setTodayReps(0);
  }, []);

  const loadDemoProfile = useCallback(
    (name) => {
      if (!name) return;
      setLoadingProfile(true);

      const createdUser = upsertDemoUserByName(name);
      const storedUser = getDemoUserByName(name) || createdUser;
      if (storedUser) {
        setActiveUser(storedUser);
      }

      setLoadingProfile(false);
    },
    [setActiveUser]
  );

  const loadCloudProfile = useCallback(
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
            setActiveUser({ id: cleanName, ...data });

            if (data.logs) {
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
            setActiveUser({ id: cleanName, ...newUser });
          }
          setLoadingProfile(false);
        },
        (error) => {
          console.error('Error fetching user data:', error);
          setLoadingProfile(false);
        }
      );
    },
    [appId, db, setActiveUser]
  );

  const loadUserProfile = isDemoMode ? loadDemoProfile : loadCloudProfile;

  useEffect(() => {
    return () => {
      if (profileUnsub.current) profileUnsub.current();
    };
  }, []);

  const addReps = useCallback(
    async (amount) => {
      if (!userData?.id) return;

      if (isDemoMode) {
        const fieldToUpdate = isTraining ? 'training_reps' : 'official_reps';
        const nextUser = {
          ...userData,
          [fieldToUpdate]: (userData[fieldToUpdate] || 0) + amount,
          last_active: Date.now(),
          logs: [...(userData.logs || []), { amount, timestamp: Date.now(), season }],
        };
        saveDemoUser(userData.id, nextUser);
        setActiveUser(nextUser);
        return;
      }

      if (!db) return;
      const userRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', userData.id);
      const fieldToUpdate = isTraining ? 'training_reps' : 'official_reps';

      try {
        await updateDoc(userRef, {
          [fieldToUpdate]: increment(amount),
          last_active: serverTimestamp(),
          logs: arrayUnion({
            amount,
            timestamp: Date.now(),
            season,
          }),
        });
      } catch (err) {
        console.error('Error adding reps:', err);
      }
    },
    [appId, db, isDemoMode, isTraining, season, setActiveUser, userData]
  );

  const undoLastAction = useCallback(async () => {
    if (!userData?.logs?.length) return;

    const logs = [...userData.logs];
    const lastLog = logs.pop();

    const logSeason = lastLog.season || (isTraining ? 'TRAINING' : 'OFFICIAL');
    const fieldToUpdate = logSeason === 'TRAINING' ? 'training_reps' : 'official_reps';

    if (isDemoMode) {
      const nextUser = {
        ...userData,
        [fieldToUpdate]: Math.max(0, (userData[fieldToUpdate] || 0) - lastLog.amount),
        logs,
      };
      saveDemoUser(userData.id, nextUser);
      setActiveUser(nextUser);
      return;
    }

    if (!db) return;
    const userRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', userData.id);

    try {
      await updateDoc(userRef, {
        [fieldToUpdate]: increment(-lastLog.amount),
        logs,
      });
    } catch (err) {
      console.error('Error undoing:', err);
    }
  }, [appId, db, isDemoMode, isTraining, setActiveUser, userData]);

  const deleteLogByIndex = useCallback(
    async (logIndex) => {
      if (!userData?.logs || logIndex < 0 || logIndex >= userData.logs.length) return;

      const logs = [...userData.logs];
      const logToDelete = logs[logIndex];
      logs.splice(logIndex, 1);

      const logSeason = logToDelete.season || (isTraining ? 'TRAINING' : 'OFFICIAL');
      const fieldToUpdate = logSeason === 'TRAINING' ? 'training_reps' : 'official_reps';

      if (isDemoMode) {
        const nextUser = {
          ...userData,
          [fieldToUpdate]: Math.max(0, (userData[fieldToUpdate] || 0) - logToDelete.amount),
          logs,
        };
        saveDemoUser(userData.id, nextUser);
        setActiveUser(nextUser);
        return;
      }

      if (!db) return;
      const userRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', userData.id);

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
    [appId, db, isDemoMode, isTraining, setActiveUser, userData]
  );

  const addHistoricalReps = useCallback(
    async (date, amount) => {
      if (!userData?.id || !amount || amount <= 0) return;
      const fieldToUpdate = isTraining ? 'training_reps' : 'official_reps';
      const historicalLog = {
        amount,
        submitted_date: date.toISOString().split('T')[0],
        source: 'historical',
        season,
      };

      if (isDemoMode) {
        const nextUser = {
          ...userData,
          [fieldToUpdate]: (userData[fieldToUpdate] || 0) + amount,
          last_active: Date.now(),
          logs: [...(userData.logs || []), historicalLog],
        };
        saveDemoUser(userData.id, nextUser);
        setActiveUser(nextUser);
        return;
      }

      if (!db) return;
      const userRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', userData.id);

      try {
        await updateDoc(userRef, {
          [fieldToUpdate]: increment(amount),
          last_active: serverTimestamp(),
          logs: arrayUnion(historicalLog),
        });
      } catch (err) {
        console.error('Error adding historical reps:', err);
        throw err;
      }
    },
    [appId, db, isDemoMode, isTraining, season, setActiveUser, userData]
  );

  const calculateStreak = useCallback(() => {
    if (!userData?.logs) return 0;
    const uniqueDays = new Set();

    userData.logs.forEach((log) => {
      if (log.source === 'historical' && log.submitted_date) {
        uniqueDays.add(log.submitted_date);
      } else if (log.timestamp && isValidTimestamp(log.timestamp)) {
        const date = toDate(log.timestamp);
        if (!date) return;
        uniqueDays.add(date.toISOString().split('T')[0]);
      }
    });

    return uniqueDays.size;
  }, [userData?.logs]);

  const recentLogs = useMemo(() => {
    if (!userData?.logs) return [];

    const todayStr = new Date().toDateString();
    const todayIso = new Date().toISOString().split('T')[0];

    const todaysLogs = userData.logs.filter((log) => {
      if (log.source === 'historical' && log.submitted_date) {
        return log.submitted_date === todayIso;
      }
      if (log.timestamp && isValidTimestamp(log.timestamp)) {
        let logDate;
        if (log.timestamp.toDate) {
          logDate = log.timestamp.toDate();
        } else if (typeof log.timestamp === 'number') {
          logDate = new Date(log.timestamp);
        } else {
          logDate = new Date(log.timestamp);
        }
        return logDate && logDate.toDateString() === todayStr;
      }
      return false;
    });

    return [...todaysLogs].reverse().slice(0, 3);
  }, [userData?.logs]);

  const lastLog = useMemo(
    () => (userData?.logs?.length ? userData.logs[userData.logs.length - 1] : null),
    [userData?.logs]
  );

  const lastLogAmount = lastLog ? lastLog.amount : 0;
  const isUndoable = Boolean(userData?.logs?.length);

  return {
    userData: isDemoMode || db ? userData : null,
    todayReps: isDemoMode || db ? todayReps : 0,
    loadingProfile: isDemoMode || db ? loadingProfile : false,
    loadUserProfile: isDemoMode || db ? loadUserProfile : () => {},
    clearProfile: isDemoMode || db ? clearProfile : () => {},
    addReps: isDemoMode || db ? addReps : () => {},
    undoLastAction: isDemoMode || db ? undoLastAction : () => {},
    deleteLogByIndex: isDemoMode || db ? deleteLogByIndex : () => {},
    addHistoricalReps: isDemoMode || db ? addHistoricalReps : () => {},
    calculateStreak: isDemoMode || db ? calculateStreak : () => 0,
    recentLogs: isDemoMode || db ? recentLogs : [],
    lastLogAmount: isDemoMode || db ? lastLogAmount : null,
    isUndoable: isDemoMode || db ? isUndoable : false,
  };
};
