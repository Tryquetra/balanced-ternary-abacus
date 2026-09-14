/*
  Copyright (c) 2025 Robson Cassiano
  Licensed under the MIT License. See the LICENSE file in the project root for full text.

  Service Worker for offline support
  Caches core app shell and provides runtime caching for Astro bundles and CDN assets.
*/

const CACHE_VERSION = 'v6_astro_jinkan';
const APP_CACHE = `abaco-cache-${CACHE_VERSION}`;
const RUNTIME_CACHE = 'runtime-cache-v6';

// Assets estáticos para precache
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './assets/triquetra.webp',
  './assets/favicons/favicon.ico',
  './assets/favicons/favicon-16x16.png',
  './assets/favicons/favicon-32x32.png',
  './assets/favicons/apple-touch-icon.png',
  './assets/favicons/android-chrome-192x192.png',
  './assets/favicons/android-chrome-512x512.png',
  './assets/favicons/site.webmanifest'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(APP_CACHE)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.map((key) => {
          if (key !== APP_CACHE && key !== RUNTIME_CACHE) {
            return caches.delete(key);
          }
          return undefined;
        })
      );
      await self.clients.claim();
      const clientsList = await self.clients.matchAll({ type: 'window' });
      for (const client of clientsList) {
        client.postMessage({ type: 'SW_ACTIVATED', version: CACHE_VERSION });
      }
    })()
  );
});

self.addEventListener('message', (event) => {
  if (!event.data) return;
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Navegação: App Shell (index.html)
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const freshShell = await fetch(request);
          if (freshShell && freshShell.status === 200) {
            const cache = await caches.open(APP_CACHE);
            cache.put(request, freshShell.clone());
            return freshShell;
          }
        } catch (_) {}
        const cached = await caches.match('./index.html');
        return cached || Response.error();
      })()
    );
    return;
  }

  // Mesma origem (Astro _astro bundles, imagens, etc.)
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request, { ignoreSearch: true }).then((cached) => {
        if (cached) return cached;
        return fetch(request)
          .then((response) => {
            if (!response || response.status !== 200) return response;
            const responseToCache = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, responseToCache));
            return response;
          })
          .catch(() => caches.match('./index.html'));
      })
    );
    return;
  }

  // Origens externas confiáveis (MathJax CDN)
  const ALLOWED_CDN_ORIGINS = new Set([
    'https://cdn.jsdelivr.net',
    'https://raw.githubusercontent.com'
  ]);

  if (!ALLOWED_CDN_ORIGINS.has(url.origin)) {
    return;
  }

  event.respondWith(
    (async () => {
      try {
        const fresh = await fetch(request);
        if (fresh && fresh.status === 200) {
          const cache = await caches.open(RUNTIME_CACHE);
          cache.put(request, fresh.clone());
        }
        return fresh;
      } catch (_) {
        const cached = await caches.match(request);
        if (cached) return cached;
        return Response.error();
      }
    })()
  );
});
