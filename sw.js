/* Mon Budget Privé — actualisation du cache pour V3.7 bêta 8.
   Ce service worker ne modifie jamais les données locales chiffrées. */
const CACHE = 'mon-budget-shell-v3.7-beta8-refresh-1';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(FILES)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      caches.keys().then(keys => Promise.all(
        keys.filter(key => key.startsWith('mon-budget-shell-') && key !== CACHE)
          .map(key => caches.delete(key))
      )),
      self.clients.claim()
    ])
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  event.respondWith(
    fetch(request).then(response => {
      if (response.ok && FILES.some(file => new URL(file, self.registration.scope).pathname === url.pathname)) {
        const copy = response.clone();
        event.waitUntil(caches.open(CACHE).then(cache => cache.put(request, copy)));
      }
      return response;
    }).catch(async () => {
      const cached = await caches.match(request, { ignoreSearch: true });
      if (cached) return cached;
      if (request.mode === 'navigate') {
        const shell = await caches.match(new URL('./index.html', self.registration.scope));
        if (shell) return shell;
      }
      return Response.error();
    })
  );
});
