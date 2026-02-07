export const STORAGE_MODES = {
  CLOUD: 'cloud',
  DEMO: 'demo',
};

const DEMO_QUERY_VALUE = 'demo';

const hasDemoQuery = () => {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return params.get('mode') === DEMO_QUERY_VALUE;
};

const hasDemoEnv = () => String(import.meta.env.VITE_DEMO_MODE).toLowerCase() === 'true';

export const getStorageMode = () => {
  if (hasDemoQuery() || hasDemoEnv()) return STORAGE_MODES.DEMO;
  return STORAGE_MODES.CLOUD;
};

export const isDemoStorageMode = (mode) => mode === STORAGE_MODES.DEMO;
