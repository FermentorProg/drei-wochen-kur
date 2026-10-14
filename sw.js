// Service Worker: App-Dateien vorab cachen. Online wird frisch geladen (max. 3 s), offline aus dem Cache.
const CACHE_VERSION = 'dwk-v12';
const ASSETS = [
  './', 'index.html', 'manifest.json', 'data/seed.json',
  'css/base.css', 'css/components.css', 'css/calendar.css',
  'js/app.js', 'js/actions.js', 'js/calendar.js', 'js/checkin.js', 'js/ctx.js', 'js/dates.js',
  'js/dayitems.js', 'js/dnd.js', 'js/extras-model.js', 'js/timer.js', 'js/events.js', 'js/fx.js', 'js/goals.js', 'js/goals-model.js', 'js/review-model.js', 'js/icons.js', 'js/model.js', 'js/notes.js', 'js/notes-model.js', 'js/parking.js',
  'js/settings.js', 'js/sheet.js', 'js/sound.js', 'js/store.js', 'js/streaks.js',
  'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png',
];
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_VERSION).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

function networkFirst(req) {
  return caches.open(CACHE_VERSION).then((cache) => {
    const network = fetch(req, { cache: 'no-cache' }).then((res) => {
      if (res.ok) cache.put(req, res.clone());
      return res;
    });
    const timeout = new Promise((resolve) => setTimeout(resolve, 3000));
    return Promise.race([network, timeout])
      .then((res) => res || cache.match(req, { ignoreSearch: true }))
      .catch(() => cache.match(req, { ignoreSearch: true }))
      .then((res) => res || network);
  });
}

function staleWhileRevalidate(req) {
  return caches.open(CACHE_VERSION).then((cache) =>
    cache.match(req).then((hit) => {
      const network = fetch(req).then((res) => { cache.put(req, res.clone()); return res; }).catch(() => hit);
      return hit || network;
    }));
}

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (FONT_HOSTS.includes(url.hostname)) e.respondWith(staleWhileRevalidate(e.request));
  else if (url.origin === location.origin) e.respondWith(networkFirst(e.request));
});
