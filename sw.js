const CACHE_NAME = 'fomin-portfolio-v9-dark';
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/css/style.min.css',
  '/js/main_min.js',
  '/i18n/ru.json',
  '/i18n/en.json',
  '/i18n/uk.json',
  '/assets/logo.jpg',
  '/assets/logo.webp'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

async function cacheResponse(request, response) {
  if (!response || !response.ok || response.type !== 'basic') return response;
  const cache = await caches.open(CACHE_NAME);
  cache.put(request, response.clone());
  return response;
}

async function networkFirst(request, fallback) {
  try {
    const response = await fetch(request, { cache: 'no-cache' });
    return cacheResponse(request, response);
  } catch (error) {
    const cache = await caches.open(CACHE_NAME);
    return (await cache.match(request)) || (fallback ? await cache.match(fallback) : undefined) || Response.error();
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  const network = fetch(request).then((response) => cacheResponse(request, response)).catch(() => undefined);
  return cached || network || Response.error();
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  const isDocument = request.mode === 'navigate' || url.pathname === '/' || url.pathname === '/index.html';
  const isTranslation = url.pathname.startsWith('/i18n/');

  if (isDocument) {
    event.respondWith(networkFirst(request, '/index.html'));
    return;
  }

  if (isTranslation) {
    event.respondWith(networkFirst(request));
    return;
  }

  event.respondWith(staleWhileRevalidate(request));
});
