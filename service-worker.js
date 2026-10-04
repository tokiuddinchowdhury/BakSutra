const CACHE_NAME = 'baksutra-shell-v2';
const APP_SHELL = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './new-logo.png',
  './icon-192.png',
  './icon-512.png'
];

const EXTERNAL_ASSETS = [
  'https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/docx@8.5.0/build/index.umd.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.2/html2pdf.bundle.min.js'
];

const EXTERNAL_ASSET_HOSTS = new Set([
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'cdnjs.cloudflare.com',
  'cdn.jsdelivr.net'
]);

async function cacheExternalAsset(cache, url) {
  try {
    const request = new Request(url, { mode: 'cors', credentials: 'omit' });
    const response = await fetch(request);
    if (response && (response.ok || response.type === 'opaque')) {
      await cache.put(request, response.clone());
    }
  } catch (_) {
    // A CDN being unavailable should not block service-worker installation.
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await cache.addAll(APP_SHELL);
      await Promise.all(EXTERNAL_ASSETS.map((url) => cacheExternalAsset(cache, url)));
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

function isExternalAssetRequest(request, url) {
  if (!EXTERNAL_ASSET_HOSTS.has(url.hostname)) return false;
  if (request.method !== 'GET') return false;
  return ['style', 'script', 'font'].includes(request.destination) || url.hostname === 'fonts.googleapis.com';
}

function staleWhileRevalidate(request) {
  return caches.open(CACHE_NAME).then((cache) => {
    const cachedPromise = cache.match(request);
    const networkPromise = fetch(request).then((response) => {
      if (response && (response.ok || response.type === 'opaque')) {
        cache.put(request, response.clone()).catch(() => undefined);
      }
      return response;
    }).catch(() => null);

    return cachedPromise.then((cached) => cached || networkPromise.then((response) => response || Response.error()));
  });
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // External design/library assets use stale-while-revalidate.
  if (isExternalAssetRequest(request, url)) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Keep translation calls network-only so a cached translation response can
  // never become stale or interfere with the live Google Translate endpoint.
  if (url.hostname === 'translate.googleapis.com') return;

  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put('./index.html', copy)).catch(() => undefined);
        return response;
      }).catch(() => caches.match('./index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).then((response) => {
      if (response && response.ok) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)).catch(() => undefined);
      }
      return response;
    }))
  );
});
