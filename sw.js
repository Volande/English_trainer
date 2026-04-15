const CACHE_NAME = "vocab-app-v4";

const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon.png"
];

// INSTALL
self.addEventListener("install", event => {
  console.log("✅ SW install");
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
  );
});

// ACTIVATE
self.addEventListener("activate", event => {
  console.log("♻️ SW activate");

  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );

  self.clients.claim();
});

// FETCH
self.addEventListener("fetch", event => {

  const req = event.request;
  const url = new URL(req.url);

  // ❗ 1. тільки http/https
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return;
  }

  // ❗ 2. тільки GET
  if (req.method !== "GET") {
    return;
  }

  // ❗ 3. тільки свій домен (ДУЖЕ РЕКОМЕНДУЮ)
  if (url.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;

      return fetch(req).then(res => {

        if (!res || res.status !== 200) return res;

        return caches.open(CACHE_NAME).then(cache => {
          cache.put(req, res.clone());
          return res;
        });
      });
    })
  );
});
