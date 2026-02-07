import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { listDemoUsers, getDemoStorageEventName } from '../utils/localStore';
import { isDemoStorageMode } from '../utils/mode';

const sortUsers = (users, isTraining) => {
  const sortKey = isTraining ? 'training_reps' : 'official_reps';
  return [...users].sort((a, b) => (b[sortKey] || 0) - (a[sortKey] || 0));
};

// Real-time leaderboard subscription.
export const useLeaderboard = ({ db, appId, isTraining, user, storageMode }) => {
  const [leaderboardData, setLeaderboardData] = useState([]);

  useEffect(() => {
    const demoMode = isDemoStorageMode(storageMode);

    if (demoMode) {
      const syncDemoUsers = () => setLeaderboardData(sortUsers(listDemoUsers(), isTraining));
      syncDemoUsers();

      const eventName = getDemoStorageEventName();
      window.addEventListener(eventName, syncDemoUsers);
      window.addEventListener('storage', syncDemoUsers);

      return () => {
        window.removeEventListener(eventName, syncDemoUsers);
        window.removeEventListener('storage', syncDemoUsers);
      };
    }

    if (!db || !appId || !user) return undefined;

    const usersRef = collection(db, 'artifacts', appId, 'public', 'data', 'users');
    const unsub = onSnapshot(
      usersRef,
      (snapshot) => {
        const users = [];
        snapshot.forEach((docSnap) => {
          users.push({ id: docSnap.id, ...docSnap.data() });
        });
        setLeaderboardData(sortUsers(users, isTraining));
      },
      (error) => console.error('Error fetching leaderboard:', error)
    );

    return () => unsub();
  }, [appId, db, isTraining, storageMode, user]);

  return leaderboardData;
};
