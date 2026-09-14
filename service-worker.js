/*
  Copyright (c) 2025 Robson Cassiano
  Licensed under the MIT License. See the LICENSE file in the project root for full text.

  Service Worker for offline support
  Caches core app shell and provides runtime caching for other requests (e.g., CDN assets).
*/

const CACHE_VERSION = 'v10';
const APP_CACHE = `abaco-cache-${CACHE_VERSION}`;
const RUNTIME_CACHE = 'runtime-cache';

// List of local assets to precache (sem index.html que retorna 308 no Cloudflare Pages)
const PRECACHE_ASSETS = [
  './',
  './assets/css/styles.css',
  './assets/js/ternary-math.js',
  './assets/js/app.js',
  './assets/js/main.js',
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
    caches.open(APP_CACHE).then((cache) => cache.addAll(PRECACHE_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => {
        if (key !== APP_CACHE && key !== RUNTIME_CACHE) {
          return caches.delete(key);
        }
        return undefined;
      }));
      await self.clients.claim();
      // Notify all clients that a new service worker is active
      const clientsList = await self.clients.matchAll({ type: 'window' });
      for (const client of clientsList) {
        client.postMessage({ type: 'SW_ACTIVATED', version: CACHE_VERSION });
      }
    })()
  );
});

// Allow the page to request immediate activation
self.addEventListener('message', (event) => {
  if (!event.data) return;
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET requests
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Navigation requests: network-first with cache fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).then(async (response) => {
        if (response && response.status === 200) {
          const cache = await caches.open(APP_CACHE);
          cache.put(request, response.clone());
        }
        return response;
      }).catch(async () => {
        const cache = await caches.open(APP_CACHE);
        return (await cache.match(request)) || (await cache.match('./')) || Response.error();
      })
    );
    return;
  }

  // Same-origin: cache-first strategy for local assets
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request, { ignoreSearch: true }).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (!response || response.status !== 200) return response;
          const responseToCache = response.clone();
          caches.open(APP_CACHE).then((cache) => cache.put(request, responseToCache));
          return response;
        }).catch(() => caches.match('./'));
      })
    );
    return;
  }

  // Cross-origin: deixa o navegador gerenciar via cache HTTP nativo, evitando bloqueios
  return;
});

