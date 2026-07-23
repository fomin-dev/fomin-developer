const CACHE_NAME = 'fomin-portfolio-v6';
const ASSETS = [
  '/',
  '/index.html',
  '/css/style.min.css',
  '/js/main_min.js',
  '/i18n/ru.json',
  '/i18n/en.json',
  '/i18n/ua.json',
  '/assets/logo.jpg',
  '/assets/logo.webp',
  '/assets/floressa-1.jpg',
  '/assets/floressa-1.webp',
  '/assets/floressa-2.jpg',
  '/assets/floressa-2.webp',
  '/assets/floressa-3.jpg',
  '/assets/floressa-3.webp',
  '/assets/floressa-4.jpg',
  '/assets/floressa-4.webp',
  '/assets/floressa-5.jpg',
  '/assets/floressa-5.webp',
  '/assets/wave_beer.jpg',
  '/assets/wave_beer.webp',
  '/assets/photo_2026-07-09_16-56-20.jpg',
  '/assets/photo_2026-07-09_16-56-20.webp',
  '/assets/photo_2026-07-09_16-56-27.jpg',
  '/assets/photo_2026-07-09_16-56-27.webp',
  '/assets/photo_2026-07-09_16-56-30.jpg',
  '/assets/photo_2026-07-09_16-56-30.webp',
  '/assets/photo_2026-07-11_12-08-44.jpg',
  '/assets/photo_2026-07-11_12-08-44.webp',
  '/assets/photo_2026-07-11_12-08-47.jpg',
  '/assets/photo_2026-07-11_12-08-47.webp'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  e.respondWith(
    caches.match(e.request).then((cached) => {
      const fetchPromise = fetch(e.request).then((res) => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(e.request, clone));
        }
        return res;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
