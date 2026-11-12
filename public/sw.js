/* Cordova Public College portal service worker.
 *
 * Deliberately conservative: only same-origin GET requests are cached, and
 * navigations always try the network first so a deploy is picked up right
 * away. Everything else falls through to the browser untouched.
 */
const VERSION = "cpc-portal-v1";
const PAGE_CACHE = `${VERSION}-pages`;
const ASSET_CACHE = `${VERSION}-assets`;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(PAGE_CACHE)
      .then((cache) => cache.add(new Request("/", { cache: "reload" })))
      .catch(() => undefined)
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("cpc-portal-") && !key.startsWith(VERSION))
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

function isStaticAsset(request) {
  return ["style", "script", "font", "image"].includes(request.destination);
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches
              .open(PAGE_CACHE)
              .then((cache) => cache.put("/", copy))
              .catch(() => undefined);
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match("/");
          return (
            cached ||
            new Response("You're offline. Reconnect and try again.", {
              status: 503,
              headers: { "Content-Type": "text/plain; charset=utf-8" },
            })
          );
        }),
    );
    return;
  }

  if (!isStaticAsset(request)) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches
              .open(ASSET_CACHE)
              .then((cache) => cache.put(request, copy))
              .catch(() => undefined);
          }
          return response;
        })
        .catch((error) => {
          if (cached) return cached;
          throw error;
        });

      return cached || network;
    }),
  );
});
