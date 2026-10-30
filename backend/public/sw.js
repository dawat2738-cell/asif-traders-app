// Asif Traders service worker — app-like opening via Add to Home Screen.
// Caches ONLY the static shell (page, manifest, icons, banner, profile,
// product pictures). API responses (/api/*) are NEVER cached, so orders,
// bills, and customer data always come fresh from the server.
const CACHE = "asif-traders-shell-v1";
const SHELL = [
  "/",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/img/banner.png",
  "/img/profile.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin) return;
  // Never cache API traffic.
  if (url.pathname.startsWith("/api/")) return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      // Product pictures, icons, manifest: cache-first (they rarely change).
      if (cached && (url.pathname.startsWith("/img/") || url.pathname.startsWith("/icons/") || url.pathname === "/manifest.webmanifest")) {
        return cached;
      }
      // Everything else: network first, fall back to the cached shell offline.
      return fetch(event.request)
        .then((res) => {
          if (res.ok && (url.pathname === "/" || url.pathname === "/seller")) {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(event.request, copy));
          }
          return res;
        })
        .catch(() => cached || caches.match("/"));
    })
  );
});
