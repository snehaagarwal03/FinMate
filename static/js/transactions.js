// Import Firebase modules and other utilities
import { auth, db } from './firebase-config.js';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  Timestamp,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';
import { 
  showToast, 
  initializeSidebar, 
  initializeProfileDropdown, 
  showLoading,
  formatCurrency,
  formatDate,
  getCategoryIcon,
  getCategories
} from './utils.js';

// DOM Elements
let transactionsTable;
let transactionsTableBody;
let addTransactionBtn;
let transactionModal;
let editTransactionModal;
let confirmationModal;
let transactionForm;
let editTransactionForm;
let categoryFilter;
let dateFromFilter;
let dateToFilter;
let typeFilter;
let applyFiltersBtn;
let resetFiltersBtn;
let emptyTransactions;

// Current user ID
let currentUserId = null;

// Current transaction being edited or deleted
let currentTransactionId = null;

// Initialize transactions page
document.addEventListener('DOMContentLoaded', () => {
  // Initialize sidebar
  initializeSidebar();
  
  // Initialize profile dropdown
  initializeProfileDropdown();
  
  // Get DOM elements
  transactionsTable = document.getElementById('transactions-table');
  transactionsTableBody = document.getElementById('transactions-table-body');
  addTransactionBtn = document.getElementById('add-transaction-btn');
  transactionModal = document.getElementById('transaction-modal');
  editTransactionModal = document.getElementById('edit-transaction-modal');
  confirmationModal = document.getElementById('confirmation-modal');
  transactionForm = document.getElementById('transaction-form');
  editTransactionForm = document.getElementById('edit-transaction-form');
  categoryFilter = document.getElementById('category-filter');
  dateFromFilter = document.getElementById('date-from-filter');
  dateToFilter = document.getElementById('date-to-filter');
  typeFilter = document.getElementById('type-filter');
  applyFiltersBtn = document.getElementById('apply-filters-btn');
  resetFiltersBtn = document.getElementById('reset-filters-btn');
  emptyTransactions = document.querySelector('.empty-transactions');
  
  // Populate category filters and form dropdowns
  populateCategoryOptions();
  
  // Set up modal events
  setupModalEvents();
  
  // Set up form events
  setupFormEvents();
  
  // Set up filter events
  setupFilterEvents();
  
  // Auth state observer
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      currentUserId = user.uid;
      // Load transactions
      await loadTransactions();
    }
  });
});

// Populate category options in dropdowns
function populateCategoryOptions() {
  const categories = getCategories();
  
  // Populate category filter
  if (categoryFilter) {
    categoryFilter.innerHTML = '<option value="">All Categories</option>';
    
    categories.forEach(category => {
      const option = document.createElement('option');
      option.value = category;
      option.textContent = category;
      categoryFilter.appendChild(option);
    });
  }
  
  // Populate add form category dropdown
  const addFormCategoryDropdown = document.getElementById('transaction-category');
  if (addFormCategoryDropdown) {
    addFormCategoryDropdown.innerHTML = '';
    
    categories.forEach(category => {
      const option = document.createElement('option');
      option.value = category;
      option.textContent = category;
      addFormCategoryDropdown.appendChild(option);
    });
  }
  
  // Populate edit form category dropdown
  const editFormCategoryDropdown = document.getElementById('edit-transaction-category');
  if (editFormCategoryDropdown) {
    editFormCategoryDropdown.innerHTML = '';
    
    categories.forEach(category => {
      const option = document.createElement('option');
      option.value = category;
      option.textContent = category;
      editFormCategoryDropdown.appendChild(option);
    });
  }
}

