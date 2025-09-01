// LifeTiles PWA - Main Application Controller

document.addEventListener('DOMContentLoaded', function() {
    // Add touch event debugging
    console.log('Device Info:', {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        maxTouchPoints: navigator.maxTouchPoints,
        isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent)
    });
    
    initializeApp();
});

function initializeApp() {
    // 1. 初始化核心功能
    LifeTilesCore.addTouchEventSupport();
    LifeTilesStorage.initializeLocalStorage();
    LifeTilesCore.setupTabNavigation();
    
    // 2. 初始化各模組（注意順序：Todo 在前，Daily Challenge 在後）
    LifeTilesTodo.initializeTodoLists();
    LifeTilesDailyChallenge.initializeCalendar();
    LifeTilesBooksFilms.initializeBooksFilmsLists();
    
    // 3. 設置事件監聽器
    LifeTilesTodo.setupTodoEventListeners();
    LifeTilesDailyChallenge.setupDailyChallengeEventListeners();
    LifeTilesBooksFilms.setupBooksFilmsEventListeners();
    
    // 4. 檢查 PWA 狀態
    LifeTilesCore.checkPWAStatus();
    
    // 5. 恢復上次的標籤頁狀態
    restoreLastTab();
}

function restoreLastTab() {
    const lastTab = localStorage.getItem('lifetiles_current_tab');
    if (lastTab) {
        const tabButton = document.querySelector(`[data-tab="${lastTab}"]`);
        if (tabButton) {
            LifeTilesCore.activateTab(tabButton);
        }
    }
}

// 導出全局 API
window.LifeTiles = {
    Core: window.LifeTilesCore,
    Storage: window.LifeTilesStorage,
    Todo: window.LifeTilesTodo,
    DailyChallenge: window.LifeTilesDailyChallenge,
    BooksFilms: window.LifeTilesBooksFilms,
    // 向後兼容的函數
    saveToStorage: window.LifeTilesStorage.saveToStorage,
    loadFromStorage: window.LifeTilesStorage.loadFromStorage,
    getInitialData: window.LifeTilesStorage.getInitialData
};

console.log('LifeTiles PWA initialized with modular architecture');
