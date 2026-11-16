/* Mon Budget Privé V3.7 bêta 8 — entrée indépendante de l'ancien cache.
   Ne touche pas au localStorage ni au coffre chiffré. */
const CACHE = 'mon-budget-shell-v3.7-beta8-fresh-entry-2';
const ENTRY = './app-v378.html';
const FILES = [ENTRY, './manifest.webmanifest', './icon-192.png', './icon-512.png'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(Promise.all([
    caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('mon-budget-shell-') && key !== CACHE).map(key => caches.delete(key)))),
    self.clients.claim()
  ]));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    // Servir la nouvelle interface, même quand une icône iOS demande l'ancienne URL de départ.
    const entryUrl = new URL(ENTRY, self.registration.scope);
    event.respondWith(fetch(entryUrl.href, {cache:'no-store'}).then(response => {
      if (!response.ok) throw new Error('Entry unavailable');
      const copy=response.clone();
      event.waitUntil(caches.open(CACHE).then(cache => cache.put(entryUrl.href, copy)));
      return response;
    }).catch(async () => (await caches.match(entryUrl.href)) || Response.error()));
    return;
  }
  event.respondWith(fetch(request).then(response => {
    if (response.ok && FILES.some(file => new URL(file, self.registration.scope).pathname === url.pathname)) {
      const copy=response.clone();
      event.waitUntil(caches.open(CACHE).then(cache => cache.put(request, copy)));
    }
    return response;
  }).catch(async () => (await caches.match(request,{ignoreSearch:true})) || Response.error()));
});
