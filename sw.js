const CACHE_NAME = "vocab-app-v2";

const ASSETS = [
  "/",
  "/index.html",
  "/icon.png",

  // якщо є
  "/sw.js",

  // Firebase (ВАЖЛИВО)
  "https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js",
  "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js",
  "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js"
];

self.addEventListener("install", e => {
  console.log("✅ SW install");

  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
  );
});

// activate → чистимо старий кеш
self.addEventListener("activate", e => {
  console.log("♻️ SW activate");

  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(k => {
          if (k !== CACHE_NAME) return caches.delete(k);
        })
      )
    )
  );
});

// fetch → cache-first
self.addEventListener("fetch", e => {
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;

      return fetch(e.request)
        .then(res => {
          // кешуємо нові ресурси
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(e.request, res.clone());
            return res;
          });
        })
        .catch(() => {
          // fallback якщо офлайн
          if (e.request.mode === "navigate") {
            return caches.match("/index.html");
          }
        });
    })
  );
});
