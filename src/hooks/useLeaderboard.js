import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';

// Real-time leaderboard subscription.
export const useLeaderboard = ({ db, appId, isTraining, user }) => {
  const [leaderboardData, setLeaderboardData] = useState([]);

  useEffect(() => {
    if (!db || !user) return undefined;

    const usersRef = collection(db, 'artifacts', appId, 'public', 'data', 'users');
    const unsub = onSnapshot(
      usersRef,
      (snapshot) => {
        const users = [];
        snapshot.forEach((docSnap) => {
          users.push({ id: docSnap.id, ...docSnap.data() });
        });
        const sortKey = isTraining ? 'training_reps' : 'official_reps';
        users.sort((a, b) => (b[sortKey] || 0) - (a[sortKey] || 0));
        setLeaderboardData(users);
      },
      (error) => console.error('Error fetching leaderboard:', error)
    );

    return () => unsub();
  }, [appId, db, isTraining, user]);

  return leaderboardData;
};
