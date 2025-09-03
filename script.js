// LifeTiles PWA JavaScript

// Calendar state
let currentDate = new Date();
let selectedDate = null;

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Add touch event debugging
    console.log('Device Info:', {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        maxTouchPoints: navigator.maxTouchPoints,
        isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent)
    });
    
    // Add touch event listeners for iOS compatibility
    addTouchEventSupport();
    
    initializeApp();
});

// Add Touch Event Support for iOS
function addTouchEventSupport() {
    // Check if we're on iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    if (isIOS) {
        console.log('iOS device detected, adding touch event support');
        
        // Add touchstart events to all interactive elements
        const interactiveElements = document.querySelectorAll('button, .nav-tab, .calendar-day, .todo-item, .books-films-item');
        
        interactiveElements.forEach(element => {
            element.addEventListener('touchstart', function(e) {
                console.log('Touch event on:', element.tagName, element.className);
                // Prevent double-firing on iOS
                e.preventDefault();
                
                // Simulate click after a short delay
                setTimeout(() => {
                    element.click();
                }, 50);
            }, { passive: false });
        });
    }
}

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
    
    // Initialize books and films lists
    initializeBooksFilmsLists();
    
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
                books: [],
                films: []
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
    
    // Render items in their original order (no sorting)
    items.forEach((item, index) => {
        const itemElement = createTodoItemElement(item, listType, index);
        container.appendChild(itemElement);
    });
}

