const DEMO_USERS_KEY = 'pushup_demo_users_v1';
const DEMO_STORAGE_EVENT = 'pushup:demo-storage-updated';

const hasStorage = () => typeof window !== 'undefined' && typeof localStorage !== 'undefined';

const readUsersMap = () => {
  if (!hasStorage()) return {};

  try {
    const raw = localStorage.getItem(DEMO_USERS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (error) {
    console.error('Failed to parse demo user storage', error);
    return {};
  }
};

const writeUsersMap = (usersMap) => {
  if (!hasStorage()) return;

  localStorage.setItem(DEMO_USERS_KEY, JSON.stringify(usersMap));
  window.dispatchEvent(new Event(DEMO_STORAGE_EVENT));
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
