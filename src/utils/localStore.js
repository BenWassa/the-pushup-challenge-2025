const DEMO_STORAGE_EVENT = 'pushup:demo-storage-updated';
let demoUsers = {};

const readUsersMap = () => demoUsers;
const writeUsersMap = (usersMap) => {
  demoUsers = usersMap;
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(DEMO_STORAGE_EVENT));
};

export const resetDemoUsers = (today = new Date()) => {
  const users = {};
  ['Sample Alex', 'Sample Robin', 'Sample Taylor'].forEach((displayName, index) => {
    const amounts = [30, 50, 70, 40, 90, 60, 45].map((amount) => amount + index * 5);
    // Cap at "now": a noon timestamp earlier in the day would be in the future and be
    // rejected as invalid, so today's seeded reps would not count before ~11:00 local.
    const logs = amounts.map((amount, day) => {
      const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6 + day, 12);
      return { amount, timestamp: Math.min(date.getTime(), today.getTime()), season: 'OFFICIAL' };
    });
    const trainingLogs = amounts.map((amount, day) => {
      const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 13 + day, 12);
      return { amount, timestamp: date.getTime(), season: 'TRAINING' };
    });
    const total = amounts.reduce((sum, amount) => sum + amount, 0);
    users[displayName.toLowerCase()] = {
      displayName,
      official_reps: total,
      training_reps: total,
      created_at: trainingLogs[0].timestamp,
      last_active: logs[logs.length - 1].timestamp,
      logs: [...trainingLogs, ...logs],
    };
  });
  writeUsersMap(users);
};

const cleanNameKey = (name) => name.toLowerCase().trim();

export const getDemoStorageEventName = () => DEMO_STORAGE_EVENT;

export const getDemoUserByName = (name) => {
  if (!name) return null;
  const users = readUsersMap();
  const key = cleanNameKey(name);
  const user = users[key];
  return user ? { id: key, ...user } : null;
};

export const upsertDemoUserByName = (name) => {
  if (!name) return null;

  const key = cleanNameKey(name);
  const users = readUsersMap();

  if (!users[key]) {
    users[key] = {
      displayName: name,
      training_reps: 0,
      official_reps: 0,
      created_at: Date.now(),
      logs: [],
    };
    writeUsersMap(users);
  }

  return { id: key, ...users[key] };
};

export const saveDemoUser = (userId, userData) => {
  if (!userId || !userData) return;
  const users = readUsersMap();
  users[userId] = { ...userData };
  writeUsersMap(users);
};

export const listDemoUsers = () => {
  const users = readUsersMap();
  return Object.entries(users).map(([id, data]) => ({ id, ...data }));
};
