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

  // ❗ 1. тільки GET
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // ❗ 2. тільки http/https
  if (url.protocol !== "http:" && url.protocol !== "https:") return;

  // ❗ 3. тільки свій домен (КЛЮЧОВЕ)
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    (async () => {

      const cache = await caches.open(CACHE_NAME);

      const cached = await cache.match(req);
      if (cached) return cached;

      try {
        const res = await fetch(req);

        // ❗ 4. перевірка відповіді
        if (!res || res.status !== 200 || res.type !== "basic") {
          return res;
        }

        await cache.put(req, res.clone());
        return res;

      } catch (err) {
        if (req.mode === "navigate") {
          return cache.match("./index.html");
        }
      }

    })()
  );
});