// Create Todo Item Element
function createTodoItemElement(item, listType, index) {
    const itemElement = document.createElement('div');
    itemElement.className = 'todo-item';
    if (item.completed) {
        itemElement.classList.add('completed');
    }
    itemElement.dataset.index = index;
    
    itemElement.innerHTML = `
        <div class="todo-item-checkbox">
            <input type="checkbox" ${item.completed ? 'checked' : ''} id="checkbox-${listType}-${index}">
            <label for="checkbox-${listType}-${index}"></label>
        </div>
        <div class="todo-item-name">${item.name}</div>
        <div class="todo-item-actions">
            <button class="action-btn edit" title="Edit">✏️</button>
            <button class="action-btn delete" title="Delete">🗑️</button>
        </div>
    `;
    
    // Add checkbox change event
    const checkbox = itemElement.querySelector('input[type="checkbox"]');
    checkbox.addEventListener('change', (e) => {
        e.stopPropagation();
        toggleTodoCompletion(listType, index, checkbox.checked);
    });
    
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
    
    let itemType = '';
    if (listType === 'singleItems' || listType === 'recurringItems') {
        itemType = listType === 'singleItems' ? 'single' : 'recurring';
    } else if (listType === 'books' || listType === 'films') {
        itemType = listType === 'books' ? 'book' : 'film';
    }
    
    // For To-Do items, show enhanced detail view
    if (listType === 'singleItems' || listType === 'recurringItems') {
        modal.innerHTML = `
            <h3>To-Do Item Details</h3>
            <div class="item-detail-content">
                <div class="detail-section">
                    <label for="detailItemName">Item Name:</label>
                    <input type="text" id="detailItemName" value="${item.name}" class="detail-input">
                </div>
                
                <div class="detail-section">
                    <label class="detail-label">Completion Status:</label>
                    <div class="checkbox-wrapper">
                        <input type="checkbox" id="detailCompleted" ${item.completed ? 'checked' : ''}>
                        <label for="detailCompleted">Mark as completed</label>
                    </div>
                </div>
                
                <div class="detail-section">
                    <label class="detail-label">Item Type:</label>
                    <div class="type-toggle">
                        <button class="type-btn ${listType === 'singleItems' ? 'active' : ''}" data-type="singleItems">Single</button>
                        <button class="type-btn ${listType === 'recurringItems' ? 'active' : ''}" data-type="recurringItems">Recurring</button>
                    </div>
                </div>
                
                ${listType === 'recurringItems' ? `
                <div class="detail-section recurring-options">
                    <label class="detail-label">Recurring Options:</label>
                    <div class="recurring-frequency">
                        <label>
                            <input type="radio" name="frequency" value="weekly" ${item.recurring?.frequency === 'weekly' ? 'checked' : ''}>
                            Weekly
                        </label>
                        <label>
                            <input type="radio" name="frequency" value="biweekly" ${item.recurring?.frequency === 'biweekly' ? 'checked' : ''}>
                            Bi-weekly
                        </label>
                        <label>
                            <input type="radio" name="frequency" value="monthly" ${item.recurring?.frequency === 'monthly' ? 'checked' : ''}>
                            Monthly
                        </label>
                    </div>
                    
                    <div class="weekday-selection" ${item.recurring?.frequency === 'weekly' || item.recurring?.frequency === 'biweekly' ? '' : 'style="display: none;"'}>
                        <label class="detail-label">Weekdays:</label>
                        <div class="weekday-checkboxes">
                            <label><input type="checkbox" value="0" ${item.recurring?.weekdays?.includes(0) ? 'checked' : ''}> Sun</label>
                            <label><input type="checkbox" value="1" ${item.recurring?.weekdays?.includes(1) ? 'checked' : ''}> Mon</label>
                            <label><input type="checkbox" value="2" ${item.recurring?.weekdays?.includes(2) ? 'checked' : ''}> Tue</label>
                            <label><input type="checkbox" value="3" ${item.recurring?.weekdays?.includes(3) ? 'checked' : ''}> Wed</label>
                            <label><input type="checkbox" value="4" ${item.recurring?.weekdays?.includes(4) ? 'checked' : ''}> Thu</label>
                            <label><input type="checkbox" value="5" ${item.recurring?.weekdays?.includes(5) ? 'checked' : ''}> Fri</label>
                            <label><input type="checkbox" value="6" ${item.recurring?.weekdays?.includes(6) ? 'checked' : ''}> Sat</label>
                        </div>
                    </div>
                    
                    <div class="monthly-dates" ${item.recurring?.frequency === 'monthly' ? '' : 'style="display: none;"'}>
                        <label class="detail-label">Monthly Dates:</label>
                        <input type="text" id="monthlyDates" value="${item.recurring?.monthlyDates?.join(', ') || '1, 15'}" placeholder="1, 15, 28" class="detail-input">
                        <small>Enter dates separated by commas (1-31)</small>
                    </div>
                    
                    <div class="archive-control">
                        <label class="detail-label">Archive Control:</label>
                        <div class="checkbox-wrapper">
                            <input type="checkbox" id="detailArchived" ${item.recurring?.archived ? 'checked' : ''}>
                            <label for="detailArchived">Archive recurring item (stop future instances)</label>
                        </div>
                        ${item.recurring?.archived && item.recurring?.archivedOn ? `
                        <small>Archived on ${new Date(item.recurring.archivedOn).toLocaleDateString()}</small>
                        ` : ''}
                    </div>
                </div>
                ` : ''}
                
                <div class="detail-section">
                    <label class="detail-label">Created:</label>
                    <span>${new Date(item.created).toLocaleDateString()}</span>
                </div>
                
                <div class="detail-section">
                    <label class="detail-label">Last Updated:</label>
                    <span>${new Date(item.updated).toLocaleDateString()}</span>
                </div>
            </div>
            <div class="item-detail-actions">
                <button class="btn btn-secondary" id="cancelDetail">Cancel</button>
                <button class="btn btn-primary" id="saveDetail">Save Changes</button>
            </div>
        `;
        
        // Add event listeners for the enhanced detail view
        setupDetailEventListeners(modal, item, listType);
        
    } else {
        // For Books & Films, show enhanced detail view
        modal.innerHTML = `
            <h3>${listType === 'books' ? 'Book' : 'Film'} Details</h3>
            <div class="item-detail-content">
                <div class="detail-section">
                    <label for="detailItemName">Item Name:</label>
                    <input type="text" id="detailItemName" value="${item.name}" class="detail-input">
                </div>
                
                <div class="detail-section">
                    <label for="detailNotes">Notes:</label>
                    <textarea id="detailNotes" class="detail-textarea" placeholder="Add your notes here...">${item.notes || ''}</textarea>
                </div>
                
                <div class="detail-section">
                    <label class="detail-label">Completion Status:</label>
                    <div class="checkbox-wrapper">
                        <input type="checkbox" id="detailCompleted" ${item.completed ? 'checked' : ''}>
                        <label for="detailCompleted">Mark as completed</label>
                    </div>
                </div>
                
                <div class="detail-section">
                    <label class="detail-label">Created:</label>
                    <span>${new Date(item.created).toLocaleDateString()}</span>
                </div>
                
                <div class="detail-section">
                    <label class="detail-label">Last Updated:</label>
                    <span>${new Date(item.updated).toLocaleDateString()}</span>
                </div>
            </div>
            <div class="item-detail-actions">
                <button class="btn btn-secondary" id="cancelDetail">Cancel</button>
                <button class="btn btn-primary" id="saveDetail">Save Changes</button>
            </div>
        `;
        
        // Add event listeners for the enhanced detail view
        setupBooksFilmsDetailEventListeners(modal, item, listType);
    }
    
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
            <div class="form-group">
                <label class="checkbox-wrapper">
                    <input type="checkbox" id="editCompleted" ${item.completed ? 'checked' : ''}>
                    <span>Mark as completed</span>
                </label>
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
        const completed = modal.querySelector('#editCompleted').checked;
        if (newName) {
            updateTodoItem(listType, index, newName, completed);
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
function updateTodoItem(listType, index, newName, completed) {
    const savedData = loadFromStorage('lifetiles_todo_list') || {};
    if (savedData[listType] && savedData[listType][index]) {
        savedData[listType][index].name = newName;
        savedData[listType][index].completed = completed;
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
        completed: false,
        type: listType,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        recurring: listType === 'recurringItems' ? {
            frequency: 'weekly',
            weekdays: [1], // Monday
            biweekly: false,
            monthlyDates: [1, 15],
            anchorDate: new Date().toISOString(), // Add anchor date for biweekly calculations
            perDateCompletions: {}, // Track completions by date (YYYY-MM-DD)
            archived: false, // Archive flag to suppress future instances
            archivedOn: null // Date when item was archived (ISO string)
        } : null
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
    
    // Compute initial statuses
    recomputeCalendarStatuses();
    
    // Schedule midnight recomputation
    scheduleMidnightRecompute();
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
    
    // Get challenge days for current month
    const challengeDays = updateCalendarChallengeDays();
    
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
        dayElement.setAttribute('role', 'gridcell');
        dayElement.setAttribute('tabindex', '0');
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
        
        // Check if it's a challenge day
        const dateKey = date.toISOString().split('T')[0];
        if (challengeDays.includes(dateKey)) {
            dayElement.classList.add('has-challenge');
        }
        
        // Check if it has a computed status (automatic)
        const statusCache = loadFromStorage('lifetiles_daily_status_by_date') || {};
        const computedStatus = statusCache[dateKey];
        
        if (computedStatus && computedStatus !== 'no-challenge') {
            dayElement.classList.add(`status-${computedStatus}`);
        }
        
        // Create accessible label
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        const monthName = monthNames[date.getMonth()];
        const dayOfMonth = date.getDate();
        const year = date.getFullYear();
        
        let ariaLabel = `${monthName} ${dayOfMonth}, ${year}`;
        if (challengeDays.includes(dateKey)) {
            ariaLabel += ' — Challenge day';
            if (computedStatus && computedStatus !== 'no-challenge') {
                ariaLabel += ` — Status: ${computedStatus.charAt(0).toUpperCase() + computedStatus.slice(1)}`;
            }
        } else {
            ariaLabel += ' — No Challenge';
        }
        
        dayElement.setAttribute('aria-label', ariaLabel);
        
        // Add click event for status display (no longer for manual picker)
        dayElement.addEventListener('click', () => showDateStatus(date, computedStatus));
        
        // Add keyboard support
        dayElement.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                showDateStatus(date, computedStatus);
            }
        });
        
        calendarDaysElement.appendChild(dayElement);
    }
    
    // Save current month/year to localStorage
    const currentData = loadFromStorage('lifetiles_daily_challenge') || {};
    currentData.currentMonth = currentDate.getMonth();
    currentData.currentYear = currentDate.getFullYear();
    saveToStorage('lifetiles_daily_challenge', currentData);
}

