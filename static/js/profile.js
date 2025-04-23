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
  orderBy, 
  limit 
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';
import { 
  showToast, 
  initializeSidebar, 
  initializeProfileDropdown, 
  showLoading,
  formatCurrency,
  getCategoryIcon
} from './utils.js';

// DOM Elements
let profileForm;
let nameInput;
let incomeInput;
let incomeTypeSelect;
let saveProfileBtn;
let topCategoriesList;
let monthChangeValue;
let savingsTrendValue;
let budgetAlertsContainer;
let budgetAlertsList;

// Current user data
let currentUserId = null;
let userData = null;

// Initialize profile page
document.addEventListener('DOMContentLoaded', () => {
  // Initialize sidebar
  initializeSidebar();
  
  // Initialize profile dropdown
  initializeProfileDropdown();
  
  // Get DOM elements
  profileForm = document.getElementById('profile-form');
  nameInput = document.getElementById('profile-name');
  incomeInput = document.getElementById('profile-income');
  incomeTypeSelect = document.getElementById('income-type');
  saveProfileBtn = document.getElementById('save-profile-btn');
  topCategoriesList = document.getElementById('top-categories-list');
  monthChangeValue = document.getElementById('month-change-value');
  savingsTrendValue = document.getElementById('savings-trend-value');
  budgetAlertsContainer = document.querySelector('.budget-alerts');
  budgetAlertsList = document.getElementById('budget-alerts-list');
  
  // Set up form events
  if (profileForm) {
    profileForm.addEventListener('submit', handleProfileUpdate);
  }
  
  // Auth state observer
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      currentUserId = user.uid;
      // Load profile data
      await loadProfileData();
      // Load analytics data
      await loadAnalyticsData();
    }
  });
});

// Load profile data
async function loadProfileData() {
  if (!currentUserId) return;
  
  try {
    showLoading(true);
    
    // Get user document
    const userDoc = await getDoc(doc(db, 'users', currentUserId));
    if (userDoc.exists()) {
      userData = userDoc.data();
      
      // Fill profile form
      if (nameInput) nameInput.value = userData.name || '';
    }
    
    // Get meta document
    const metaDoc = await getDoc(doc(db, 'users', currentUserId, 'meta', 'profile'));
    if (metaDoc.exists()) {
      const metaData = metaDoc.data();
      
      if (metaData.income) {
        if (incomeInput) incomeInput.value = metaData.income.amount || 0;
        if (incomeTypeSelect) incomeTypeSelect.value = metaData.income.type || 'monthly';
      }
    }
    
    showLoading(false);
  } catch (error) {
    console.error('Error loading profile data:', error);
    showToast('Error loading profile data. Please try again.', 'error');
    showLoading(false);
  }
}

// Handle profile update form submission
async function handleProfileUpdate(e) {
  e.preventDefault();
  
  if (!currentUserId) return;
  
  // Get form values
  const name = nameInput.value.trim();
  const income = parseFloat(incomeInput.value) || 0;
  const incomeType = incomeTypeSelect.value;
  
  // Validate form
  if (!name) {
    showToast('Please enter your name', 'error');
    return;
  }
  
  try {
    showLoading(true);
    
    // Update user document
    await updateDoc(doc(db, 'users', currentUserId), {
      name: name
    });
    
    // Update meta document
    await updateDoc(doc(db, 'users', currentUserId, 'meta', 'profile'), {
      'income.amount': income,
      'income.type': incomeType,
      'income.currency': 'INR'
    });
    
    // Show success message
    showToast('Profile updated successfully', 'success');
    
    // Update profile dropdown
    initializeProfileDropdown();
    
    showLoading(false);
  } catch (error) {
    console.error('Error updating profile:', error);
    showToast('Error updating profile. Please try again.', 'error');
    showLoading(false);
  }
}

