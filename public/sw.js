const CACHE_NAME = "seasignal-v2";
const OFFLINE_URL = "/offline.html";

const PRECACHE_URLS = [
  "/dashboard",
  "/certs",
  "/incidents",
  "/sea-time",
  "/messages",
  "/settings",
  "/offline.html",
];

// Install: precache app shell and offline fallback
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    })
  );
  self.skipWaiting();
});

// Activate: clean up old caches
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

// Push notification handler
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "SeaSignal", body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "SeaSignal";
  const options = {
    body: data.body || "",
    icon: data.icon || "/icon.svg",
    badge: "/icon.svg",
    tag: data.tag || "seasignal-notification",
    data: {
      url: data.url || "/dashboard",
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click handler — open or focus the target URL
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || "/dashboard";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      // Try to focus an existing tab with the same origin
      for (const client of windowClients) {
        const clientUrl = new URL(client.url);
        if (clientUrl.origin === self.location.origin) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // No existing tab — open a new one
      return clients.openWindow(targetUrl);
    })
  );
});

// Background sync for offline form submissions
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-data") {
    event.waitUntil(handleBackgroundSync());
  }
});

async function handleBackgroundSync() {
  try {
    const cache = await caches.open("seasignal-offline-queue");
    const requests = await cache.keys();

    for (const request of requests) {
      const cachedResponse = await cache.match(request);
      if (!cachedResponse) continue;

      const body = await cachedResponse.text();
      try {
        await fetch(request.url, {
          method: request.method || "POST",
          headers: { "Content-Type": "application/json" },
          body,
        });
        await cache.delete(request);
      } catch {
        // Still offline — leave in queue, will retry on next sync
        break;
      }
    }
  } catch {
    // Queue might not exist yet — nothing to sync
  }
}

// Fetch handler
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // For non-GET requests, try network and queue for sync if offline
  if (request.method !== "GET") {
    if (request.method === "POST" || request.method === "PUT" || request.method === "PATCH") {
      event.respondWith(
        fetch(request.clone()).catch(async () => {
          // Queue the request body for background sync
          try {
            const body = await request.clone().text();
            const offlineCache = await caches.open("seasignal-offline-queue");
            await offlineCache.put(
              request.url,
              new Response(body, { headers: { "Content-Type": "application/json" } })
            );
            if (self.registration.sync) {
              await self.registration.sync.register("sync-data");
            }
          } catch {
            // Best-effort queuing
          }
          return new Response(JSON.stringify({ queued: true }), {
            status: 202,
            headers: { "Content-Type": "application/json" },
          });
        })
      );
    }
    return;
  }

  // API calls and Supabase: network-first
  if (
    url.pathname.startsWith("/api/") ||
    url.hostname.includes("supabase")
  ) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Static assets (JS, CSS, images, fonts): cache-first
  if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|ico|woff2?|ttf)$/) ||
    url.pathname.startsWith("/_next/static/")
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        });
      })
    );
    return;
  }

  // Navigation requests (HTML pages): network-first with offline fallback
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) => {
            return cached || caches.match(OFFLINE_URL);
          })
        )
    );
    return;
  }

  // Everything else: stale-while-revalidate
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