// Show Date Status
function showDateStatus(date, status) {
    const dateString = date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.addEventListener('click', closeStatusDisplay);
    
    // Create status display
    const display = document.createElement('div');
    display.className = 'status-display';
    
    let statusText = '';
    let statusIcon = '';
    let statusDescription = '';
    
    switch (status) {
        case 'success':
            statusText = 'Success';
            statusIcon = '✅';
            statusDescription = 'All required items completed on time!';
            break;
        case 'rescued':
            statusText = 'Rescued';
            statusIcon = '🆘';
            statusDescription = 'All items completed within 3 days.';
            break;
        case 'failed':
            statusText = 'Failed';
            statusIcon = '❌';
            statusDescription = 'Some items were not completed on time.';
            break;
        case 'pending':
            statusText = 'Pending';
            statusIcon = '⏳';
            statusDescription = 'Still within the 3-day completion window.';
            break;
        case 'no-challenge':
        default:
            statusText = 'No Challenge';
            statusIcon = '⚪';
            statusDescription = 'No recurring items scheduled for this date.';
            break;
    }
    
    display.innerHTML = `
        <h3>${dateString}</h3>
        <div class="status-info">
            <div class="status-icon">${statusIcon}</div>
            <div class="status-title">${statusText}</div>
            <div class="status-description">${statusDescription}</div>
        </div>
        <div class="status-actions">
            <button class="btn btn-secondary" id="closeStatus">Close</button>
        </div>
    `;
    
    // Add close event
    const closeBtn = display.querySelector('#closeStatus');
    closeBtn.addEventListener('click', closeStatusDisplay);
    
    // Add to DOM
    document.body.appendChild(overlay);
    document.body.appendChild(display);
}

// Close Status Display
function closeStatusDisplay() {
    const overlay = document.querySelector('.modal-overlay');
    const display = document.querySelector('.status-display');
    
    if (overlay) overlay.remove();
    if (display) display.remove();
}

// Initialize Books and Films Lists
function initializeBooksFilmsLists() {
    renderBooksFilmsList('books', 'booksList');
    renderBooksFilmsList('films', 'filmsList');
}

