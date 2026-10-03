// SZUKAJ: zakres ./szukaj — nawigacje zawsze z sieci (bez starej wersji z pamięci)
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  if (e.request.mode !== 'navigate') return;
  e.respondWith(fetch(e.request.url, { cache: 'no-store' }).catch(() => fetch(e.request)));
});
