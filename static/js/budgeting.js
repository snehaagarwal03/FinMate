// Import Firebase modules and other utilities
import { auth, db } from './firebase-config.js';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy 
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';
import { 
  showToast, 
  initializeSidebar, 
  initializeProfileDropdown, 
  showLoading,
  formatCurrency,
  getCategories,
  getCategoryIcon
} from './utils.js';

// DOM Elements
let budgetForm;
let categorySelect;
let budgetInput;
let setBudgetBtn;
let budgetOverviewContainer;
let budgetProgressContainer;
let emptyBudgetsContainer;

// Current user data
let currentUserId = null;
let budgets = {};

// Initialize budgeting page
document.addEventListener('DOMContentLoaded', () => {
  // Initialize sidebar
  initializeSidebar();
  
  // Initialize profile dropdown
  initializeProfileDropdown();
  
  // Get DOM elements
  budgetForm = document.getElementById('budget-form');
  categorySelect = document.getElementById('budget-category');
  budgetInput = document.getElementById('budget-amount');
  setBudgetBtn = document.getElementById('set-budget-btn');
  budgetOverviewContainer = document.querySelector('.budget-overview-card');
  budgetProgressContainer = document.getElementById('budget-progress');
  emptyBudgetsContainer = document.querySelector('.empty-budgets');
  
  // Set up form events
  if (budgetForm) {
    budgetForm.addEventListener('submit', handleSetBudget);
  }
  
  // Populate category select
  populateCategorySelect();
  
  // Auth state observer
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      currentUserId = user.uid;
      // Load budgets
      await loadBudgets();
      // Load budget progress
      await loadBudgetProgress();
    }
  });
});

// Populate category select dropdown
function populateCategorySelect() {
  if (!categorySelect) return;
  
  // Get categories
  const categories = getCategories();
  
  // Clear existing options
  categorySelect.innerHTML = '';
  
  // Add categories
  categories.forEach(category => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    categorySelect.appendChild(option);
  });
}

// Load budgets from Firestore
async function loadBudgets() {
  if (!currentUserId) return;
  
  try {
    showLoading(true);
    
    // Get meta document
    const metaDoc = await getDoc(doc(db, 'users', currentUserId, 'meta', 'profile'));
    
    if (metaDoc.exists()) {
      const metaData = metaDoc.data();
      budgets = metaData.budgets || {};
      
      // Update budget input if category is selected
      if (categorySelect && categorySelect.value) {
        const selectedCategory = categorySelect.value;
        if (budgetInput && budgets[selectedCategory]) {
          budgetInput.value = budgets[selectedCategory];
        } else {
          budgetInput.value = '';
        }
      }
    }
    
    showLoading(false);
  } catch (error) {
    console.error('Error loading budgets:', error);
    showToast('Error loading budgets. Please try again.', 'error');
    showLoading(false);
  }
}

// Handle set budget form submission
async function handleSetBudget(e) {
  e.preventDefault();
  
  if (!currentUserId) return;
  
  // Get form values
  const category = categorySelect.value;
  const budget = parseFloat(budgetInput.value) || 0;
  
  // Validate form
  if (!category) {
    showToast('Please select a category', 'error');
    return;
  }
  
  if (budget <= 0) {
    showToast('Please enter a valid budget amount', 'error');
    return;
  }
  
  try {
    showLoading(true);
    
    // Update budgets
    budgets[category] = budget;
    
    // Update meta document
    await updateDoc(doc(db, 'users', currentUserId, 'meta', 'profile'), {
      [`budgets.${category}`]: budget
    });
    
    // Show success message
    showToast('Budget set successfully', 'success');
    
    // Reload budget progress
    await loadBudgetProgress();
    
    showLoading(false);
  } catch (error) {
    console.error('Error setting budget:', error);
    showToast('Error setting budget. Please try again.', 'error');
    showLoading(false);
  }
}

// Load budget progress
async function loadBudgetProgress() {
  if (!currentUserId || !budgetProgressContainer) return;
  
  try {
    showLoading(true);
    
    // Check if budgets are set
    if (Object.keys(budgets).length === 0) {
      if (budgetOverviewContainer) budgetOverviewContainer.style.display = 'none';
      if (emptyBudgetsContainer) emptyBudgetsContainer.style.display = 'block';
      showLoading(false);
      return;
    }
    
    // Show budget overview
    if (budgetOverviewContainer) budgetOverviewContainer.style.display = 'block';
    if (emptyBudgetsContainer) emptyBudgetsContainer.style.display = 'none';
    
    // Get current month expenses
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    
    const transactionsRef = collection(db, 'users', currentUserId, 'transactions');
    const transactionsQuery = query(
      transactionsRef,
      where('type', '==', 'expense'),
      where('date', '>=', startOfMonth.toISOString().split('T')[0])
    );
    
    const transactionsSnapshot = await getDocs(transactionsQuery);
    const expenses = [];
    
    transactionsSnapshot.forEach(doc => {
      expenses.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Group expenses by category
    const categoryTotals = {};
    
    expenses.forEach(expense => {
      if (!categoryTotals[expense.category]) {
        categoryTotals[expense.category] = 0;
      }
      categoryTotals[expense.category] += parseFloat(expense.amount);
    });
    
    // Clear budget progress container
    budgetProgressContainer.innerHTML = '';
    
    // Create budget progress bars
    Object.entries(budgets).forEach(([category, budget]) => {
      const spent = categoryTotals[category] || 0;
      const percentage = (spent / budget) * 100;
      
      // Determine progress bar class
      let progressClass = 'progress-normal';
      if (percentage >= 90) {
        progressClass = 'progress-danger';
      } else if (percentage >= 75) {
        progressClass = 'progress-warning';
      }
      
      if (percentage > 100) {
        progressClass = 'progress-over';
      }
      
      const budgetItem = document.createElement('div');
      budgetItem.className = 'budget-category';
      
      budgetItem.innerHTML = `
        <div class="budget-category-header">
          <div class="budget-category-name">
            <i class="${getCategoryIcon(category)}"></i>
            ${category}
          </div>
          <div class="budget-category-values">
            <span class="spent">${formatCurrency(spent)}</span> / ${formatCurrency(budget)}
          </div>
        </div>
        <div class="progress-bar-container">
          <div class="progress-bar ${progressClass}" style="width: ${Math.min(percentage, 100)}%"></div>
        </div>
      `;
      
      budgetProgressContainer.appendChild(budgetItem);
      
      // Show toast notification for budget breaches
      if (percentage > 100) {
        showToast(`Budget exceeded for ${category}!`, 'warning');
      }
    });
    
    showLoading(false);
  } catch (error) {
    console.error('Error loading budget progress:', error);
    showToast('Error loading budget progress. Please try again.', 'error');
    showLoading(false);
  }
}

// Add event listener to category select
if (categorySelect) {
  categorySelect.addEventListener('change', () => {
    const selectedCategory = categorySelect.value;
    if (budgetInput && budgets[selectedCategory]) {
      budgetInput.value = budgets[selectedCategory];
    } else {
      budgetInput.value = '';
    }
  });
}
