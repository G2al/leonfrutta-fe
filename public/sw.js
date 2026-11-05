// Service worker di LeonFrutta.
// Mette in cache solo la shell dell'app (pagine e asset statici dello stesso
// dominio). Le chiamate all'API (POST e GET) non passano mai da qui: nessuna
// cache delle risposte e nessuna coda di invio offline.

const CACHE = "leonfrutta-shell-v3";
// Pagine disponibili anche offline. Il dettaglio /richieste/{codice} non viene
// salvato, per non conservare i codici segreti nella cache.
const PAGES = ["/", "/richieste"];
const SHELL = [...PAGES, "/manifest.webmanifest", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Solo GET sullo stesso dominio e mai l'API: tutto il resto va in rete.
  if (
    request.method !== "GET" ||
    url.origin !== self.location.origin ||
    url.pathname.startsWith("/api/")
  ) {
    return;
  }

  // Pagine: prima la rete, poi la copia in cache se offline.
  if (request.mode === "navigate") {
    const cacheable = PAGES.includes(url.pathname);
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok && cacheable) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(url.pathname, copy));
          }
          return response;
        })
        .catch(() =>
          cacheable
            ? caches.match(url.pathname).then((cached) => cached || Response.error())
            : Response.error(),
        ),
    );
    return;
  }

  // Asset statici e immagini ottimizzate (logo): prima la cache.
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/_next/image") ||
    url.pathname.startsWith("/icons/")
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(CACHE).then((cache) => cache.put(request, copy));
            }
            return response;
          }),
      ),
    );
  }
});