// Set up modal events
function setupModalEvents() {
  // Add transaction button
  if (addTransactionBtn) {
    addTransactionBtn.addEventListener('click', () => {
      // Reset form
      if (transactionForm) {
        transactionForm.reset();
        
        // Set default date to today
        const today = new Date().toISOString().split('T')[0];
        const dateInput = document.getElementById('transaction-date');
        if (dateInput) {
          dateInput.value = today;
        }
        
        // Set default type
        const incomeToggle = document.querySelector('.type-toggle-btn.income');
        const expenseToggle = document.querySelector('.type-toggle-btn.expense');
        
        if (incomeToggle && expenseToggle) {
          incomeToggle.classList.remove('active');
          expenseToggle.classList.add('active');
          document.getElementById('transaction-type').value = 'expense';
        }
      }
      
      if (transactionModal) {
        transactionModal.classList.add('active');
      }
    });
  }
  
  // Close modal buttons
  const closeButtons = document.querySelectorAll('.modal-close');
  closeButtons.forEach(button => {
    button.addEventListener('click', () => {
      const modal = button.closest('.modal');
      if (modal) {
        modal.classList.remove('active');
      }
    });
  });
  
  // Close modal when clicking outside
  const modals = document.querySelectorAll('.modal');
  modals.forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
      }
    });
  });
  
  // Cancel confirmation button
  const cancelBtn = document.getElementById('cancel-btn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      if (confirmationModal) {
        confirmationModal.classList.remove('active');
      }
    });
  }
  
  // Confirm delete button
  const confirmBtn = document.getElementById('confirm-btn');
  if (confirmBtn) {
    confirmBtn.addEventListener('click', async () => {
      if (currentTransactionId) {
        await deleteTransaction(currentTransactionId);
      }
    });
  }
}

// Set up form events
function setupFormEvents() {
  // Transaction type toggle in add form
  const addIncomeToggle = document.querySelector('#transaction-form .type-toggle-btn.income');
  const addExpenseToggle = document.querySelector('#transaction-form .type-toggle-btn.expense');
  const addTypeInput = document.getElementById('transaction-type');
  
  if (addIncomeToggle && addExpenseToggle && addTypeInput) {
    addIncomeToggle.addEventListener('click', () => {
      addIncomeToggle.classList.add('active');
      addExpenseToggle.classList.remove('active');
      addTypeInput.value = 'income';
    });
    
    addExpenseToggle.addEventListener('click', () => {
      addExpenseToggle.classList.add('active');
      addIncomeToggle.classList.remove('active');
      addTypeInput.value = 'expense';
    });
  }
  
  // Transaction type toggle in edit form
  const editIncomeToggle = document.querySelector('#edit-transaction-form .type-toggle-btn.income');
  const editExpenseToggle = document.querySelector('#edit-transaction-form .type-toggle-btn.expense');
  const editTypeInput = document.getElementById('edit-transaction-type');
  
  if (editIncomeToggle && editExpenseToggle && editTypeInput) {
    editIncomeToggle.addEventListener('click', () => {
      editIncomeToggle.classList.add('active');
      editExpenseToggle.classList.remove('active');
      editTypeInput.value = 'income';
    });
    
    editExpenseToggle.addEventListener('click', () => {
      editExpenseToggle.classList.add('active');
      editIncomeToggle.classList.remove('active');
      editTypeInput.value = 'expense';
    });
  }
  
  // Add transaction form submission
  if (transactionForm) {
    transactionForm.addEventListener('submit', handleAddTransaction);
  }
  
  // Edit transaction form submission
  if (editTransactionForm) {
    editTransactionForm.addEventListener('submit', handleEditTransaction);
  }
}

// Set up filter events
function setupFilterEvents() {
  // Apply filters button
  if (applyFiltersBtn) {
    applyFiltersBtn.addEventListener('click', loadTransactions);
  }
  
  // Reset filters button
  if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener('click', () => {
      if (categoryFilter) categoryFilter.value = '';
      if (dateFromFilter) dateFromFilter.value = '';
      if (dateToFilter) dateToFilter.value = '';
      if (typeFilter) typeFilter.value = '';
      
      loadTransactions();
    });
  }
}

