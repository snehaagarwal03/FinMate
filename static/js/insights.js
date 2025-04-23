// Import Firebase modules and other utilities
import { auth, db } from './firebase-config.js';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  doc, 
  getDoc 
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';
import { 
  showToast, 
  initializeSidebar, 
  initializeProfileDropdown, 
  showLoading,
  formatCurrency,
  generateChartColors,
  getCategories
} from './utils.js';

// DOM Elements
let pieChartContainer;
let barChartContainer;
let lineChartContainer;
let dateFromFilter;
let dateToFilter;
let typeFilter;
let applyFiltersBtn;
let resetFiltersBtn;
let emptySummary;

// Chart instances
let pieChart = null;
let barChart = null;
let lineChart = null;

// Current user ID
let currentUserId = null;

// Initialize insights page
document.addEventListener('DOMContentLoaded', () => {
  // Initialize sidebar
  initializeSidebar();
  
  // Initialize profile dropdown
  initializeProfileDropdown();
  
  // Get DOM elements
  pieChartContainer = document.getElementById('pie-chart');
  barChartContainer = document.getElementById('bar-chart');
  lineChartContainer = document.getElementById('line-chart');
  dateFromFilter = document.getElementById('date-from-filter');
  dateToFilter = document.getElementById('date-to-filter');
  typeFilter = document.getElementById('type-filter');
  applyFiltersBtn = document.getElementById('apply-filters-btn');
  resetFiltersBtn = document.getElementById('reset-filters-btn');
  emptySummary = document.querySelector('.empty-insights');
  
  // Set up filter events
  setupFilterEvents();
  
  // Auth state observer
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      currentUserId = user.uid;
      // Load insights data
      await loadInsightsData();
    }
  });
});

// Set up filter events
function setupFilterEvents() {
  // Apply filters button
  if (applyFiltersBtn) {
    applyFiltersBtn.addEventListener('click', loadInsightsData);
  }
  
  // Reset filters button
  if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener('click', () => {
      if (dateFromFilter) dateFromFilter.value = '';
      if (dateToFilter) dateToFilter.value = '';
      if (typeFilter) typeFilter.value = '';
      
      loadInsightsData();
    });
  }
}

// Load insights data with optional filters
async function loadInsightsData() {
  if (!currentUserId) return;
  
  try {
    showLoading(true);
    
    // Build query
    let transactionsRef = collection(db, 'users', currentUserId, 'transactions');
    let constraints = [orderBy('date', 'desc')];
    
    // Apply type filter if it exists
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
    
    // Show/hide empty state
    if (transactions.length === 0) {
      if (emptySummary) emptySummary.style.display = 'block';
      if (pieChartContainer) pieChartContainer.closest('.chart-container').style.display = 'none';
      if (barChartContainer) barChartContainer.closest('.chart-container').style.display = 'none';
      if (lineChartContainer) lineChartContainer.closest('.chart-container').style.display = 'none';
    } else {
      if (emptySummary) emptySummary.style.display = 'none';
      if (pieChartContainer) pieChartContainer.closest('.chart-container').style.display = 'block';
      if (barChartContainer) barChartContainer.closest('.chart-container').style.display = 'block';
      if (lineChartContainer) lineChartContainer.closest('.chart-container').style.display = 'block';
      
      // Create charts
      createPieChart(transactions);
      createBarChart(transactions);
      createLineChart(transactions);
    }
    
    showLoading(false);
  } catch (error) {
    console.error('Error loading insights data:', error);
    showToast('Error loading insights data. Please try again.', 'error');
    showLoading(false);
  }
}

// Create pie chart for expenses by category
function createPieChart(transactions) {
  if (!pieChartContainer) return;
  
  // Destroy existing chart if any
  if (pieChart) {
    pieChart.destroy();
  }
  
  // Filter expenses only
  const expenses = transactions.filter(transaction => transaction.type === 'expense');
  
  // Prepare data for chart
  const categoryData = {};
  
  expenses.forEach(transaction => {
    if (!categoryData[transaction.category]) {
      categoryData[transaction.category] = 0;
    }
    categoryData[transaction.category] += parseFloat(transaction.amount);
  });
  
  const labels = Object.keys(categoryData);
  const data = Object.values(categoryData);
  
  // Generate colors for chart
  const colors = generateChartColors(labels.length);
  
  // Create chart
  pieChart = new Chart(pieChartContainer, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: colors,
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
        },
        title: {
          display: true,
          text: 'Expenses by Category'
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const value = context.parsed;
              return `${context.label}: ${formatCurrency(value)}`;
            }
          }
        }
      }
    }
  });
}

