/* Public shell plus an explicitly downloaded lyrics pack; no account pages. */
const SHELL_CACHE = "hymnbook-shell-v7";
const LYRICS_CACHE = "hymnbook-lyrics-v1";
const PACK_KEY = "/__offline/library";
const PUBLIC_ASSETS = ["/offline.html", "/offline-reader.js", "/offline-presentation.js", "/offline.css", "/pwa/icon-192.png", "/pwa/icon-512.png", "/pwa/icon-maskable-512.png"];

async function readPack() {
  const response = await (await caches.open(LYRICS_CACHE)).match(PACK_KEY);
  return response ? response.json() : null;
}
function status(pack) {
  return pack ? { count: pack.hymns.length, revision: pack.revision, checkedAt: pack.checkedAt } : null;
}
function validPack(pack) {
  return pack?.schemaVersion === 1 && typeof pack.revision === "string" && /^[a-f0-9]{64}$/.test(pack.revision)
    && Array.isArray(pack.hymns) && pack.hymns.length > 0
    && new Set(pack.hymns.map(h => h.id)).size === pack.hymns.length
    && pack.hymns.every(h => typeof h.id === "string" && typeof h.title === "string" && Number.isFinite(h.number)
      && typeof h.lyricsText === "string" && Array.isArray(h.sections)
      && h.sections.every(s => ["verse", "refrain"].includes(s.type) && Array.isArray(s.lines) && s.lines.every(line => typeof line === "string")));
}
let pending = Promise.resolve();
async function command(name) {
  const old = await readPack();
  if (name === "STATUS") return { status: status(old) };
  if (name === "LIBRARY") return { status: status(old), library: old };
  if (name === "REMOVE") {
    await caches.delete(LYRICS_CACHE);
    await broadcast(null);
    return { status: null };
  }
  if (!["CHECK", "DOWNLOAD"].includes(name)) throw new Error("Unknown offline action.");
  if (name === "CHECK" && !old) return { status: null };
  const response = await fetch("/api/offline/library", {
    cache: "no-store", credentials: "omit", redirect: "error", signal: AbortSignal.timeout(45000),
    headers: old ? { "If-None-Match": `"${old.revision}"` } : {},
  });
  let pack;
  if (response.status === 304 && old) pack = old;
  else {
    if (!response.ok) throw new Error("Could not update hymns. Your existing download is safe. Please try again.");
    pack = await response.json();
    if (!validPack(pack)) throw new Error("The hymn download was incomplete. Your existing download is safe.");
  }
  pack.checkedAt = new Date().toISOString();
  await (await caches.open(LYRICS_CACHE)).put(PACK_KEY, Response.json(pack));
  await broadcast(status(pack));
  return { status: status(pack) };
}
async function broadcast(value) {
  const clients = await self.clients.matchAll({ type: "window" });
  clients.forEach(client => client.postMessage({ type: "HYMN_OFFLINE_CHANGED", status: value }));
}
self.addEventListener("message", event => {
  if (event.data?.type !== "HYMN_OFFLINE" || !event.ports[0]) return;
  const task = pending.then(() => command(event.data.command));
  pending = task.catch(() => {});
  event.waitUntil(task.then(result => event.ports[0].postMessage({ ok: true, ...result }))
    .catch(error => event.ports[0].postMessage({ ok: false, error: error.message || "Offline storage is unavailable." })));
});

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.addAll(PUBLIC_ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith("hymnbook-shell-") && key !== SHELL_CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  if (PUBLIC_ASSETS.includes(url.pathname) && !url.search) {
    event.respondWith(caches.match(url.pathname).then((cached) => cached || fetch(request)));
    return;
  }
  // Do not intercept OAuth, APIs, admin requests, or React navigation payloads.
  if (request.mode !== "navigate" || /^\/(auth|api|admin|profile)(\/|$)/.test(url.pathname)) return;
  // A browser-cached online document cannot hydrate without its network payloads.
  // Force a real network attempt before choosing the self-contained offline reader.
  event.respondWith(fetch(new Request(request, { cache: "no-store" })).catch(async () => {
    const offline = await caches.match("/offline.html");
    return offline || new Response("You are offline. Reconnect to open the hymnbook.", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }));
});
