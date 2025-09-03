// sw.js
const CACHE_NAME = 'lifetiles-v7';

// 重要：用 SW 的 scope 來組資源路徑，避免 GitHub Pages 子目錄抓錯
const SCOPE = self.registration.scope; // e.g. https://<user>.github.io/LifeTiles/
const assets = [
  'index.html',
  'styles.css',
  'manifest.json',
  'script.js',
  'books-films.js',
  'app.js',
  'icons/icon-192x192.png',
  'icons/icon-512x512.png',
].map(p => new URL(p, SCOPE).toString());

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(assets))
      .then(() => self.skipWaiting()) // 讓新版 SW 立即進入 activate
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // 清掉舊版 cache
    const names = await caches.keys();
    await Promise.all(names.map(n => n !== CACHE_NAME ? caches.delete(n) : null));
    await self.clients.claim(); // 讓目前開著的頁面也用新版 SW
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  event.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) return cached;
    try {
      const fresh = await fetch(req);
      return fresh;
    } catch (err) {
      // 離線兜底：如果是導覽請求，回 index.html
      if (req.mode === 'navigate') {
        return caches.match(new URL('index.html', SCOPE).toString());
      }
      throw err;
    }
  })());
});
