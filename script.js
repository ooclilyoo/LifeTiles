// LifeTiles PWA JavaScript

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Main app initialization
function initializeApp() {
    // Register service worker for PWA functionality
    registerServiceWorker();
    
    // Initialize local storage
    initializeLocalStorage();
    
    // Set up tab navigation
    setupTabNavigation();
    
    // Check if app is running as PWA
    checkPWAStatus();
}

// Service Worker Registration
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('Service Worker registered successfully:', registration);
            })
            .catch(error => {
                console.log('Service Worker registration failed:', error);
            });
    }
}

// Local Storage Initialization
function initializeLocalStorage() {
    // Initialize data structures for each tab
    const storageKeys = {
        dailyChallenge: 'lifetiles_daily_challenge',
        todoList: 'lifetiles_todo_list',
        booksFilms: 'lifetiles_books_films'
    };
    
    // Check if data exists, if not initialize with empty structures
    Object.entries(storageKeys).forEach(([key, storageKey]) => {
        if (!localStorage.getItem(storageKey)) {
            const initialData = getInitialData(key);
            localStorage.setItem(storageKey, JSON.stringify(initialData));
            console.log(`Initialized ${key} with default data`);
        }
    });
}

// Get initial data structure for each tab
function getInitialData(tabType) {
    switch(tabType) {
        case 'dailyChallenge':
            return {
                currentChallenge: null,
                completedChallenges: [],
                streak: 0,
                lastCompleted: null
            };
        case 'todoList':
            return {
                tasks: [],
                completed: [],
                categories: ['Personal', 'Work', 'Health', 'Learning']
            };
        case 'booksFilms':
            return {
                books: {
                    reading: [],
                    completed: [],
                    wishlist: []
                },
                films: {
                    watching: [],
                    completed: [],
                    wishlist: []
                }
            };
        default:
            return {};
    }
}

// Tab Navigation Setup
function setupTabNavigation() {
    const navTabs = document.querySelectorAll('.nav-tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    navTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            
            // Update active states
            navTabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            this.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
            
            // Save current tab to local storage
            localStorage.setItem('lifetiles_current_tab', targetTab);
            
            // Log tab change for debugging
            console.log(`Switched to tab: ${targetTab}`);
        });
    });
}

// Check PWA Status
function checkPWAStatus() {
    // Check if running in standalone mode (installed PWA)
    if (window.matchMedia('(display-mode: standalone)').matches) {
        console.log('App is running as installed PWA');
        document.body.classList.add('pwa-mode');
    } else {
        console.log('App is running in browser mode');
        document.body.classList.add('browser-mode');
    }
    
    // Check if running on iOS
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
        console.log('Running on iOS device');
        document.body.classList.add('ios-device');
    }
}

// Utility function to save data to local storage
function saveToStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error('Error saving to local storage:', error);
        return false;
    }
}

// Utility function to load data from local storage
function loadFromStorage(key) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('Error loading from local storage:', error);
        return null;
    }
}

// Export functions for future use
window.LifeTiles = {
    saveToStorage,
    loadFromStorage,
    getInitialData
};
