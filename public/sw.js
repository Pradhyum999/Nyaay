// NYAAYNEETI PWA Service Worker
const CACHE_NAME = 'nyaayneeti-cache-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-192.png',
  '/icon-maskable-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('PWA Pre-cache skipped asset:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // 1. NEVER intercept cross-origin requests (Cloudflare Worker proxy, eCourts API, NVIDIA NIM, Firebase, Google Auth, fonts, etc.)
  // Let the browser handle external requests natively!
  if (url.origin !== self.location.origin) {
    return;
  }

  // 2. NEVER intercept API routes (Vite proxy endpoints: /api/ecourts, /api/nvidia, /api/*)
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // 3. Handle SPA navigation (always serve cached index.html or root if offline)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cachedIndex = await caches.match('/index.html');
        if (cachedIndex) return cachedIndex;
        const cachedRoot = await caches.match('/');
        if (cachedRoot) return cachedRoot;
        return new Response('Offline', { status: 503, statusText: 'Offline' });
      })
    );
    return;
  }

  // 4. Cache-first strategy for local static assets (JS, CSS, images, icons)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch fresh version in background without blocking
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, networkResponse);
              });
            }
          })
          .catch(() => {
            // Ignore background revalidation errors
          });
        return cachedResponse;
      }

      // If not in cache, fetch from network
      return fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clone);
            });
          }
          return networkResponse;
        });
    })
  );
});
