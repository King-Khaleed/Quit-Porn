const CACHE_NAME = "quitporn-v1";
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
  "/intercept",
];

const DEFAULT_BLOCKLIST = [
  "pornhub.com",
  "xvideos.com",
  "xnxx.com",
  "xhamster.com",
  "redtube.com",
  "youporn.com",
  "onlyfans.com",
  "chaturbate.com",
  "stripchat.com",
  "livejasmin.com",
  "omegle.com",
  "chatrandom.com",
  "chatroulette.com",
];

let userBlocklist = [];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "UPDATE_BLOCKLIST") {
    userBlocklist = event.data.blocklist || [];
  }
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const hostname = url.hostname.replace("www.", "");

  const isBlocked = [...DEFAULT_BLOCKLIST, ...userBlocklist].some(
    (blocked) => hostname === blocked || hostname.endsWith("." + blocked)
  );

  if (isBlocked) {
    const interceptUrl = new URL("/intercept", self.location.origin);
    interceptUrl.searchParams.set("domain", hostname);
    event.respondWith(Response.redirect(interceptUrl.toString()));
    return;
  }

  if (event.request.mode === "navigate") {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const fetchPromise = fetch(event.request)
          .then((response) => {
            if (response && response.status === 200) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, clone);
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
    event.request.method === "GET" &&
    (event.request.destination === "style" ||
     event.request.destination === "script" ||
     event.request.destination === "font" ||
     event.request.destination === "image")
  ) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const fetchPromise = fetch(event.request).then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clone);
            });
          }
          return response;
        }).catch(() => cached || new Response("", { status: 503 }));
        return cached || fetchPromise;
      })
    );
    return;
  }

  event.respondWith(fetch(event.request));
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