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
    
    // Sort items: uncompleted first, then alphabetically within each group
    const sortedItems = [...items].sort((a, b) => {
        // First sort by completion status
        if (a.completed !== b.completed) {
            return a.completed ? 1 : -1; // Uncompleted first
        }
        // Then sort alphabetically
        return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
    });
    
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
                    
                    <div class="weekday-selection" ${item.recurring?.frequency === 'weekly' ? '' : 'style="display: none;"'}>
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
            monthlyDates: [1, 15]
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

    // Sort items: uncompleted first, then alphabetically within each group
    const sortedItems = [...items].sort((a, b) => {
        // First sort by completion status
        if (a.completed !== b.completed) {
            return a.completed ? 1 : -1; // Uncompleted first
        }
        // Then sort alphabetically
        return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
    });

    // Render each item
    sortedItems.forEach((item, index) => {
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
        savedData[listType][index].completed = completed;
        savedData[listType][index].updated = new Date().toISOString();
        saveToStorage('lifetiles_todo_list', savedData);
        
        // Re-render both lists to update sorting
        renderTodoList('singleItems', 'singleItemsList');
        renderTodoList('recurringItems', 'recurringItemsList');
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
    
    // Completion checkbox
    const completedCheckbox = modal.querySelector('#detailCompleted');
    completedCheckbox.addEventListener('change', () => {
        // Update the item's completion status immediately for visual feedback
        item.completed = completedCheckbox.checked;
    });
}

// Update Recurring Options Display
function updateRecurringOptions(modal, frequency) {
    const weekdaySelection = modal.querySelector('.weekday-selection');
    const monthlyDates = modal.querySelector('.monthly-dates');
    
    if (frequency === 'weekly') {
        weekdaySelection.style.display = 'block';
        monthlyDates.style.display = 'none';
    } else if (frequency === 'monthly') {
        weekdaySelection.style.display = 'none';
        monthlyDates.style.display = 'block';
    } else {
        weekdaySelection.style.display = 'none';
        monthlyDates.style.display = 'none';
    }
}

// Save Detail Changes
function saveDetailChanges(modal, item, listType) {
    const newName = modal.querySelector('#detailItemName').value.trim();
    const completed = modal.querySelector('#detailCompleted').checked;
    const newType = modal.querySelector('.type-btn.active').dataset.type;
    
    if (!newName) {
        alert('Item name cannot be empty');
        return;
    }
    
    // Get recurring options if applicable
    let recurringOptions = null;
    if (newType === 'recurringItems') {
        const frequency = modal.querySelector('input[name="frequency"]:checked').value;
        const weekdays = [];
        const monthlyDates = [];
        
        if (frequency === 'weekly') {
            modal.querySelectorAll('.weekday-checkboxes input:checked').forEach(checkbox => {
                weekdays.push(parseInt(checkbox.value));
            });
            if (weekdays.length === 0) {
                alert('Please select at least one weekday for weekly recurrence');
                return;
            }
        } else if (frequency === 'monthly') {
            const datesInput = modal.querySelector('#monthlyDates').value.trim();
            if (datesInput) {
                monthlyDates = datesInput.split(',').map(d => parseInt(d.trim())).filter(d => d >= 1 && d <= 31);
                if (monthlyDates.length === 0) {
                    alert('Please enter valid monthly dates (1-31)');
                    return;
                }
            }
        }
        
        recurringOptions = {
            frequency: frequency,
            weekdays: weekdays,
            biweekly: frequency === 'biweekly',
            monthlyDates: monthlyDates
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
  