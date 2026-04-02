/* PharmaScan Pro v4 — Offline GS1 Edition — Service Worker */
const CACHE = 'pharmascan-pro-v4';
const ASSETS = ['/', '/index.html', '/app.js', '/styles.css', '/manifest.json'];

self.addEventListener('install', e =>
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
  )
);

self.addEventListener('activate', e =>
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  )
);

self.addEventListener('fetch', e =>
  e.respondWith(
    caches.match(e.request)
      .then(r => r || fetch(e.request).then(res => {
        // Cache successful GET responses for assets
        if (e.request.method === 'GET' && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }))
      .catch(() => caches.match('/index.html'))
  )
);
