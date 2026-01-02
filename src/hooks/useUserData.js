import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  increment,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";

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

      const userRef = doc(db, "artifacts", appId, "public", "data", "users", cleanName);
      profileUnsub.current = onSnapshot(
        userRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUserData({ id: cleanName, ...data });

            if (data.logs) {
              const today = new Date().toDateString();
              const todayTotal = data.logs
                .filter((log) => {
                  const d = log.timestamp?.toDate ? log.timestamp.toDate() : new Date(log.timestamp);
                  return d.toDateString() === today;
                })
                .reduce((acc, curr) => acc + curr.amount, 0);
              setTodayReps(todayTotal);
            }
          } else {
            const newUser = {
              displayName: name,
              training_reps: 0,
              official_reps: 0,
              created_at: serverTimestamp(),
              logs: [],
            };
            setDoc(userRef, newUser).catch((err) => console.error("Error creating user:", err));
            setUserData({ id: cleanName, ...newUser });
          }
          setLoadingProfile(false);
        },
        (error) => {
          console.error("Error fetching user data:", error);
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
      const userRef = doc(db, "artifacts", appId, "public", "data", "users", userData.id);
      const fieldToUpdate = isTraining ? "training_reps" : "official_reps";

      try {
        await updateDoc(userRef, {
          [fieldToUpdate]: increment(amount),
          last_active: serverTimestamp(),
          logs: arrayUnion({
            amount,
            timestamp: new Date(),
            season,
          }),
        });
      } catch (err) {
        console.error("Error adding reps:", err);
      }
    },
    [appId, db, isTraining, season, userData?.id]
  );

  const undoLastAction = useCallback(async () => {
    if (!userData?.logs?.length || !db) return;
    const logs = [...userData.logs];
    const lastLog = logs.pop();
    const userRef = doc(db, "artifacts", appId, "public", "data", "users", userData.id);

    const logSeason = lastLog.season || (isTraining ? "TRAINING" : "OFFICIAL");
    const fieldToUpdate = logSeason === "TRAINING" ? "training_reps" : "official_reps";

    try {
      await updateDoc(userRef, {
        [fieldToUpdate]: increment(-lastLog.amount),
        logs,
      });
    } catch (err) {
      console.error("Error undoing:", err);
    }
  }, [appId, db, isTraining, userData?.id, userData?.logs]);

  const calculateStreak = useCallback(() => {
    if (!userData?.logs) return 0;
    const uniqueDays = new Set(
      userData.logs.map((l) => {
        const d = l.timestamp?.toDate ? l.timestamp.toDate() : new Date(l.timestamp);
        return d.toDateString();
      })
    );
    return uniqueDays.size;
  }, [userData?.logs]);

  const recentLogs = useMemo(() => (userData?.logs ? [...userData.logs].reverse().slice(0, 3) : []), [userData?.logs]);
  const lastLog = useMemo(() => (userData?.logs?.length ? userData.logs[userData.logs.length - 1] : null), [userData?.logs]);
  const lastLogAmount = lastLog ? lastLog.amount : 0;
  const isUndoable = Boolean(userData?.logs?.length);

  return {
    userData,
    todayReps,
    loadingProfile,
    loadUserProfile,
    clearProfile,
    addReps,
    undoLastAction,
    calculateStreak,
    recentLogs,
    lastLogAmount,
    isUndoable,
  };
};