// Create bar chart for income vs expense by month
function createBarChart(transactions) {
  if (!barChartContainer) return;
  
  // Destroy existing chart if any
  if (barChart) {
    barChart.destroy();
  }
  
  // Group transactions by month
  const monthlyData = {};
  
  transactions.forEach(transaction => {
    const date = new Date(transaction.date);
    const month = date.toLocaleString('default', { month: 'short', year: 'numeric' });
    
    if (!monthlyData[month]) {
      monthlyData[month] = {
        income: 0,
        expense: 0
      };
    }
    
    if (transaction.type === 'income') {
      monthlyData[month].income += parseFloat(transaction.amount);
    } else {
      monthlyData[month].expense += parseFloat(transaction.amount);
    }
  });
  
  // Sort months chronologically
  const sortedMonths = Object.keys(monthlyData).sort((a, b) => {
    const dateA = new Date(a);
    const dateB = new Date(b);
    return dateA - dateB;
  });
  
  const incomeData = sortedMonths.map(month => monthlyData[month].income);
  const expenseData = sortedMonths.map(month => monthlyData[month].expense);
  
  // Create chart
  barChart = new Chart(barChartContainer, {
    type: 'bar',
    data: {
      labels: sortedMonths,
      datasets: [
        {
          label: 'Income',
          data: incomeData,
          backgroundColor: '#4CAF50',
          borderWidth: 1
        },
        {
          label: 'Expense',
          data: expenseData,
          backgroundColor: '#F44336',
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          stacked: false
        },
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return formatCurrency(value);
            }
          }
        }
      },
      plugins: {
        title: {
          display: true,
          text: 'Monthly Income vs Expense'
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const value = context.raw;
              return `${context.dataset.label}: ${formatCurrency(value)}`;
            }
          }
        }
      }
    }
  });
}

// Create line chart for monthly balance trend
function createLineChart(transactions) {
  if (!lineChartContainer) return;
  
  // Destroy existing chart if any
  if (lineChart) {
    lineChart.destroy();
  }
  
  // Group transactions by month
  const monthlyData = {};
  
  transactions.forEach(transaction => {
    const date = new Date(transaction.date);
    const month = date.toLocaleString('default', { month: 'short', year: 'numeric' });
    
    if (!monthlyData[month]) {
      monthlyData[month] = {
        income: 0,
        expense: 0
      };
    }
    
    if (transaction.type === 'income') {
      monthlyData[month].income += parseFloat(transaction.amount);
    } else {
      monthlyData[month].expense += parseFloat(transaction.amount);
    }
  });
  
  // Sort months chronologically
  const sortedMonths = Object.keys(monthlyData).sort((a, b) => {
    const dateA = new Date(a);
    const dateB = new Date(b);
    return dateA - dateB;
  });
  
  const balanceData = sortedMonths.map(month => {
    return monthlyData[month].income - monthlyData[month].expense;
  });
  
  // Calculate cumulative balance
  let cumulativeBalance = 0;
  const cumulativeData = balanceData.map(balance => {
    cumulativeBalance += balance;
    return cumulativeBalance;
  });
  
  // Create chart
  lineChart = new Chart(lineChartContainer, {
    type: 'line',
    data: {
      labels: sortedMonths,
      datasets: [
        {
          label: 'Monthly Balance',
          data: balanceData,
          backgroundColor: 'rgba(0, 188, 212, 0.2)',
          borderColor: '#00bcd4',
          borderWidth: 2,
          tension: 0.4,
          fill: false
        },
        {
          label: 'Cumulative Balance',
          data: cumulativeData,
          backgroundColor: 'rgba(179, 136, 255, 0.2)',
          borderColor: '#b388ff',
          borderWidth: 2,
          tension: 0.4,
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          ticks: {
            callback: function(value) {
              return formatCurrency(value);
            }
          }
        }
      },
      plugins: {
        title: {
          display: true,
          text: 'Monthly Balance Trend'
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const value = context.raw;
              return `${context.dataset.label}: ${formatCurrency(value)}`;
            }
          }
        }
      }
    }
  });
}
