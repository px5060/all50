// SZUKAJ przeniesiona do osobnego repo (/szukajNN/) — ten service worker wyrejestrowuje się sam
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.registration.unregister()));
