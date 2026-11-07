/* ELEVATE 30 — Service worker básico
 * - Guarda los archivos estáticos (JS, CSS, fuentes, iconos) para que la app abra rápido.
 * - Las páginas siempre se piden a la red (tienen datos personales);
 *   sin conexión se muestra /offline.html.
 * - No toca las peticiones a Supabase ni las Server Actions.
 * Sube VERSION cuando cambies este archivo.
 */
const VERSION = "e30-v1";
const STATIC_CACHE = `${VERSION}-static`;
const PRECACHE = [
  "/offline.html",
  "/icons/icon-192.png",
  "/icons/apple-touch-icon.png",
  "/brand/isotipo.webp",
  "/brand/wordmark.webp",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/brand/") ||
    url.pathname.startsWith("/icons/")
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Archivos estáticos con nombre único: primero la caché
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
            }
            return response;
          }),
      ),
    );
    return;
  }

  // Páginas: siempre de la red; sin conexión, la página de aviso
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match("/offline.html")));
  }
});
