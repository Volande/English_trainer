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

  // ❗ 1. ІГНОРУЄМО ВСЕ КРІМ GET
  if (req.method !== "GET" || req.url.startsWith("https://")) {
  return;
}

  // ❗ 2. ІГНОРУЄМО FIREBASE / API
  if (
    req.url.includes("firestore") ||
    req.url.includes("googleapis") ||
    req.url.includes("gstatic")
  ) {
    return;
  }

  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;

      return fetch(req).then(res => {

        // ❗ 3. НЕ кешуємо погані відповіді
        if (!res || res.status !== 200 || res.type === "opaque") {
          return res;
        }

        return caches.open(CACHE_NAME).then(cache => {
          cache.put(req, res.clone());
          return res;
        });
      });
    })
  );
});
