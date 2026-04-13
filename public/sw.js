const CACHE = "progress-v1";
const OFFLINE_URL = "/auth/signin";

// Assets to cache on install
const PRECACHE = [
  "/auth/signin",
  "/icon-192.png",
  "/icon-512.png",
  "/logo.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  // Only handle GET, skip API and auth routes
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/")) return;

  e.respondWith(
    fetch(e.request)
      .then((res) => {
        // Cache successful responses for static assets
        if (res.ok && (url.pathname.startsWith("/_next/static/") || url.pathname.match(/\.(png|jpg|svg|ico|webp)$/))) {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
