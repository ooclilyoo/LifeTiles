// 暫時停用 SW，避免開發期被快取干擾
function registerServiceWorker() {
    return; // <-- 先直接 return
//    if ('serviceWorker' in navigator) {
//      console.log('[SW] registering…');
//      window.addEventListener('load', () => {
//        navigator.serviceWorker
//          .register('./sw.js')
//          .then(reg => console.log('[SW] registered:', reg.scope))
//          .catch(err => console.error('[SW] failed:', err));
//      });
//    } else {
//      console.warn('[SW] not supported');
//    }
  }
  