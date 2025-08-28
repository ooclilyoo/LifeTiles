// Service Worker Registration
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      // 等頁面載入完成再註冊，避免路徑/快取競爭狀況
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('./sw.js') // 重要：使用相對路徑，支援 GitHub Pages 子路徑 /LifeTiles/
          .then((registration) => {
            console.log('Service Worker registered successfully:', registration.scope);
          })
          .catch((error) => {
            console.log('Service Worker registration failed:', error);
          });
      });
    }
  }
  