// Load transactions with optional filters
async function loadTransactions() {
  if (!currentUserId) return;
  
  try {
    showLoading(true);
    
    // Build query
    let transactionsRef = collection(db, 'users', currentUserId, 'transactions');
    let constraints = [orderBy('date', 'desc')];
    
    // Apply filters if they exist
    if (categoryFilter && categoryFilter.value) {
      constraints.push(where('category', '==', categoryFilter.value));
    }
    
    if (typeFilter && typeFilter.value) {
      constraints.push(where('type', '==', typeFilter.value));
    }
    
    // Date filtering is done client-side after fetching
    const transactionsQuery = query(transactionsRef, ...constraints);
    
    const transactionsSnapshot = await getDocs(transactionsQuery);
    let transactions = [];
    
    transactionsSnapshot.forEach(doc => {
      transactions.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Apply date filters client-side if they exist
    if (dateFromFilter && dateFromFilter.value) {
      const fromDate = new Date(dateFromFilter.value);
      fromDate.setHours(0, 0, 0, 0);
      transactions = transactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return transactionDate >= fromDate;
      });
    }
    
    if (dateToFilter && dateToFilter.value) {
      const toDate = new Date(dateToFilter.value);
      toDate.setHours(23, 59, 59, 999);
      transactions = transactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return transactionDate <= toDate;
      });
    }
    
    // Display transactions
    displayTransactions(transactions);
    
    showLoading(false);
  } catch (error) {
    console.error('Error loading transactions:', error);
    showToast('Error loading transactions. Please try again.', 'error');
    showLoading(false);
  }
}

// Display transactions in table
function displayTransactions(transactions) {
  if (!transactionsTableBody) return;
  
  // Clear existing rows
  transactionsTableBody.innerHTML = '';
  
  // Show/hide empty state
  if (transactions.length === 0) {
    if (transactionsTable) transactionsTable.style.display = 'none';
    if (emptyTransactions) emptyTransactions.style.display = 'block';
    return;
  } else {
    if (transactionsTable) transactionsTable.style.display = 'table';
    if (emptyTransactions) emptyTransactions.style.display = 'none';
  }
  
  // Add transaction rows
  transactions.forEach(transaction => {
    const row = document.createElement('tr');
    
    // Format date
    const formattedDate = formatDate(transaction.date);
    
    // Create row content
    row.innerHTML = `
      <td>${formattedDate}</td>
      <td>${transaction.description}</td>
      <td>
        <span class="category-badge">
          <i class="${getCategoryIcon(transaction.category)}"></i>
          ${transaction.category}
        </span>
      </td>
      <td>${transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}</td>
      <td class="transaction-amount ${transaction.type}">
        ${transaction.type === 'income' ? '+' : '-'}${formatCurrency(transaction.amount)}
      </td>
      <td class="transaction-actions">
        <button class="edit-btn" data-id="${transaction.id}">
          <i class="fas fa-edit"></i>
        </button>
        <button class="delete-btn" data-id="${transaction.id}">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    `;
    
    // Append row to table body
    transactionsTableBody.appendChild(row);
  });
  
  // Add event listeners to edit buttons
  const editButtons = document.querySelectorAll('.edit-btn');
  editButtons.forEach(button => {
    button.addEventListener('click', () => {
      const transactionId = button.getAttribute('data-id');
      openEditModal(transactionId, transactions);
    });
  });
  
  // Add event listeners to delete buttons
  const deleteButtons = document.querySelectorAll('.delete-btn');
  deleteButtons.forEach(button => {
    button.addEventListener('click', () => {
      const transactionId = button.getAttribute('data-id');
      openDeleteConfirmation(transactionId);
    });
  });
}

// Open edit transaction modal
function openEditModal(transactionId, transactions) {
  // Find the transaction
  const transaction = transactions.find(t => t.id === transactionId);
  if (!transaction) return;
  
  // Set current transaction ID
  currentTransactionId = transactionId;
  
  // Fill form fields
  const editAmountInput = document.getElementById('edit-transaction-amount');
  const editDateInput = document.getElementById('edit-transaction-date');
  const editCategorySelect = document.getElementById('edit-transaction-category');
  const editDescriptionInput = document.getElementById('edit-transaction-description');
  const editTypeInput = document.getElementById('edit-transaction-type');
  const editIncomeToggle = document.querySelector('#edit-transaction-form .type-toggle-btn.income');
  const editExpenseToggle = document.querySelector('#edit-transaction-form .type-toggle-btn.expense');
  
  if (editAmountInput) editAmountInput.value = transaction.amount;
  if (editDateInput) editDateInput.value = new Date(transaction.date).toISOString().split('T')[0];
  if (editCategorySelect) editCategorySelect.value = transaction.category;
  if (editDescriptionInput) editDescriptionInput.value = transaction.description;
  if (editTypeInput) editTypeInput.value = transaction.type;
  
  // Set type toggle buttons
  if (editIncomeToggle && editExpenseToggle) {
    if (transaction.type === 'income') {
      editIncomeToggle.classList.add('active');
      editExpenseToggle.classList.remove('active');
    } else {
      editExpenseToggle.classList.add('active');
      editIncomeToggle.classList.remove('active');
    }
  }
  
  // Show modal
  if (editTransactionModal) {
    editTransactionModal.classList.add('active');
  }
}

