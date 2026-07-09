// Service worker minimal : uniquement pour rendre l'app installable (PWA).
// Volontairement SANS mise en cache agressive pour éviter tout contenu périmé.
self.addEventListener('install', () => { self.skipWaiting(); });
self.addEventListener('activate', (event) => { event.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
