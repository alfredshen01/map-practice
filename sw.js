// Offline cache for the installable web app (the site build only; the claude.ai artifact does not use it).
// v39 is replaced by the build, so every release starts a fresh cache and drops the old one.
const V = 'wkmap-v39';
const PRECACHE = [
  './', './manifest.webmanifest', './icon-192.png', './icon-512.png',
  './flags/AF.svg', './flags/AS.svg', './flags/EU.svg', './flags/NA.svg', './flags/OC.svg', './flags/SA.svg',
  'https://cdnjs.cloudflare.com/ajax/libs/d3/7.9.0/d3.min.js',
  'https://cdn.jsdelivr.net/npm/topojson-client@3.1.0/dist/topojson-client.min.js',
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  // the page: network first so a new version shows up, the cached copy when offline
  if (r.mode === 'navigate') {
    e.respondWith(fetch(r).then(res => {
      const copy = res.clone(); caches.open(V).then(c => c.put('./', copy)); return res;
    }).catch(() => caches.match('./')));
    return;
  }
  // everything else (photos, flags, d3, fonts): from the cache, filled on first use
  e.respondWith(caches.match(r).then(hit => hit || fetch(r).then(res => {
    if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(V).then(c => c.put(r, copy)); }
    return res;
  })));
});
