// LifeTiles PWA - Books & Films Module

function initializeBooksFilmsLists() {
    renderBooksFilmsList('books', 'booksList');
    renderBooksFilmsList('films', 'filmsList');
}

function renderBooksFilmsList(listType, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const savedData = LifeTilesStorage.loadFromStorage('lifetiles_books_films');
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
        showBooksFilmsItemDetail(item, listType);
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

function showBooksFilmsItemDetail(item, listType) {
    const modal = document.createElement('div');
    modal.className = 'item-detail-modal';
    
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
    
    // Add overlay
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.addEventListener('click', () => LifeTilesCore.closeModal(modal));
    
    document.body.appendChild(overlay);
    document.body.appendChild(modal);
}

function setupBooksFilmsDetailEventListeners(modal, item, listType) {
    // Save button
    const saveBtn = modal.querySelector('#saveDetail');
    saveBtn.addEventListener('click', () => {
        saveBooksFilmsDetailChanges(modal, item, listType);
    });
    
    // Cancel button
    const cancelBtn = modal.querySelector('#cancelDetail');
    cancelBtn.addEventListener('click', () => {
        LifeTilesCore.closeModal(modal);
    });
    
    // Completion checkbox
    const completedCheckbox = modal.querySelector('#detailCompleted');
    completedCheckbox.addEventListener('change', () => {
        // Update the item's completion status immediately for visual feedback
        item.completed = completedCheckbox.checked;
    });
}

function saveBooksFilmsDetailChanges(modal, item, listType) {
    const newName = modal.querySelector('#detailItemName').value.trim();
    const notes = modal.querySelector('#detailNotes').value.trim();
    const completed = modal.querySelector('#detailCompleted').checked;
    
    if (!newName) {
        alert('Item name cannot be empty');
        return;
    }
    
    // Update the item
    const savedData = LifeTilesStorage.loadFromStorage('lifetiles_books_films') || {};
    const currentIndex = savedData[listType].findIndex(i => i.name === item.name && i.created === item.created);
    
    if (currentIndex !== -1) {
        savedData[listType][currentIndex].name = newName;
        savedData[listType][currentIndex].notes = notes;
        savedData[listType][currentIndex].completed = completed;
        savedData[listType][currentIndex].updated = new Date().toISOString();
        
        // Save to localStorage
        LifeTilesStorage.saveToStorage('lifetiles_books_films', savedData);
        
        // Re-render the list
        renderBooksFilmsList(listType, listType === 'books' ? 'booksList' : 'filmsList');
        
        // Close modal
        LifeTilesCore.closeModal(modal);
    }
}

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
            LifeTilesCore.closeModal(modal);
        }
    });
    
    // Add cancel event
    modal.querySelector('#cancelEdit').addEventListener('click', () => {
        LifeTilesCore.closeModal(modal);
    });
    
    // Add overlay
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.addEventListener('click', () => LifeTilesCore.closeModal(modal));
    
    document.body.appendChild(overlay);
    document.body.appendChild(modal);
    
    // Focus on input
    setTimeout(() => modal.querySelector('#editItemName').focus(), 100);
}

function updateBooksFilmsItem(listType, index, newName, notes, completed) {
    const savedData = LifeTilesStorage.loadFromStorage('lifetiles_books_films') || {};
    if (savedData[listType] && savedData[listType][index]) {
        savedData[listType][index].name = newName;
        savedData[listType][index].notes = notes;
        savedData[listType][index].completed = completed;
        savedData[listType][index].updated = new Date().toISOString();
        
        // Save to localStorage
        LifeTilesStorage.saveToStorage('lifetiles_books_films', savedData);
        
        // Re-render the list
        renderBooksFilmsList(listType, listType === 'books' ? 'booksList' : 'filmsList');
    }
}

function deleteBooksFilmsItem(listType, index) {
    if (confirm('Are you sure you want to delete this item?')) {
        const savedData = LifeTilesStorage.loadFromStorage('lifetiles_books_films') || {};
        if (savedData[listType] && savedData[listType][index]) {
            savedData[listType].splice(index, 1);
            LifeTilesStorage.saveToStorage('lifetiles_books_films', savedData);
            
            // Re-render the list
            renderBooksFilmsList(listType, listType === 'books' ? 'booksList' : 'filmsList');
        }
    }
}

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
            LifeTilesCore.closeModal(modal);
        }
    });
    
    // Add cancel event
    modal.querySelector('#cancelAdd').addEventListener('click', () => {
        LifeTilesCore.closeModal(modal);
    });
    
    // Add overlay
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.addEventListener('click', () => LifeTilesCore.closeModal(modal));
    
    document.body.appendChild(overlay);
    document.body.appendChild(modal);
    
    // Focus on input
    setTimeout(() => modal.querySelector('#itemName').focus(), 100);
}

function createBooksFilmsItem(listType, name) {
    const savedData = LifeTilesStorage.loadFromStorage('lifetiles_books_films') || {};
    
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
    LifeTilesStorage.saveToStorage('lifetiles_books_films', savedData);
    
    // Re-render the list
    renderBooksFilmsList(listType, listType === 'books' ? 'booksList' : 'filmsList');
}

function toggleBooksFilmsCompletion(listType, index, completed) {
    const savedData = LifeTilesStorage.loadFromStorage('lifetiles_books_films') || {};
    if (savedData[listType] && savedData[listType][index]) {
        savedData[listType][index].completed = completed;
        savedData[listType][index].updated = new Date().toISOString();
        LifeTilesStorage.saveToStorage('lifetiles_books_films', savedData);
        
        // Re-render the list
        renderBooksFilmsList(listType, listType === 'books' ? 'booksList' : 'filmsList');
    }
}

function setupBooksFilmsEventListeners() {
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

// Export Books & Films functions
window.LifeTilesBooksFilms = {
    initializeBooksFilmsLists,
    renderBooksFilmsList,
    createBooksFilmsItemElement,
    showBooksFilmsItemDetail,
    setupBooksFilmsDetailEventListeners,
    saveBooksFilmsDetailChanges,
    editBooksFilmsItem,
    updateBooksFilmsItem,
    deleteBooksFilmsItem,
    addBooksFilmsItem,
    createBooksFilmsItem,
    toggleBooksFilmsCompletion,
    setupBooksFilmsEventListeners
};
