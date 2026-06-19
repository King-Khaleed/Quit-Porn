const CACHE_NAME = "quitporn-v3";
const MAX_CACHE_SIZE = 50 * 1024 * 1024;
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/journal",
  "/autopsy",
  "/techniques",
  "/insights",
  "/settings",
  "/premium",
  "/install",
];

async function enforceCacheLimit() {
  const cache = await caches.open(CACHE_NAME);
  const keys = await cache.keys();
  let totalSize = 0;
  const entries = [];
  for (const request of keys) {
    const response = await cache.match(request);
    if (response) {
      const clone = response.clone();
      const blob = await clone.blob();
      totalSize += blob.size;
      entries.push({ size: blob.size, request });
    }
  }
  if (totalSize > MAX_CACHE_SIZE) {
    entries.sort((a, b) => a.size - b.size);
    while (totalSize > MAX_CACHE_SIZE && entries.length > STATIC_ASSETS.length) {
      const entry = entries.shift();
      if (entry) {
        const pathname = new URL(entry.request.url).pathname;
        if (!STATIC_ASSETS.includes(pathname)) {
          await cache.delete(entry.request);
          totalSize -= entry.size;
        }
      }
    }
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.mode === "navigate") {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request)
          .then((response) => {
            if (response && response.status === 200) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, clone);
                enforceCacheLimit();
              });
            }
            return response;
          })
          .catch(() => {
            return cached || new Response(
              `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Offline</title><style>body{background:#07070d;color:#e8e8ed;font-family:-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100dvh;padding:24px;text-align:center}.card{background:#111118;border:1px solid #1c1c26;border-radius:16px;padding:32px;max-width:360px}</style></head><body><div class="card"><h1>You're offline</h1><p>Connect to the internet to use QuitPorn. Your data is safe — it's stored on this device.</p></div></body></html>`,
              { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } }
            );
          });
        return cached || fetchPromise;
      })
    );
    return;
  }

  if (
    request.method === "GET" &&
    (request.destination === "style" ||
     request.destination === "script" ||
     request.destination === "font" ||
     request.destination === "image")
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request).then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, clone);
              enforceCacheLimit();
            });
          }
          return response;
        }).catch(() => cached || new Response("", { status: 503 }));
        return cached || fetchPromise;
      })
    );
    return;
  }

  event.respondWith(fetch(request));
});

self.addEventListener("push", (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const options = {
      body: data.body || "Stay strong. You've got this.",
      icon: "/icons/icon.svg",
      badge: "/icons/icon.svg",
      vibrate: [100, 50, 100],
      data: {
        url: data.url || "/",
      },
    };

    event.waitUntil(
      self.registration.showNotification(data.title || "QuitPorn", options)
    );
  } catch {}
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((windowClients) => {
      const existing = windowClients.find((c) => c.url === url);
      if (existing) {
        existing.focus();
        return;
      }
      clients.openWindow(url);
    })
  );
});
