const CACHE_NAME = 'the-blues-2026-04-19-v133';
const URLS_TO_CACHE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon.png",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png",
  "./main-img.png",
  "./wake-fallback.mp4"
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(URLS_TO_CACHE)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith((async () => {
    const requestUrl = new URL(event.request.url);

    // Normalize versioned local requests back to file paths for cache matching.
    const normalizedPath = requestUrl.origin === self.location.origin
      ? requestUrl.pathname.replace(self.location.pathname.replace(/[^/]+$/, ''), './')
      : null;

    const directMatch = await caches.match(event.request, {ignoreSearch: true});
    if (directMatch) return directMatch;

    if (normalizedPath) {
      const normalizedMatch = await caches.match(normalizedPath, {ignoreSearch: true});
      if (normalizedMatch) return normalizedMatch;
    }

    try {
      const response = await fetch(event.request);
      if (response && response.ok && requestUrl.origin === self.location.origin) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(event.request, response.clone());
      }
      return response;
    } catch (err) {
      return caches.match('./index.html');
    }
  })());
});
