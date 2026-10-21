// Fretwise sin conexión.
//
// La app es una sola página. Aquí se guarda una copia para que la app instalada
// abra aunque no haya señal. Con conexión siempre se pide la versión nueva
// primero: la copia guardada es solo lo que se muestra cuando la red no
// contesta, así que una versión vieja nunca tapa a una nueva.

const CACHE = 'fretwise-v1';
const HOME = self.registration.scope;
/** Con copia guardada, cuánto se espera a la red antes de mostrarla. */
const PATIENCE_MS = 4000;

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then((cache) => cache.add(new Request(HOME, { cache: 'no-cache' }))));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const name of await caches.keys()) if (name !== CACHE) await caches.delete(name);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || !request.url.startsWith(HOME)) return;
  // La página es la misma con cualquier dirección compartida (?s=…): una sola copia.
  const key = request.mode === 'navigate' ? HOME : request.url;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const saved = await cache.match(key);
    const control = new AbortController();
    const timer = saved ? setTimeout(() => control.abort(), PATIENCE_MS) : undefined;
    try {
      const fresh = await fetch(key, { cache: 'no-cache', signal: control.signal });
      if (fresh.ok) {
        await cache.put(key, fresh.clone());
        return fresh;
      }
      return saved || fresh;
    } catch (error) {
      if (saved) return saved;
      throw error;
    } finally {
      clearTimeout(timer);
    }
  })());
});
