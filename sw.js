// TtGamer15 Games keeps working without internet after the first visit (handy on a handheld):
// pages and pictures come from the internet when it's there, and from a saved copy when it isn't.
const CACHE = 'ttg-v2';
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(['/', '/apple-touch-icon.png', '/art/noodle-bots.jpg?v=3', '/art/museum-after-dark.jpg?v=3', '/art/ancient-bird.jpg?v=1']).catch(() => {})).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => { e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', (e) => {
  const req = e.request, u = new URL(req.url);
  if (req.method !== 'GET' || u.origin !== location.origin || req.headers.has('range')) return;   // other sites (fonts, box art) go straight through
  e.respondWith(netFirst(req));
});
async function netFirst(req) {
  const c = await caches.open(CACHE);
  const net = fetch(req).then((res) => { if (res && res.status === 200 && res.type === 'basic') c.put(req, res.clone()).catch(() => {}); return res; });
  const slow = new Promise((ok) => setTimeout(ok, 3500, null));   // a very slow connection uses the saved copy instead of waiting
  try { const first = await Promise.race([net, slow]); if (first) return first; } catch (err) { /* no internet */ }
  const hit = (await c.match(req)) || (await c.match(req, { ignoreSearch: true }));
  return hit || net;
}
