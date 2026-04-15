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
  const url = new URL(event.request.url);

  // 🔵 Firebase CDN — network first
  if (url.origin.includes("gstatic.com")) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // 🟢 App shell — cache first
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request)
        .then(res => {
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