// Load analytics data
async function loadAnalyticsData() {
  if (!currentUserId) return;
  
  try {
    showLoading(true);
    
    // Get transactions
    const transactionsRef = collection(db, 'users', currentUserId, 'transactions');
    const transactionsQuery = query(transactionsRef, orderBy('date', 'desc'));
    
    const transactionsSnapshot = await getDocs(transactionsQuery);
    const transactions = [];
    
    transactionsSnapshot.forEach(doc => {
      transactions.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Load top spending categories
    loadTopSpendingCategories(transactions);
    
    // Load month-on-month change
    loadMonthOnMonthChange(transactions);
    
    // Load savings trend
    loadSavingsTrend(transactions);
    
    // Load budget breach alerts
    loadBudgetAlerts(transactions);
    
    showLoading(false);
  } catch (error) {
    console.error('Error loading analytics data:', error);
    showToast('Error loading analytics data. Please try again.', 'error');
    showLoading(false);
  }
}

// Load top spending categories
function loadTopSpendingCategories(transactions) {
  if (!topCategoriesList) return;
  
  // Clear existing categories
  topCategoriesList.innerHTML = '';
  
  // Filter expenses only
  const expenses = transactions.filter(transaction => transaction.type === 'expense');
  
  // Group by category
  const categoryTotals = {};
  
  expenses.forEach(expense => {
    if (!categoryTotals[expense.category]) {
      categoryTotals[expense.category] = 0;
    }
    categoryTotals[expense.category] += parseFloat(expense.amount);
  });
  
  // Sort categories by amount
  const sortedCategories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3); // Get top 3
  
  if (sortedCategories.length === 0) {
    const emptyItem = document.createElement('li');
    emptyItem.className = 'empty-analytics';
    emptyItem.innerHTML = `
      <p>No expense data available yet</p>
    `;
    topCategoriesList.appendChild(emptyItem);
    return;
  }
  
  // Create category items
  sortedCategories.forEach(([category, amount]) => {
    const li = document.createElement('li');
    li.className = 'category-item';
    
    li.innerHTML = `
      <div class="category-info">
        <div class="category-icon">
          <i class="${getCategoryIcon(category)}"></i>
        </div>
        <span class="category-name">${category}</span>
      </div>
      <span class="category-amount">${formatCurrency(amount)}</span>
    `;
    
    topCategoriesList.appendChild(li);
  });
}

// Load month-on-month change
function loadMonthOnMonthChange(transactions) {
  if (!monthChangeValue) return;
  
  // Group transactions by month
  const monthlyTotals = {};
  
  transactions.forEach(transaction => {
    const date = new Date(transaction.date);
    const month = date.toLocaleString('default', { month: 'short', year: 'numeric' });
    
    if (!monthlyTotals[month]) {
      monthlyTotals[month] = {
        income: 0,
        expense: 0
      };
    }
    
    if (transaction.type === 'income') {
      monthlyTotals[month].income += parseFloat(transaction.amount);
    } else {
      monthlyTotals[month].expense += parseFloat(transaction.amount);
    }
  });
  
  // Sort months chronologically
  const sortedMonths = Object.keys(monthlyTotals).sort((a, b) => {
    const dateA = new Date(a);
    const dateB = new Date(b);
    return dateB - dateA; // Descending order
  });
  
  // Calculate month-on-month change
  if (sortedMonths.length >= 2) {
    const currentMonth = sortedMonths[0];
    const previousMonth = sortedMonths[1];
    
    const currentExpense = monthlyTotals[currentMonth].expense;
    const previousExpense = monthlyTotals[previousMonth].expense;
    
    if (previousExpense > 0) {
      const changePercentage = ((currentExpense - previousExpense) / previousExpense) * 100;
      
      let changeClass = 'neutral';
      if (changePercentage > 0) {
        changeClass = 'negative'; // Spending more is negative
      } else if (changePercentage < 0) {
        changeClass = 'positive'; // Spending less is positive
      }
      
      monthChangeValue.textContent = `${Math.abs(changePercentage).toFixed(1)}%`;
      monthChangeValue.className = `analytics-value ${changeClass}`;
      
      const indicator = document.createElement('i');
      indicator.className = changePercentage > 0 ? 'fas fa-arrow-up' : 'fas fa-arrow-down';
      indicator.style.marginLeft = '5px';
      monthChangeValue.appendChild(indicator);
    } else {
      monthChangeValue.textContent = 'N/A';
      monthChangeValue.className = 'analytics-value neutral';
    }
  } else {
    monthChangeValue.textContent = 'N/A';
    monthChangeValue.className = 'analytics-value neutral';
  }
}

// Load savings trend
function loadSavingsTrend(transactions) {
  if (!savingsTrendValue) return;
  
  // Group transactions by month
  const monthlyTotals = {};
  
  transactions.forEach(transaction => {
    const date = new Date(transaction.date);
    const month = date.toLocaleString('default', { month: 'short', year: 'numeric' });
    
    if (!monthlyTotals[month]) {
      monthlyTotals[month] = {
        income: 0,
        expense: 0
      };
    }
    
    if (transaction.type === 'income') {
      monthlyTotals[month].income += parseFloat(transaction.amount);
    } else {
      monthlyTotals[month].expense += parseFloat(transaction.amount);
    }
  });
  
  // Sort months chronologically
  const sortedMonths = Object.keys(monthlyTotals).sort((a, b) => {
    const dateA = new Date(a);
    const dateB = new Date(b);
    return dateA - dateB;
  });
  
  // Calculate monthly savings rate
  const savingsRates = [];
  
  sortedMonths.forEach(month => {
    const income = monthlyTotals[month].income;
    const expense = monthlyTotals[month].expense;
    
    if (income > 0) {
      const savingsRate = ((income - expense) / income) * 100;
      savingsRates.push(savingsRate);
    }
  });
  
  // Calculate average savings rate
  if (savingsRates.length > 0) {
    const averageSavingsRate = savingsRates.reduce((acc, rate) => acc + rate, 0) / savingsRates.length;
    
    let trendClass = 'neutral';
    if (averageSavingsRate > 20) {
      trendClass = 'positive';
    } else if (averageSavingsRate < 0) {
      trendClass = 'negative';
    }
    
    savingsTrendValue.textContent = `${averageSavingsRate.toFixed(1)}%`;
    savingsTrendValue.className = `analytics-value ${trendClass}`;
  } else {
    savingsTrendValue.textContent = 'N/A';
    savingsTrendValue.className = 'analytics-value neutral';
  }
}

// Load budget alerts
async function loadBudgetAlerts(transactions) {
  if (!budgetAlertsContainer || !budgetAlertsList) return;
  
  try {
    // Get budget settings
    const metaDoc = await getDoc(doc(db, 'users', currentUserId, 'meta', 'profile'));
    if (!metaDoc.exists()) {
      budgetAlertsContainer.style.display = 'none';
      return;
    }
    
    const metaData = metaDoc.data();
    const budgets = metaData.budgets || {};
    
    // Check if budgets are set
    if (Object.keys(budgets).length === 0) {
      budgetAlertsContainer.style.display = 'none';
      return;
    }
    
    // Show budget alerts container
    budgetAlertsContainer.style.display = 'block';
    
    // Clear existing alerts
    budgetAlertsList.innerHTML = '';
    
    // Get current month expenses
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    
    const currentMonthExpenses = transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return transaction.type === 'expense' && transactionDate >= startOfMonth;
    });
    
    // Group expenses by category
    const categoryTotals = {};
    
    currentMonthExpenses.forEach(expense => {
      if (!categoryTotals[expense.category]) {
        categoryTotals[expense.category] = 0;
      }
      categoryTotals[expense.category] += parseFloat(expense.amount);
    });
    
    // Check for budget breaches
    let alertsFound = false;
    
    Object.entries(budgets).forEach(([category, budget]) => {
      const spent = categoryTotals[category] || 0;
      
      if (spent > budget) {
        // Create alert item
        alertsFound = true;
        const li = document.createElement('li');
        li.className = 'alert-item';
        
        li.innerHTML = `
          <div class="alert-info">
            <i class="alert-icon fas fa-exclamation-triangle"></i>
            <span class="alert-category">${category}</span>
          </div>
          <span class="alert-status">
            ${formatCurrency(spent)} / ${formatCurrency(budget)}
          </span>
        `;
        
        budgetAlertsList.appendChild(li);
      }
    });
    
    // Show empty state if no alerts
    if (!alertsFound) {
      const emptyItem = document.createElement('li');
      emptyItem.className = 'empty-analytics';
      emptyItem.innerHTML = `
        <p>No budget breaches this month</p>
      `;
      budgetAlertsList.appendChild(emptyItem);
    }
  } catch (error) {
    console.error('Error loading budget alerts:', error);
    budgetAlertsContainer.style.display = 'none';
  }
}
