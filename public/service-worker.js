/* Network-first app shell. Never cache API responses, photos, or authenticated data. */
const CACHE = 'digitimes-shell-v2';
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.add('/index.html'))));
self.addEventListener('activate', event => event.waitUntil(Promise.all([
  caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('digitimes-shell-') && key !== CACHE).map(key => caches.delete(key)))),
  self.clients.claim(),
])));
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  const navigation = event.request.mode === 'navigate';
  if (!navigation && !url.pathname.startsWith('/assets/')) return;
  event.respondWith(fetch(event.request).then(response => {
    if (response.ok && response.type === 'basic') {
      const copy = response.clone();
      event.waitUntil(caches.open(CACHE).then(cache => cache.put(navigation ? '/index.html' : event.request, copy)));
    }
    return response;
  }).catch(async () => {
    const cached = await caches.match(navigation ? '/index.html' : event.request);
    return cached || Response.error();
  }));
});
