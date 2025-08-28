// sw.js
const CACHE_NAME = 'lifetiles-v2';

// 以 SW 的 scope 為基準，產生要快取的絕對網址（適用 GitHub Pages 子路徑）
const SCOPE = self.registration.scope; // e.g. https://ooclilyoo.github.io/LifeTiles/
const urlsToCache = [
  '',                // 根（對應 /LifeTiles/）
  'index.html',
  'styles.css',
  'script.js',
  'manifest.json',
  'icons/icon-192x192.png',
  'icons/icon-512x512.png'
].map(p => new URL(p, SCOPE).toString());

// Install：預先快取
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
  // 立即啟用新 SW（避免卡在舊版）
  self.skipWaiting();
});

// Activate：清理舊版快取
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => (k !== CACHE_NAME ? caches.delete(k) : null)))
    )
  );
  // 立刻接管 clients
  self.clients.claim();
});

// Fetch：同源請求先查快取，沒命中再走網路
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // 只攔截同源 GET 請求（避免影響外站與非 GET）
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) {
    return; // 讓瀏覽器自己處理
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      return (
        cached ||
        fetch(event.request).then(resp => {
          // 動態快取同源成功回應（可視需要保守些）
          const respClone = resp.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, respClone));
          return resp;
        }).catch(() =>
          // 若離線導致抓不到，對於導覽請求回退 index.html（單頁應用常用）
          url.pathname.endsWith('/') || event.request.mode === 'navigate'
            ? caches.match(new URL('index.h
