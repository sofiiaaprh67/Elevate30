/* ELEVATE 30 — Service worker básico
 * - Guarda los archivos estáticos (JS, CSS, fuentes, iconos) para que la app abra rápido.
 * - Las páginas siempre se piden a la red (tienen datos personales);
 *   sin conexión se muestra /offline.html.
 * - No toca las peticiones a Supabase ni las Server Actions.
 * - Muestra el recordatorio diario (notificaciones push) y abre Hoy al tocarlo.
 * Sube VERSION cuando cambies este archivo.
 */
const VERSION = "e30-v2";
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

// Recordatorio diario
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : "" };
  }
  const title = data.title || "ELEVATE 30";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || "Tu check-in te espera. Con el mínimo ya cuenta.",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: "e30-reminder",
      renotify: false,
      data: { url: data.url || "/hoy" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const path = (event.notification.data && event.notification.data.url) || "/hoy";
  const target = new URL(path + (path.includes("?") ? "&" : "?") + "aviso=1", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.startsWith(self.location.origin) && "focus" in client) {
          return client.navigate(target).then((c) => (c || client).focus());
        }
      }
      return self.clients.openWindow(target);
    }),
  );
});
