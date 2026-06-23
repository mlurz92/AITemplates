/* =====================================================================
 * Prompt-Templates – Service Worker
 * ---------------------------------------------------------------------
 * Liefert echtes Offline-Verhalten für die installierbare PWA.
 *
 * Strategie-Matrix:
 *   • App-Shell (HTML/CSS/JS/Icons/Manifest)  → Stale-While-Revalidate
 *   • CDN-Bibliotheken (GSAP, SortableJS, …)  → Cache-First (mit Refresh)
 *   • API  (/api/templates)                   → Network-First, niemals
 *                                                im Shell-Cache abgelegt,
 *                                                aber letzter erfolgreicher
 *                                                GET wird als Offline-
 *                                                Fallback vorgehalten.
 *   • templates.json (statischer Fallback)     → Stale-While-Revalidate
 * ===================================================================== */

const SW_VERSION = 'v3-2026-06';
const SHELL_CACHE = `pt-shell-${SW_VERSION}`;
const CDN_CACHE = `pt-cdn-${SW_VERSION}`;
const RUNTIME_CACHE = `pt-runtime-${SW_VERSION}`;
const API_FALLBACK_CACHE = `pt-api-${SW_VERSION}`;

/* Kern-Assets, die für den ersten Start zwingend im Cache liegen müssen. */
const PRECACHE_URLS = [
  './',
  './index.html',
  './style.css',
  './enhancements.css',
  './script.js',
  './enhancements.js',
  './aurora-webgl.js',
  './manifest.json',
  './templates.json',
  './browserconfig.xml',
  './icons/favicon.svg',
  './icons/favicon.ico',
  './icons/favicon-96x96.png',
  './icons/apple-touch-icon.png',
  './icons/web-app-manifest-192x192.png',
  './icons/web-app-manifest-512x512.png',
];

/* Externe Hosts, deren Antworten Cache-First behandelt werden. */
const CDN_HOSTS = ['cdnjs.cloudflare.com', 'cdn.jsdelivr.net', 'unpkg.com', 'huggingface.co', 'cdn-lfs.huggingface.co'];

/* --------------------------------------------------------------- Install */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) =>
      // Einzeln hinzufügen, damit ein fehlendes Asset die Installation nicht abbricht.
      Promise.allSettled(PRECACHE_URLS.map((url) => cache.add(url)))
    ).then(() => self.skipWaiting())
  );
});

/* -------------------------------------------------------------- Activate */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      const valid = new Set([SHELL_CACHE, CDN_CACHE, RUNTIME_CACHE, API_FALLBACK_CACHE]);
      await Promise.all(keys.filter((k) => !valid.has(k)).map((k) => caches.delete(k)));
      if (self.registration.navigationPreload) {
        try { await self.registration.navigationPreload.enable(); } catch (_) {}
      }
      await self.clients.claim();
    })()
  );
});

/* Erlaubt der App, sofortiges Update zu triggern. */
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING' || event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

/* ----------------------------------------------------------------- Fetch */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return; // POSTs (Speichern) niemals abfangen.

  const url = new URL(request.url);

  // 1) Templates-API – Network-First mit Offline-Fallback.
  if (url.pathname === '/api/templates') {
    event.respondWith(networkFirstApi(request));
    return;
  }

  // 2) Navigationen (Dokument) – Network-First, dann App-Shell.
  if (request.mode === 'navigate') {
    event.respondWith(navigationHandler(event));
    return;
  }

  // 3) CDN-Bibliotheken / Modelle – Cache-First.
  if (CDN_HOSTS.includes(url.hostname)) {
    event.respondWith(cacheFirst(request, CDN_CACHE));
    return;
  }

  // 4) Gleiche Origin (App-Shell + sonstige Assets) – Stale-While-Revalidate.
  if (url.origin === self.location.origin) {
    event.respondWith(staleWhileRevalidate(request, SHELL_CACHE));
    return;
  }

  // 5) Alles andere – einfacher Netzwerkversuch mit Runtime-Cache-Fallback.
  event.respondWith(
    fetch(request).catch(() => caches.match(request, { cacheName: RUNTIME_CACHE }))
  );
});

/* ---------------------------------------------------------- Strategien */
async function networkFirstApi(request) {
  const cache = await caches.open(API_FALLBACK_CACHE);
  try {
    const response = await fetch(request, { cache: 'no-store' });
    if (response && response.ok) cache.put('api-templates-latest', response.clone());
    return response;
  } catch (_) {
    const cached = await cache.match('api-templates-latest');
    if (cached) {
      // Markiere die Antwort als offline-bereitgestellt.
      const body = await cached.text();
      return new Response(body, {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'X-Served-By': 'sw-offline-fallback' },
      });
    }
    // Letzter Ausweg: statische templates.json in App-Shell-konformes Format hüllen.
    const staticJson = await caches.match('./templates.json');
    if (staticJson) {
      const data = await staticJson.json();
      return new Response(JSON.stringify({ data, lastUpdated: 0, syncedFrom: 'sw-static-fallback' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'X-Served-By': 'sw-static-fallback' },
      });
    }
    return new Response(JSON.stringify({ error: 'offline' }), { status: 503, headers: { 'Content-Type': 'application/json' } });
  }
}

async function navigationHandler(event) {
  try {
    const preload = await event.preloadResponse;
    if (preload) return preload;
    const network = await fetch(event.request);
    const cache = await caches.open(SHELL_CACHE);
    cache.put('./index.html', network.clone());
    return network;
  } catch (_) {
    return (await caches.match('./index.html')) || (await caches.match('./')) ||
      new Response('<h1>Offline</h1>', { status: 503, headers: { 'Content-Type': 'text/html' } });
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) {
    // Im Hintergrund auffrischen, ohne den Treffer zu verzögern.
    fetch(request).then((res) => { if (res && res.ok) cache.put(request, res.clone()).catch(() => {}); }).catch(() => {});
    return cached;
  }
  try {
    const response = await fetch(request);
    if (response && (response.ok || response.type === 'opaque')) cache.put(request, response.clone()).catch(() => {});
    return response;
  } catch (err) {
    return cached || Response.error();
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response && response.ok) cache.put(request, response.clone()).catch(() => {});
      return response;
    })
    .catch(() => null);
  return cached || (await network) || Response.error();
}
