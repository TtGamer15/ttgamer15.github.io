// TtGamer15 Games keeps working without internet after the first visit (handy on a handheld).
// Pages (the menu and the games) always come fresh from the internet when it's there, even if it's slow;
// the saved copy is only used when there's no internet at all. Pictures and other files use the saved copy
// if the internet is very slow.
const CACHE = 'ttg-v3';
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(['/', '/apple-touch-icon.png', '/art/noodle-bots.jpg?v=3', '/art/museum-after-dark.jpg?v=3', '/art/ancient-bird.jpg?v=1']).catch(() => {})).then(() => self.skipWaiting()));
});
// old saved copies (like an old version of a game) are thrown away
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request, u = new URL(req.url);
  if (req.method !== 'GET' || u.origin !== location.origin || req.headers.has('range')) return;   // other sites (fonts, box art) go straight through
  const page = req.mode === 'navigate' || req.destination === 'document' || req.destination === 'iframe';
  e.respondWith(page ? freshPage(req) : netFirst(req));
});
async function freshPage(req) {
  const c = await caches.open(CACHE);
  try {
    const res = await fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' });   // asks the website whether there's a newer copy
    if (res && res.status === 200) c.put(req, res.clone()).catch(() => {});
    return res;
  } catch (err) {   // no internet: the saved copy
    return (await c.match(req)) || (await c.match(req, { ignoreSearch: true })) || Response.error();
  }
}
async function netFirst(req) {
  const c = await caches.open(CACHE);
  const net = fetch(req).then((res) => { if (res && res.status === 200 && res.type === 'basic') c.put(req, res.clone()).catch(() => {}); return res; });
  const slow = new Promise((ok) => setTimeout(ok, 3500, null));   // a very slow connection uses the saved copy instead of waiting
  try { const first = await Promise.race([net, slow]); if (first) return first; } catch (err) { /* no internet */ }
  const hit = (await c.match(req)) || (await c.match(req, { ignoreSearch: true }));
  return hit || net;
}
