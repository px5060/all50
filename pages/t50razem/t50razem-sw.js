// T50 RAZEM: offline — najpierw sieć (świeża wersja), bez sieci kopia z pamięci telefonu
const C = 't50razem-offline-v1';
const NA_START = ['./', './t50razem.webmanifest', './t50razem-192.png'];
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(C).then(c => Promise.all(NA_START.map(u => c.add(new Request(u, { cache: 'no-store' })).catch(() => {}))))); });
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url); if (u.origin !== location.origin) return;
  const nav = r.mode === 'navigate', klucz = u.origin + u.pathname;   // bez ?app= / ?nocache= — jedna kopia na plik
  e.respondWith((async () => { const c = await caches.open(C);
    try { const res = await fetch(nav ? r.url : r, { cache: 'no-store' });
      if (res.ok) c.put(klucz, res.clone()).catch(() => {}); return res; }
    catch (err) { const m = await c.match(klucz, { ignoreSearch: true }); if (m) return m; throw err; } })());
});
