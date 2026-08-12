const CACHE_NAME = "ferreteria-eh-v1";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./nosotros.html",
  "./login.html",
  "./admin.html",
  "./manifest.json",
  "./css/style.css",
  "./js/config.js",
  "./js/firebase-init.js",
  "./js/ui.js",
  "./js/storefront.js",
  "./js/about.js",
  "./js/login.js",
  "./js/admin.js",
  "./assets/logo-ferreteria-eh.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request).catch(() => caches.match("./index.html")));
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((network) => {
          const isSameOrigin = new URL(event.request.url).origin === self.location.origin;
          if (isSameOrigin && network.ok) {
            const copy = network.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return network;
        })
        .catch(() => caches.match("./index.html"));
    })
  );
});
