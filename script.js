// LifeTiles PWA JavaScript

// Calendar state
let currentDate = new Date();
let selectedDate = null;

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Main app initialization
function initializeApp() {
    // Initialize local storage
    initializeLocalStorage();
    
    // Set up tab navigation
    setupTabNavigation();
    
    // Initialize calendar
    initializeCalendar();
    
    // Initialize todo lists
    initializeTodoLists();
    
    // Set up event listeners
    setupEventListeners();
    
    // Check if app is running as PWA
    checkPWAStatus();
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
                dateStatuses: {},
                currentMonth: new Date().getMonth(),
                currentYear: new Date().getFullYear()
            };
        case 'todoList':
            return {
                singleItems: [],
                recurringItems: []
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

// Initialize Todo Lists
function initializeTodoLists() {
    renderTodoList('singleItems', 'singleItemsList');
    renderTodoList('recurringItems', 'recurringItemsList');
}

// Render Todo List
function renderTodoList(listType, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const savedData = loadFromStorage('lifetiles_todo_list');
    const items = savedData?.[listType] || [];
    
    // Clear container
    container.innerHTML = '';
    
    if (items.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>No ${listType === 'singleItems' ? 'single' : 'recurring'} items yet</p>
            </div>
        `;
        return;
    }
    
    // Sort items alphabetically
    const sortedItems = [...items].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
    
    // Render each item
    sortedItems.forEach((item, index) => {
        const itemElement = createTodoItemElement(item, listType, index);
        container.appendChild(itemElement);
    });
}

// Create Todo Item Element
function createTodoItemElement(item, listType, index) {
    const itemElement = document.createElement('div');
    itemElement.className = 'todo-item';
    itemElement.dataset.index = index;
    
    itemElement.innerHTML = `
        <div class="todo-item-name">${item.name}</div>
        <div class="todo-item-actions">
            <button class="action-btn edit" title="Edit">✏️</button>
            <button class="action-btn delete" title="Delete">🗑️</button>
        </div>
    `;
    
    // Add click event for item details
    itemElement.querySelector('.todo-item-name').addEventListener('click', () => {
        showItemDetail(item, listType);
    });
    
    // Add edit event
    itemElement.querySelector('.action-btn.edit').addEventListener('click', (e) => {
        e.stopPropagation();
        editTodoItem(item, listType, index);
    });
    
    // Add delete event
    itemElement.querySelector('.action-btn.delete').addEventListener('click', (e) => {
        e.stopPropagation();
        deleteTodoItem(listType, index);
    });
    
    return itemElement;
}

// Show Item Detail
function showItemDetail(item, listType) {
    const modal = document.createElement('div');
    modal.className = 'item-detail-modal';
    
    modal.innerHTML = `
        <h3>${item.name}</h3>
        <div class="item-detail-content">
            <p>This is a ${listType === 'singleItems' ? 'single' : 'recurring'} item.</p>
            <p>Created: ${new Date(item.created).toLocaleDateString()}</p>
            <p>Details will be added in future updates...</p>
        </div>
        <div class="item-detail-actions">
            <button class="btn btn-secondary" id="closeDetail">Close</button>
        </div>
    `;
    
    // Add close event
    modal.querySelector('#closeDetail').addEventListener('click', () => {
        closeModal(modal);
    });
    
    // Add overlay
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.addEventListener('click', () => closeModal(modal));
    
    document.body.appendChild(overlay);
    document.body.appendChild(modal);
}

// Edit Todo Item
function editTodoItem(item, listType, index) {
    const modal = document.createElement('div');
    modal.className = 'add-item-modal';
    
    modal.innerHTML = `
        <h3>Edit ${listType === 'singleItems' ? 'Single' : 'Recurring'} Item</h3>
        <form class="add-item-form" id="editForm">
            <div class="form-group">
                <label for="editItemName">Item Name</label>
                <input type="text" id="editItemName" value="${item.name}" required>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" id="cancelEdit">Cancel</button>
                <button type="submit" class="btn btn-primary">Save Changes</button>
            </div>
        </form>
    `;
    
    // Add form submit event
    const form = modal.querySelector('#editForm');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const newName = modal.querySelector('#editItemName').value.trim();
        if (newName) {
            updateTodoItem(listType, index, newName);
            closeModal(modal);
        }
    });
    
    // Add cancel event
    modal.querySelector('#cancelEdit').addEventListener('click', () => {
        closeModal(modal);
    });
    
    // Add overlay
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.addEventListener('click', () => closeModal(modal));
    
    document.body.appendChild(overlay);
    document.body.appendChild(modal);
    
    // Focus on input
    setTimeout(() => modal.querySelector('#editItemName').focus(), 100);
}

// Update Todo Item
function updateTodoItem(listType, index, newName) {
    const savedData = loadFromStorage('lifetiles_todo_list') || {};
    if (savedData[listType] && savedData[listType][index]) {
        savedData[listType][index].name = newName;
        savedData[listType][index].updated = new Date().toISOString();
        saveToStorage('lifetiles_todo_list', savedData);
        
        // Re-render the list
        renderTodoList(listType, listType === 'singleItems' ? 'singleItemsList' : 'recurringItemsList');
    }
}

// Delete Todo Item
function deleteTodoItem(listType, index) {
    if (confirm('Are you sure you want to delete this item?')) {
        const savedData = loadFromStorage('lifetiles_todo_list') || {};
        if (savedData[listType] && savedData[listType][index]) {
            savedData[listType].splice(index, 1);
            saveToStorage('lifetiles_todo_list', savedData);
            
            // Re-render the list
            renderTodoList(listType, listType === 'singleItems' ? 'singleItemsList' : 'recurringItemsList');
        }
    }
}

// Add Todo Item
function addTodoItem(listType) {
    const modal = document.createElement('div');
    modal.className = 'add-item-modal';
    
    modal.innerHTML = `
        <h3>Add ${listType === 'singleItems' ? 'Single' : 'Recurring'} Item</h3>
        <form class="add-item-form" id="addForm">
            <div class="form-group">
                <label for="itemName">Item Name</label>
                <input type="text" id="itemName" placeholder="Enter item name..." required>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" id="cancelAdd">Cancel</button>
                <button type="submit" class="btn btn-primary">Add Item</button>
            </div>
        </form>
    `;
    
    // Add form submit event
    const form = modal.querySelector('#addForm');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const itemName = modal.querySelector('#itemName').value.trim();
        if (itemName) {
            createTodoItem(listType, itemName);
            closeModal(modal);
        }
    });
    
    // Add cancel event
    modal.querySelector('#cancelAdd').addEventListener('click', () => {
        closeModal(modal);
    });
    
    // Add overlay
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.addEventListener('click', () => closeModal(modal));
    
    document.body.appendChild(overlay);
    document.body.appendChild(modal);
    
    // Focus on input
    setTimeout(() => modal.querySelector('#itemName').focus(), 100);
}

// Create Todo Item
function createTodoItem(listType, name) {
    const savedData = loadFromStorage('lifetiles_todo_list') || {};
    
    if (!savedData[listType]) {
        savedData[listType] = [];
    }
    
    const newItem = {
        name: name,
        created: new Date().toISOString(),
        updated: new Date().toISOString()
    };
    
    savedData[listType].push(newItem);
    saveToStorage('lifetiles_todo_list', savedData);
    
    // Re-render the list
    renderTodoList(listType, listType === 'singleItems' ? 'singleItemsList' : 'recurringItemsList');
}

// Close Modal
function closeModal(modal) {
    const overlay = document.querySelector('.modal-overlay');
    if (overlay) overlay.remove();
    if (modal) modal.remove();
}

// Initialize Calendar
function initializeCalendar() {
    // Load saved month/year from localStorage
    const savedData = loadFromStorage('lifetiles_daily_challenge');
    if (savedData && savedData.currentMonth !== undefined && savedData.currentYear !== undefined) {
        currentDate = new Date(savedData.currentYear, savedData.currentMonth, 1);
    }
    
    renderCalendar();
}

// Render Calendar
function renderCalendar() {
    const monthYearElement = document.getElementById('monthYear');
    const calendarDaysElement = document.getElementById('calendarDays');
    
    if (!monthYearElement || !calendarDaysElement) return;
    
    // Update month/year display
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    monthYearElement.textContent = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    
    // Clear previous calendar
    calendarDaysElement.innerHTML = '';
    
    // Get first day of month and number of days
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    // Generate calendar days
    for (let i = 0; i < 42; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.textContent = date.getDate();
        
        // Check if it's current month
        if (date.getMonth() !== currentDate.getMonth()) {
            dayElement.classList.add('other-month');
        }
        
        // Check if it's today
        const today = new Date();
        if (date.toDateString() === today.toDateString()) {
            dayElement.classList.add('today');
        }
        
        // Check if it has a saved status
        const dateKey = date.toISOString().split('T')[0];
        const savedData = loadFromStorage('lifetiles_daily_challenge');
        if (savedData && savedData.dateStatuses && savedData.dateStatuses[dateKey]) {
            dayElement.classList.add(`status-${savedData.dateStatuses[dateKey]}`);
        }
        
        // Add click event
        dayElement.addEventListener('click', () => openStatusPicker(date));
        
        calendarDaysElement.appendChild(dayElement);
    }
    
    // Save current month/year to localStorage
    const currentData = loadFromStorage('lifetiles_daily_challenge') || {};
    currentData.currentMonth = currentDate.getMonth();
    currentData.currentYear = currentDate.getFullYear();
    saveToStorage('lifetiles_daily_challenge', currentData);
}

// Open Status Picker
function openStatusPicker(date) {
    const dateKey = date.toISOString().split('T')[0];
    const savedData = loadFromStorage('lifetiles_daily_challenge');
    const currentStatus = savedData?.dateStatuses?.[dateKey] || null;
    
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.addEventListener('click', closeStatusPicker);
    
    // Create status picker
    const picker = document.createElement('div');
    picker.className = 'status-picker';
    
    const dateString = date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    picker.innerHTML = `
        <h3>${dateString}</h3>
        <div class="status-options">
            <div class="status-option success ${currentStatus === 'success' ? 'selected' : ''}" data-status="success">
                ✅ Success
            </div>
            <div class="status-option rescued ${currentStatus === 'rescued' ? 'selected' : ''}" data-status="rescued">
                🆘 Rescued
            </div>
            <div class="status-option failed ${currentStatus === 'failed' ? 'selected' : ''}" data-status="failed">
                ❌ Failed
            </div>
            <div class="status-option no-challenge ${currentStatus === 'no-challenge' ? 'selected' : ''}" data-status="no-challenge">
                ⚪ No Challenge
            </div>
        </div>
    `;
    
    // Add click events to status options
    const statusOptions = picker.querySelectorAll('.status-option');
    statusOptions.forEach(option => {
        option.addEventListener('click', () => {
            const status = option.dataset.status;
            setDateStatus(date, status);
            closeStatusPicker();
        });
    });
    
    // Add to DOM
    document.body.appendChild(overlay);
    document.body.appendChild(picker);
}

// Set Date Status
function setDateStatus(date, status) {
    const dateKey = date.toISOString().split('T')[0];
    const savedData = loadFromStorage('lifetiles_daily_challenge') || {};
    
    if (!savedData.dateStatuses) {
        savedData.dateStatuses = {};
    }
    
    savedData.dateStatuses[dateKey] = status;
    saveToStorage('lifetiles_daily_challenge', savedData);
    
    // Update calendar display
    renderCalendar();
}

// Close Status Picker
function closeStatusPicker() {
    const overlay = document.querySelector('.modal-overlay');
    const picker = document.querySelector('.status-picker');
    
    if (overlay) overlay.remove();
    if (picker) picker.remove();
}

// Setup Event Listeners
function setupEventListeners() {
    // Previous month button
    const prevMonthBtn = document.getElementById('prevMonth');
    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            renderCalendar();
        });
    }
    
    // Next month button
    const nextMonthBtn = document.getElementById('nextMonth');
    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            renderCalendar();
        });
    }
    
    // Manage Challenges button
    const manageChallengesBtn = document.getElementById('manageChallengesBtn');
    if (manageChallengesBtn) {
        manageChallengesBtn.addEventListener('click', () => {
            // Switch to To-Do List tab
            const todoTab = document.querySelector('[data-tab="todo-list"]');
            if (todoTab) {
                todoTab.click();
            }
        });
    }
    
    // Add Single Item button
    const addSingleItemBtn = document.getElementById('addSingleItem');
    if (addSingleItemBtn) {
        addSingleItemBtn.addEventListener('click', () => {
            addTodoItem('singleItems');
        });
    }
    
    // Add Recurring Item button
    const addRecurringItemBtn = document.getElementById('addRecurringItem');
    if (addRecurringItemBtn) {
        addRecurringItemBtn.addEventListener('click', () => {
            addTodoItem('recurringItems');
        });
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
  