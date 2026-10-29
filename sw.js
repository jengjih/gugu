// 股娃娃離線快取：先用手機裡的版本秒開，同時在背景抓新版，下次打開就是新的
const CACHE = 'gugu-v1';
const SAME = self.location.origin;
const CDN = ['https://cdn.jsdelivr.net', 'https://fonts.googleapis.com', 'https://fonts.gstatic.com'];

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || !(url.origin === SAME || CDN.includes(url.origin))) return;
  // 網址的 #k=… 不會送到這裡；首頁不管有沒有 ?setup 都用同一份快取
  const key = url.origin === SAME && url.pathname.endsWith('/') ? new Request(url.origin + url.pathname) : req;
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(key);
    const net = fetch(req).then(res => { if (res.ok || res.type === 'opaque') c.put(key, res.clone()); return res; }).catch(() => hit);
    return hit || net;
  }));
});
