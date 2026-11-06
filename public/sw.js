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

const networkFirst = async (request) => {
  try {
    const response = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    if (response.ok) await cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cache = await caches.open(CACHE_NAME);
    const cached =
      (await cache.match(request)) || (await cache.match(new URL('index.html', SCOPE_URL).href));
    return cached || Promise.reject(error);
  }
};

const cacheFirst = async (request) => {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) await cache.put(request, response.clone());
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