// Open delete confirmation modal
function openDeleteConfirmation(transactionId) {
  currentTransactionId = transactionId;
  
  if (confirmationModal) {
    confirmationModal.classList.add('active');
  }
}

// Handle add transaction form submission
async function handleAddTransaction(e) {
  e.preventDefault();
  
  if (!currentUserId) return;
  
  // Get form values
  const amount = document.getElementById('transaction-amount').value;
  const date = document.getElementById('transaction-date').value;
  const category = document.getElementById('transaction-category').value;
  const description = document.getElementById('transaction-description').value;
  const type = document.getElementById('transaction-type').value;
  
  // Validate form
  if (!amount || !date || !category || !description || !type) {
    showToast('Please fill out all fields', 'error');
    return;
  }
  
  try {
    showLoading(true);
    
    // Create transaction object
    const transaction = {
      amount: parseFloat(amount),
      date: date,
      category: category,
      description: description,
      type: type,
      createdAt: serverTimestamp()
    };
    
    // Add transaction to Firestore
    await addDoc(collection(db, 'users', currentUserId, 'transactions'), transaction);
    
    // Close modal
    if (transactionModal) {
      transactionModal.classList.remove('active');
    }
    
    // Reset form
    if (transactionForm) {
      transactionForm.reset();
    }
    
    // Show success message
    showToast('Transaction added successfully', 'success');
    
    // Reload transactions
    await loadTransactions();
    
    showLoading(false);
  } catch (error) {
    console.error('Error adding transaction:', error);
    showToast('Error adding transaction. Please try again.', 'error');
    showLoading(false);
  }
}

// Handle edit transaction form submission
async function handleEditTransaction(e) {
  e.preventDefault();
  
  if (!currentUserId || !currentTransactionId) return;
  
  // Get form values
  const amount = document.getElementById('edit-transaction-amount').value;
  const date = document.getElementById('edit-transaction-date').value;
  const category = document.getElementById('edit-transaction-category').value;
  const description = document.getElementById('edit-transaction-description').value;
  const type = document.getElementById('edit-transaction-type').value;
  
  // Validate form
  if (!amount || !date || !category || !description || !type) {
    showToast('Please fill out all fields', 'error');
    return;
  }
  
  try {
    showLoading(true);
    
    // Create updated transaction object
    const updatedTransaction = {
      amount: parseFloat(amount),
      date: date,
      category: category,
      description: description,
      type: type,
      updatedAt: serverTimestamp()
    };
    
    // Update transaction in Firestore
    await updateDoc(doc(db, 'users', currentUserId, 'transactions', currentTransactionId), updatedTransaction);
    
    // Close modal
    if (editTransactionModal) {
      editTransactionModal.classList.remove('active');
    }
    
    // Show success message
    showToast('Transaction updated successfully', 'success');
    
    // Reload transactions
    await loadTransactions();
    
    showLoading(false);
  } catch (error) {
    console.error('Error updating transaction:', error);
    showToast('Error updating transaction. Please try again.', 'error');
    showLoading(false);
  }
}

// Delete transaction
async function deleteTransaction(transactionId) {
  if (!currentUserId) return;
  
  try {
    showLoading(true);
    
    // Delete transaction from Firestore
    await deleteDoc(doc(db, 'users', currentUserId, 'transactions', transactionId));
    
    // Close modal
    if (confirmationModal) {
      confirmationModal.classList.remove('active');
    }
    
    // Show success message
    showToast('Transaction deleted successfully', 'success');
    
    // Reload transactions
    await loadTransactions();
    
    showLoading(false);
  } catch (error) {
    console.error('Error deleting transaction:', error);
    showToast('Error deleting transaction. Please try again.', 'error');
    showLoading(false);
  }
}
