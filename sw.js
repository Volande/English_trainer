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

  // ❗ ІГНОРУЄМО ВСІ НЕ-GET
  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request)
        .then(res => {

          // ❗ додатковий захист
          if (!res || res.status !== 200) return res;

          return caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, res.clone());
            return res;
          });
        })
        .catch(() => {
          if (event.request.mode === "navigate") {
            return caches.match("./index.html");
          }
        });
    })
  );
});