// Render Books and Films List
function renderBooksFilmsList(listType, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const savedData = loadFromStorage('lifetiles_books_films');
    const items = savedData?.[listType] || [];

    // Clear container
    container.innerHTML = '';

    if (items.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>No ${listType === 'books' ? 'books' : 'films'} yet</p>
            </div>
        `;
        return;
    }

    // Render items in their original order (no sorting)
    items.forEach((item, index) => {
        const itemElement = createBooksFilmsItemElement(item, listType, index);
        container.appendChild(itemElement);
    });
}

// Create Books and Films Item Element
function createBooksFilmsItemElement(item, listType, index) {
    const itemElement = document.createElement('div');
    itemElement.className = 'books-films-item';
    if (item.completed) {
        itemElement.classList.add('completed');
    }
    itemElement.dataset.index = index;
    
    itemElement.innerHTML = `
        <div class="books-films-item-checkbox">
            <input type="checkbox" ${item.completed ? 'checked' : ''} id="checkbox-${listType}-${index}">
            <label for="checkbox-${listType}-${index}"></label>
        </div>
        <div class="books-films-item-name">${item.name}</div>
        <div class="books-films-item-actions">
            <button class="action-btn edit" title="Edit">✏️</button>
            <button class="action-btn delete" title="Delete">🗑️</button>
        </div>
    `;
    
    // Add checkbox change event
    const checkbox = itemElement.querySelector('input[type="checkbox"]');
    checkbox.addEventListener('change', (e) => {
        e.stopPropagation();
        toggleBooksFilmsCompletion(listType, index, checkbox.checked);
    });
    
    // Add click event for item details
    itemElement.querySelector('.books-films-item-name').addEventListener('click', () => {
        showItemDetail(item, listType);
    });
    
    // Add edit event
    itemElement.querySelector('.action-btn.edit').addEventListener('click', (e) => {
        e.stopPropagation();
        editBooksFilmsItem(item, listType, index);
    });
    
    // Add delete event
    itemElement.querySelector('.action-btn.delete').addEventListener('click', (e) => {
        e.stopPropagation();
        deleteBooksFilmsItem(listType, index);
    });
    
    return itemElement;
}

// Edit Books and Films Item
function editBooksFilmsItem(item, listType, index) {
    const modal = document.createElement('div');
    modal.className = 'add-item-modal';
    
    modal.innerHTML = `
        <h3>Edit ${listType === 'books' ? 'Book' : 'Film'}</h3>
        <form class="add-item-form" id="editForm">
            <div class="form-group">
                <label for="editItemName">Item Name</label>
                <input type="text" id="editItemName" value="${item.name}" required>
            </div>
            <div class="form-group">
                <label for="editNotes">Notes</label>
                <textarea id="editNotes" placeholder="Add your notes here...">${item.notes || ''}</textarea>
            </div>
            <div class="form-group">
                <label class="checkbox-wrapper">
                    <input type="checkbox" id="editCompleted" ${item.completed ? 'checked' : ''}>
                    <span>Mark as completed</span>
                </label>
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
        const notes = modal.querySelector('#editNotes').value.trim();
        const completed = modal.querySelector('#editCompleted').checked;
        if (newName) {
            updateBooksFilmsItem(listType, index, newName, notes, completed);
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

// Update Books and Films Item
function updateBooksFilmsItem(listType, index, newName, notes, completed) {
    const savedData = loadFromStorage('lifetiles_books_films') || {};
    if (savedData[listType] && savedData[listType][index]) {
        savedData[listType][index].name = newName;
        savedData[listType][index].notes = notes;
        savedData[listType][index].completed = completed;
        savedData[listType][index].updated = new Date().toISOString();
        
        // Save to localStorage
        saveToStorage('lifetiles_books_films', savedData);
        
        // Re-render the list
        renderBooksFilmsList(listType, listType === 'books' ? 'booksList' : 'filmsList');
    }
}

// Delete Books and Films Item
function deleteBooksFilmsItem(listType, index) {
    if (confirm('Are you sure you want to delete this item?')) {
        const savedData = loadFromStorage('lifetiles_books_films') || {};
        if (savedData[listType] && savedData[listType][index]) {
            savedData[listType].splice(index, 1);
            saveToStorage('lifetiles_books_films', savedData);
            
            // Re-render the list
            renderBooksFilmsList(listType, listType === 'books' ? 'booksList' : 'filmsList');
        }
    }
}

// Add Books and Films Item
function addBooksFilmsItem(listType) {
    const modal = document.createElement('div');
    modal.className = 'add-item-modal';
    
    modal.innerHTML = `
        <h3>Add ${listType === 'books' ? 'Book' : 'Film'}</h3>
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
            createBooksFilmsItem(listType, itemName);
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

// Create Books and Films Item
function createBooksFilmsItem(listType, name) {
    const savedData = loadFromStorage('lifetiles_books_films') || {};
    
    if (!savedData[listType]) {
        savedData[listType] = [];
    }
    
    const newItem = {
        name: name,
        completed: false,
        notes: '',
        created: new Date().toISOString(),
        updated: new Date().toISOString()
    };
    
    savedData[listType].push(newItem);
    saveToStorage('lifetiles_books_films', savedData);
    
    // Re-render the list
    renderBooksFilmsList(listType, listType === 'books' ? 'booksList' : 'filmsList');
}

// Toggle Todo Completion
function toggleTodoCompletion(listType, index, completed) {
    const savedData = loadFromStorage('lifetiles_todo_list') || {};
    if (savedData[listType] && savedData[listType][index]) {
        const item = savedData[listType][index];
        item.completed = completed;
        item.updated = new Date().toISOString();
        
        // If this is a recurring item, update per-date completion
        if (listType === 'recurringItems' && item.recurring) {
            const today = new Date();
            updateItemCompletionForDate(item, today, completed);
        }
        
        saveToStorage('lifetiles_todo_list', savedData);
        
        // Re-render the list
        renderTodoList(listType, listType === 'singleItems' ? 'singleItemsList' : 'recurringItemsList');
        
        // Recompute calendar statuses if this affects recurring items
        if (listType === 'recurringItems') {
            recomputeCalendarStatuses();
        }
    }
}

// Toggle Books and Films Completion
function toggleBooksFilmsCompletion(listType, index, completed) {
    const savedData = loadFromStorage('lifetiles_books_films') || {};
    if (savedData[listType] && savedData[listType][index]) {
        savedData[listType][index].completed = completed;
        savedData[listType][index].updated = new Date().toISOString();
        saveToStorage('lifetiles_books_films', savedData);
        
        // Re-render the list
        renderBooksFilmsList(listType, listType === 'books' ? 'booksList' : 'filmsList');
    }
}

// Toggle Archive Status
function toggleArchiveStatus(item, listType, index) {
    const savedData = loadFromStorage('lifetiles_todo_list') || {};
    if (savedData[listType] && savedData[listType][index]) {
        const currentItem = savedData[listType][index];
        
        if (currentItem.recurring) {
            currentItem.recurring.archived = !currentItem.recurring.archived;
            currentItem.recurring.archivedOn = currentItem.recurring.archived ? new Date().toISOString() : null;
            currentItem.updated = new Date().toISOString();
            
            saveToStorage('lifetiles_todo_list', savedData);
            
            // Re-render the list
            renderTodoList(listType, listType === 'singleItems' ? 'singleItemsList' : 'recurringItemsList');
            
            // Recompute calendar statuses since archive status affects challenge days
            recomputeCalendarStatuses();
        }
    }
}

// Setup Event Listeners
function setupEventListeners() {
    // Previous month button
    const prevMonthBtn = document.getElementById('prevMonth');
    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            recomputeCalendarStatuses();
        });
    }
    
    // Next month button
    const nextMonthBtn = document.getElementById('nextMonth');
    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            recomputeCalendarStatuses();
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
                
                // Scroll to recurring section after a short delay to ensure tab is active
                setTimeout(() => {
                    const recurringSection = document.querySelector('.todo-section:last-child');
                    if (recurringSection) {
                        recurringSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }, 100);
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

    // Add Books button
    const addBookBtn = document.getElementById('addBook');
    if (addBookBtn) {
        addBookBtn.addEventListener('click', () => {
            addBooksFilmsItem('books');
        });
    }
    
    // Add Films button
    const addFilmBtn = document.getElementById('addFilm');
    if (addFilmBtn) {
        addFilmBtn.addEventListener('click', () => {
            addBooksFilmsItem('films');
        });
    }
}

// Tab Navigation Setup
function setupTabNavigation() {
    const navTabs = document.querySelectorAll('.nav-tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    navTabs.forEach((tab, index) => {
        tab.addEventListener('click', function() {
            activateTab(this);
        });
        
        // Add keyboard navigation
        tab.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                activateTab(tab);
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                const prevTab = navTabs[(index - 1 + navTabs.length) % navTabs.length];
                prevTab.focus();
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                const nextTab = navTabs[(index + 1) % navTabs.length];
                nextTab.focus();
            }
        });
    });
}

// Activate Tab Helper Function
function activateTab(selectedTab) {
    const targetTab = selectedTab.getAttribute('data-tab');
    const navTabs = document.querySelectorAll('.nav-tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Update active states
    navTabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
    });
    tabContents.forEach(content => content.classList.remove('active'));
    
    selectedTab.classList.add('active');
    selectedTab.setAttribute('aria-selected', 'true');
    document.getElementById(targetTab).classList.add('active');
    
    // Save current tab to local storage
    localStorage.setItem('lifetiles_current_tab', targetTab);
    
    // Log tab change for debugging
    console.log(`Switched to tab: ${targetTab}`);
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

// Challenge Day Computation Functions
function isChallengeDate(date, recurringItems, tz = 'GMT+8') {
    console.log('🔥 isChallengeDate - NEW VERSION LOADED');
    
    if (!recurringItems || recurringItems.length === 0) {
        console.log('isChallengeDate - no recurring items');
        return false;
    }
    
    // Convert date to GMT+8 for consistent evaluation
    const gmt8Date = new Date(date.getTime() + (8 * 60 * 60 * 1000));
    const dayOfWeek = gmt8Date.getDay();
    const dayOfMonth = gmt8Date.getDate();
    
    const result = recurringItems.some(item => {
        if (!item.recurring) {
            console.log('isChallengeDate - item has no recurring data:', item.name);
            return false;
        }
        
        console.log('isChallengeDate - checking item:', {
            name: item.name,
            frequency: item.recurring.frequency,
            weekdays: item.recurring.weekdays,
            monthlyDates: item.recurring.monthlyDates,
            archived: item.recurring.archived,
            dayOfWeek: dayOfWeek,
            dayOfMonth: dayOfMonth,
            date: date.toISOString().split('T')[0]
        });
        
        // Check if item is archived and if the date is after archive date
        if (item.recurring.archived && item.recurring.archivedOn) {
            const archiveDate = new Date(item.recurring.archivedOn);
            const archiveGmt8 = new Date(archiveDate.getTime() + (8 * 60 * 60 * 1000));
            const archiveDayBoundary = new Date(archiveGmt8);
            archiveDayBoundary.setHours(0, 0, 0, 0);
            
            // If this date is on or after the archive date, exclude it
            if (gmt8Date >= archiveDayBoundary) {
                return false;
            }
        }
        
        const { frequency, weekdays, monthlyDates } = item.recurring;
        
        switch (frequency) {
            case 'weekly':
                const weeklyResult = weekdays && weekdays.includes(dayOfWeek);
                console.log('isChallengeDate - weekly check:', { weekdays, dayOfWeek, result: weeklyResult });
                return weeklyResult;
                
            case 'biweekly':
                if (!weekdays || weekdays.length === 0) {
                    console.log('isChallengeDate - biweekly: no weekdays');
                    return false;
                }
                if (!item.recurring.anchorDate) {
                    console.log('isChallengeDate - biweekly: no anchorDate');
                    return false;
                }
                
                // Calculate weeks difference from anchor date
                const anchorDate = new Date(item.recurring.anchorDate);
                const anchorGmt8 = new Date(anchorDate.getTime() + (8 * 60 * 60 * 1000));
                const weeksDiff = Math.floor((gmt8Date - anchorGmt8) / (7 * 24 * 60 * 60 * 1000));
                const biweeklyResult = weeksDiff % 2 === 0 && weekdays.includes(dayOfWeek);
                console.log('isChallengeDate - biweekly check:', { weekdays, dayOfWeek, weeksDiff, result: biweeklyResult });
                
                return biweeklyResult;
                
            case 'monthly':
                const monthlyResult = monthlyDates && monthlyDates.includes(dayOfMonth);
                console.log('isChallengeDate - monthly check:', { monthlyDates, dayOfMonth, result: monthlyResult });
                return monthlyResult;
                
            default:
                console.log('isChallengeDate - unknown frequency:', frequency);
                return false;
        }
    });
    
    return result;
}

function getChallengeDaysForMonth(year, month, recurringItems) {
    console.log('getChallengeDaysForMonth - FUNCTION CALLED with:', { year, month, recurringItemsLength: recurringItems?.length });
    
    const challengeDays = [];
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Add buffer months for biweekly calculations
    const bufferStart = new Date(year, month - 1, 1);
    const bufferEnd = new Date(year, month + 1, 0);
    
    console.log('getChallengeDaysForMonth - bufferStart:', bufferStart.toISOString().split('T')[0]);
    console.log('getChallengeDaysForMonth - bufferEnd:', bufferEnd.toISOString().split('T')[0]);
    console.log('getChallengeDaysForMonth - STARTING LOOP');
    
    for (let date = new Date(bufferStart); date <= bufferEnd; date.setDate(date.getDate() + 1)) {
        const currentDateInLoop = new Date(date); // Create a new Date object for each iteration
        const dateKeyInLoop = currentDateInLoop.toISOString().split('T')[0];

        const isChallenge = isChallengeDate(currentDateInLoop, recurringItems);

        if (isChallenge) {
            console.log('getChallengeDaysForMonth - PUSHING dateKey:', dateKeyInLoop);
            challengeDays.push(dateKeyInLoop);
        }
    }
    
    console.log('getChallengeDaysForMonth - LOOP COMPLETED, challengeDays:', challengeDays);
    return challengeDays;
}

function updateCalendarChallengeDays() {
    console.log('updateCalendarChallengeDays - FUNCTION CALLED');
    
    const savedData = loadFromStorage('lifetiles_todo_list');
    const recurringItems = savedData?.recurringItems || [];
    
    console.log('updateCalendarChallengeDays - currentDate:', currentDate.toISOString().split('T')[0]);
    console.log('updateCalendarChallengeDays - recurringItems:', recurringItems);
    
    // Debug each recurring item
    recurringItems.forEach((item, index) => {
        console.log(`Recurring item ${index}:`, {
            name: item.name,
            recurring: item.recurring,
            hasRecurring: !!item.recurring,
            frequency: item.recurring?.frequency,
            weekdays: item.recurring?.weekdays,
            monthlyDates: item.recurring?.monthlyDates,
            archived: item.recurring?.archived
        });
    });
    
    console.log('updateCalendarChallengeDays - CALLING getChallengeDaysForMonth with:', {
        year: currentDate.getFullYear(),
        month: currentDate.getMonth(),
        recurringItemsLength: recurringItems.length
    });
    
    // Get challenge days for current month (with buffer)
    const challengeDays = getChallengeDaysForMonth(
        currentDate.getFullYear(), 
        currentDate.getMonth(), 
        recurringItems
    );
    
    console.log('updateCalendarChallengeDays - RETURNED challengeDays:', challengeDays);
    
    // Save to localStorage for performance
    const calendarCache = loadFromStorage('lifetiles_calendar_hasChallenge_cache') || {};
    calendarCache[`${currentDate.getFullYear()}-${currentDate.getMonth()}`] = challengeDays;
    saveToStorage('lifetiles_calendar_hasChallenge_cache', calendarCache);
    
    return challengeDays;
}
  
// Setup Detail Event Listeners
function setupDetailEventListeners(modal, item, listType) {
    // Save button
    const saveBtn = modal.querySelector('#saveDetail');
    saveBtn.addEventListener('click', () => {
        saveDetailChanges(modal, item, listType);
    });
    
    // Cancel button
    const cancelBtn = modal.querySelector('#cancelDetail');
    cancelBtn.addEventListener('click', () => {
        closeModal(modal);
    });
    
    // Type toggle buttons
    const typeBtns = modal.querySelectorAll('.type-btn');
    typeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            typeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
    
    // Frequency radio buttons
    const frequencyRadios = modal.querySelectorAll('input[name="frequency"]');
    frequencyRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            updateRecurringOptions(modal, radio.value);
        });
    });
    
    // Set initial recurring options display based on current frequency
    const checkedFrequency = modal.querySelector('input[name="frequency"]:checked');
    if (checkedFrequency) {
        updateRecurringOptions(modal, checkedFrequency.value);
    }
    
    // Completion checkbox
    const completedCheckbox = modal.querySelector('#detailCompleted');
    completedCheckbox.addEventListener('change', () => {
        // Update the item's completion status immediately for visual feedback
        item.completed = completedCheckbox.checked;
    });

    // Archive checkbox
    const archivedCheckbox = modal.querySelector('#detailArchived');
    archivedCheckbox.addEventListener('change', () => {
        item.recurring.archived = archivedCheckbox.checked;
        item.recurring.archivedOn = archivedCheckbox.checked ? new Date().toISOString() : null;
        item.updated = new Date().toISOString();
    });
}

// Update Recurring Options Display
function updateRecurringOptions(modal, frequency) {
    const weekdaySelection = modal.querySelector('.weekday-selection');
    const monthlyDates = modal.querySelector('.monthly-dates');
    const archiveControl = modal.querySelector('.archive-control');
    
    if (frequency === 'weekly' || frequency === 'biweekly') {
        weekdaySelection.style.display = 'block';
        monthlyDates.style.display = 'none';
        archiveControl.style.display = 'block';
    } else if (frequency === 'monthly') {
        weekdaySelection.style.display = 'none';
        monthlyDates.style.display = 'block';
        archiveControl.style.display = 'block';
    } else {
        weekdaySelection.style.display = 'none';
        monthlyDates.style.display = 'none';
        archiveControl.style.display = 'none';
    }
}

// Save Detail Changes
function saveDetailChanges(modal, item, listType) {
    const newName = modal.querySelector('#detailItemName').value.trim();
    const completed = modal.querySelector('#detailCompleted').checked;
    const archivedElement = modal.querySelector('#detailArchived');
    const archived = archivedElement ? archivedElement.checked : false;
    const newType = modal.querySelector('.type-btn.active').dataset.type;
    
    if (!newName) {
        alert('Item name cannot be empty');
        return;
    }
    
    // Get recurring options if applicable
    let recurringOptions = null;
    if (newType === 'recurringItems') {
        const frequencyElement = modal.querySelector('input[name="frequency"]:checked');
        if (!frequencyElement) {
            alert('Please select a frequency for recurring items');
            return;
        }
        
        const frequency = frequencyElement.value;
        const weekdays = [];
        const monthlyDates = [];
        
        if (frequency === 'weekly' || frequency === 'biweekly') {
            modal.querySelectorAll('.weekday-checkboxes input:checked').forEach(checkbox => {
                weekdays.push(parseInt(checkbox.value));
            });
            if (weekdays.length === 0) {
                alert('Please select at least one weekday for weekly/biweekly recurrence');
                return;
            }
        } else if (frequency === 'monthly') {
            const datesInput = modal.querySelector('#monthlyDates').value.trim();
            if (datesInput) {
                const dates = datesInput.split(',').map(d => parseInt(d.trim())).filter(d => d >= 1 && d <= 31);
                if (dates.length === 0) {
                    alert('Please enter valid monthly dates (1-31)');
                    return;
                }
                monthlyDates.push(...dates);
            } else {
                // Use default monthly dates if none provided
                monthlyDates.push(1, 15);
            }
        }
        
        recurringOptions = {
            frequency: frequency,
            weekdays: weekdays,
            biweekly: frequency === 'biweekly',
            monthlyDates: monthlyDates,
            anchorDate: frequency === 'biweekly' ? (item.recurring?.anchorDate || new Date().toISOString()) : null,
            archived: archived,
            archivedOn: archived ? (item.recurring?.archivedOn || new Date().toISOString()) : null,
            perDateCompletions: item.recurring?.perDateCompletions || {}
        };
    }
    
    // Update the item
    const savedData = loadFromStorage('lifetiles_todo_list') || {};
    const currentIndex = savedData[listType].findIndex(i => i.name === item.name && i.created === item.created);
    
    if (currentIndex !== -1) {
        // Remove from current list
        savedData[listType].splice(currentIndex, 1);
        
        // Create updated item
        const updatedItem = {
            ...item,
            name: newName,
            completed: completed,
            type: newType,
            updated: new Date().toISOString(),
            recurring: recurringOptions
        };
        
        // Add to new list
        if (!savedData[newType]) {
            savedData[newType] = [];
        }
        savedData[newType].push(updatedItem);
        
        // Save to localStorage
        saveToStorage('lifetiles_todo_list', savedData);
        
        // Re-render both lists
        renderTodoList('singleItems', 'singleItemsList');
        renderTodoList('recurringItems', 'recurringItemsList');
        
        // Recompute calendar statuses since recurring rules may have changed
        recomputeCalendarStatuses();
        
        // Close modal
        closeModal(modal);
    }
}
  
// Setup Books & Films Detail Event Listeners
function setupBooksFilmsDetailEventListeners(modal, item, listType) {
    // Save button
    const saveBtn = modal.querySelector('#saveDetail');
    saveBtn.addEventListener('click', () => {
        saveBooksFilmsDetailChanges(modal, item, listType);
    });
    
    // Cancel button
    const cancelBtn = modal.querySelector('#cancelDetail');
    cancelBtn.addEventListener('click', () => {
        closeModal(modal);
    });
    
    // Completion checkbox
    const completedCheckbox = modal.querySelector('#detailCompleted');
    completedCheckbox.addEventListener('change', () => {
        // Update the item's completion status immediately for visual feedback
        item.completed = completedCheckbox.checked;
    });
}

// Save Books & Films Detail Changes
function saveBooksFilmsDetailChanges(modal, item, listType) {
    const newName = modal.querySelector('#detailItemName').value.trim();
    const notes = modal.querySelector('#detailNotes').value.trim();
    const completed = modal.querySelector('#detailCompleted').checked;
    
    if (!newName) {
        alert('Item name cannot be empty');
        return;
    }
    
    // Update the item
    const savedData = loadFromStorage('lifetiles_books_films') || {};
    const currentIndex = savedData[listType].findIndex(i => i.name === item.name && i.created === item.created);
    
    if (currentIndex !== -1) {
        savedData[listType][currentIndex].name = newName;
        savedData[listType][currentIndex].notes = notes;
        savedData[listType][currentIndex].completed = completed;
        savedData[listType][currentIndex].updated = new Date().toISOString();
        
        // Save to localStorage
        saveToStorage('lifetiles_books_films', savedData);
        
        // Re-render the list
        renderBooksFilmsList(listType, listType === 'books' ? 'booksList' : 'filmsList');
        
        // Close modal
        closeModal(modal);
    }
}

// First Success Detection Function
function findFirstSuccessDate(recurringItems) {
    if (!recurringItems || recurringItems.length === 0) {
        return null;
    }
    
    // Get all challenge dates from the beginning of time to today
    const today = new Date();
    const startDate = new Date(2020, 0, 1); // Start from 2020 as a reasonable starting point
    
    for (let date = new Date(startDate); date <= today; date.setDate(date.getDate() + 1)) {
        if (isChallengeDate(date, recurringItems)) {
            // Check if this date has a success status
            const status = computeDateStatus(date, recurringItems);
            if (status === 'success') {
                return date;
            }
        }
    }
    
    return null; // No success found
}

// Automatic Status Computation Functions
function computeDateStatus(date, recurringItems) {
    const dateKey = date.toISOString().split('T')[0];
    const today = new Date();
    const todayKey = today.toISOString().split('T')[0];
    
    // Future dates always show No Challenge
    if (dateKey > todayKey) {
        return 'no-challenge';
    }
    
    // Check if this is a challenge day
    if (!isChallengeDate(date, recurringItems)) {
        return 'no-challenge';
    }
    
    // Get required items for this date
    const requiredItems = getRequiredItemsForDate(date, recurringItems);
    if (requiredItems.length === 0) {
        return 'no-challenge';
    }
    
    // Check if we're before the first success date
    const firstSuccessDate = findFirstSuccessDate(recurringItems);
    if (firstSuccessDate) {
        const gmt8Date = new Date(date.getTime() + (8 * 60 * 60 * 1000));
        const gmt8FirstSuccess = new Date(firstSuccessDate.getTime() + (8 * 60 * 60 * 1000));
        
        // If this date is before the first success date, force No Challenge
        if (gmt8Date < gmt8FirstSuccess) {
            return 'no-challenge';
        }
    }
    
    // Check completion status
    const completedItems = requiredItems.filter(item => {
        const completionKey = `${dateKey}_${item.created}`;
        return item.recurring?.perDateCompletions?.[completionKey]?.completed;
    });
    
    const allCompleted = completedItems.length === requiredItems.length;
    
    if (allCompleted) {
        // Check if completed on the same day
        const completedOnDate = completedItems.every(item => {
            const completionKey = `${dateKey}_${item.created}`;
            const completion = item.recurring?.perDateCompletions?.[completionKey];
            if (!completion) return false;
            
            // Check if completion timestamp is within the same day (GMT+8)
            const completionDate = new Date(completion.timestamp);
            const gmt8Completion = new Date(completionDate.getTime() + (8 * 60 * 60 * 1000));
            const gmt8Date = new Date(date.getTime() + (8 * 60 * 60 * 1000));
            
            return gmt8Completion.toDateString() === gmt8Date.toDateString();
        });
        
        return completedOnDate ? 'success' : 'rescued';
    } else {
        // Check if we're within the 3-day rescue window
        const daysDiff = Math.floor((new Date(todayKey) - new Date(dateKey)) / (24 * 60 * 60 * 1000));
        
        if (daysDiff <= 3) {
            // Still within rescue window
            return 'pending';
        } else {
            // Past rescue window - check if any items are still incomplete
            const incompleteItems = requiredItems.filter(item => {
                const completionKey = `${dateKey}_${item.created}`;
                return !item.recurring?.perDateCompletions?.[completionKey]?.completed;
            });
            
            return incompleteItems.length > 0 ? 'failed' : 'rescued';
        }
    }
}

function getRequiredItemsForDate(date, recurringItems) {
    if (!recurringItems || recurringItems.length === 0) {
        return [];
    }
    
    return recurringItems.filter(item => {
        if (!item.recurring) return false;
        
        // Check if item is archived and if the date is after archive date
        if (item.recurring.archived && item.recurring.archivedOn) {
            const archiveDate = new Date(item.recurring.archivedOn);
            const archiveGmt8 = new Date(archiveDate.getTime() + (8 * 60 * 60 * 1000));
            const archiveDayBoundary = new Date(archiveGmt8);
            archiveDayBoundary.setHours(0, 0, 0, 0);
            
            // If this date is on or after the archive date, exclude it
            if (date >= archiveDayBoundary) {
                return false;
            }
        }
        
        const { frequency, weekdays, monthlyDates, anchorDate } = item.recurring;
        
        // Convert date to GMT+8 for consistent evaluation
        const gmt8Date = new Date(date.getTime() + (8 * 60 * 60 * 1000));
        const dayOfWeek = gmt8Date.getDay();
        const dayOfMonth = gmt8Date.getDate();
        
        switch (frequency) {
            case 'weekly':
                return weekdays && weekdays.includes(dayOfWeek);
                
            case 'biweekly':
                if (!weekdays || weekdays.length === 0) return false;
                if (!anchorDate) return false;
                
                // Calculate weeks difference from anchor date
                const anchorDateObj = new Date(anchorDate);
                const anchorGmt8 = new Date(anchorDateObj.getTime() + (8 * 60 * 60 * 1000));
                const weeksDiff = Math.floor((gmt8Date - anchorGmt8) / (7 * 24 * 60 * 60 * 1000));
                
                return weeksDiff % 2 === 0 && weekdays.includes(dayOfWeek);
                
            case 'monthly':
                return monthlyDates && monthlyDates.includes(dayOfMonth);
                
            default:
                return false;
        }
    });
}

function updateItemCompletionForDate(item, date, completed) {
    if (!item.recurring) return;
    
    const dateKey = date.toISOString().split('T')[0];
    const completionKey = `${dateKey}_${item.created}`;
    
    if (!item.recurring.perDateCompletions) {
        item.recurring.perDateCompletions = {};
    }
    
    if (completed) {
        item.recurring.perDateCompletions[completionKey] = {
            completed: true,
            timestamp: new Date().toISOString()
        };
    } else {
        delete item.recurring.perDateCompletions[completionKey];
    }
    
    // Update the item in localStorage
    const savedData = loadFromStorage('lifetiles_todo_list') || {};
    const listType = item.type || 'recurringItems';
    const itemIndex = savedData[listType]?.findIndex(i => i.created === item.created);
    
    if (itemIndex !== -1) {
        savedData[listType][itemIndex] = item;
        saveToStorage('lifetiles_todo_list', savedData);
    }
}

function recomputeCalendarStatuses() {
    // Clear existing status cache
    const calendarCache = loadFromStorage('lifetiles_calendar_hasChallenge_cache') || {};
    const statusCache = loadFromStorage('lifetiles_daily_status_by_date') || {};
    
    // Get recurring items
    const savedData = loadFromStorage('lifetiles_todo_list');
    const recurringItems = savedData?.recurringItems || [];
    
    // Recompute for current month and buffer months
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    
    for (let monthOffset = -1; monthOffset <= 1; monthOffset++) {
        const year = currentYear + Math.floor((currentMonth + monthOffset) / 12);
        const month = (currentMonth + monthOffset + 12) % 12;
        
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        for (let date = new Date(firstDay); date <= lastDay; date.setDate(date.getDate() + 1)) {
            const dateKey = date.toISOString().split('T')[0];
            const status = computeDateStatus(date, recurringItems);
            statusCache[dateKey] = status;
        }
    }
    
    // Save status cache
    saveToStorage('lifetiles_daily_status_by_date', statusCache);
    
    // Re-render calendar
    renderCalendar();
}

function scheduleMidnightRecompute() {
    const now = new Date();
    const gmt8Now = new Date(now.getTime() + (8 * 60 * 60 * 1000));
    
    // Calculate time until next midnight in GMT+8
    const tomorrow = new Date(gmt8Now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const timeUntilMidnight = tomorrow.getTime() - gmt8Now.getTime();
    
    // Schedule recomputation
    setTimeout(() => {
        recomputeCalendarStatuses();
        scheduleMidnightRecompute(); // Schedule next midnight
    }, timeUntilMidnight);
}
  