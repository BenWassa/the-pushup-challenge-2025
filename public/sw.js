const VERSION = new URL(self.location.href).searchParams.get('app_version') || 'dev';
const SCOPE_URL = self.registration ? self.registration.scope : `${self.location.origin}/`;
const CACHE_PREFIX = `pushup-pwa-${new URL(SCOPE_URL).pathname}-v`;
const CACHE_NAME = `${CACHE_PREFIX}${VERSION}`;
const PRECACHE_URLS = [
  '',
  'index.html',
  'manifest.webmanifest',
  'icon-192.png',
  'icon-512.png',
  'icon-192-maskable.png',
  'icon-512-maskable.png',
  'icon-32.png',
  'icon-16.png',
  'icon.png',
  'favicon.ico',
  'apple-touch-icon.png',
].map((path) => new URL(path, SCOPE_URL).toString());

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) =>
            key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME ? caches.delete(key) : null
          )
        )
      )
      .then(() => self.clients.claim())
  );
});

// Cache storage is optional: quota/private-mode failures must not break online use.
const openRuntimeCache = async () => {
  try {
    return await caches.open(CACHE_NAME);
  } catch {
    return null;
  }
};

const matchCached = async (cache, request) => {
  try {
    return cache ? await cache.match(request) : null;
  } catch {
    return null;
  }
};

const storeResponse = async (cache, request, response) => {
  if (!cache || !response.ok) return;
  try {
    await cache.put(request, response.clone());
  } catch {
    // Preserve the successful network response when storage is unavailable.
  }
};

const networkFirst = async (request) => {
  let response;
  try {
    response = await fetch(request);
  } catch (error) {
    const cache = await openRuntimeCache();
    const cached =
      (await matchCached(cache, request)) ||
      (await matchCached(cache, new URL('index.html', SCOPE_URL).href));
    if (cached) return cached;
    throw error;
  }
  await storeResponse(await openRuntimeCache(), request, response);
  return response;
};

const cacheFirst = async (request) => {
  const cache = await openRuntimeCache();
  const cached = await matchCached(cache, request);
  if (cached) return cached;
  const response = await fetch(request);
  await storeResponse(cache, request, response);
  return response;
};

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !url.href.startsWith(SCOPE_URL)) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }

  event.respondWith(cacheFirst(request));
});
