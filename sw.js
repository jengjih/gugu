// 股娃娃離線快取
// 頁面本身：有網路就拿最新版（最多等 3 秒），太慢或離線才用手機裡存的版本 → 更新後打開一次就是新版
// 圖示、字型、圖表套件：先用存的版本，背景再更新（這些幾乎不會變）
const CACHE = 'gugu-v2';
const SAME = self.location.origin;
const CDN = ['https://cdn.jsdelivr.net', 'https://fonts.googleapis.com', 'https://fonts.gstatic.com'];
const PAGE_WAIT_MS = 3000;

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())
));

self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || !(url.origin === SAME || CDN.includes(url.origin))) return;
  // 網址的 #k=… 不會送到這裡；首頁不管有沒有 ?setup 都用同一份快取
  const key = url.origin === SAME && url.pathname.endsWith('/') ? new Request(url.origin + url.pathname) : req;
  const save = res => { if (res.ok || res.type === 'opaque') caches.open(CACHE).then(c => c.put(key, res.clone())); return res; };

  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      const hit = await caches.match(key);
      const net = fetch(req, { cache: 'no-cache' }).then(save);
      if (!hit) return net;
      const slow = new Promise(r => setTimeout(() => r(hit), PAGE_WAIT_MS));
      return Promise.race([net.catch(() => hit), slow]);
    })());
    return;
  }

  e.respondWith(caches.match(key).then(hit => {
    const net = fetch(req).then(save).catch(() => hit);
    return hit || net;
  }));
});
