// Import Firebase modules and other utilities
import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';
import { 
  collection, 
  query, 
  where, 
  limit, 
  getDocs, 
  orderBy, 
  doc, 
  getDoc 
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';
import { showToast } from './utils.js';

// DOM Elements
let welcomeMessage;
let totalIncomeElement;
let totalExpensesElement;
let currentBalanceElement;
let transactionList;
let pieChartBtn;
let barChartBtn;
let chartCanvas;

// Chart instances
let currentChart = null;

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
  // Initialize sidebar functionality
  initializeSidebar();
  
  // Initialize profile dropdown
  initializeProfileDropdown();
  
  // Get DOM elements
  welcomeMessage = document.getElementById('welcome-message');
  totalIncomeElement = document.getElementById('total-income');
  totalExpensesElement = document.getElementById('total-expenses');
  currentBalanceElement = document.getElementById('current-balance');
  transactionList = document.getElementById('transaction-list');
  pieChartBtn = document.getElementById('pie-chart-btn');
  barChartBtn = document.getElementById('bar-chart-btn');
  chartCanvas = document.getElementById('dashboard-chart');
  
  // Set up chart toggle buttons
  if (pieChartBtn && barChartBtn) {
    pieChartBtn.addEventListener('click', () => toggleChart('pie'));
    barChartBtn.addEventListener('click', () => toggleChart('bar'));
  }
  
  // Auth state observer
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      // User is signed in, load dashboard data
      await loadDashboardData(user.uid);
    }
  });
});

// Initialize sidebar functionality
function initializeSidebar() {
  const navbarToggle = document.getElementById('navbar-toggle');
  const sidenav = document.querySelector('.sidenav');
  const mainContent = document.querySelector('.main-content');
  
  if (navbarToggle && sidenav) {
    navbarToggle.addEventListener('click', () => {
      sidenav.classList.toggle('open');
      if (mainContent) {
        mainContent.classList.toggle('shifted');
      }
    });
  }
  
  // Highlight active nav item
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll('.sidenav-link');
  
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath) {
      link.classList.add('active');
    }
  });
}

// Initialize profile dropdown
function initializeProfileDropdown() {
  const profileToggle = document.getElementById('profile-toggle');
  const profileMenu = document.querySelector('.profile-menu');
  
  if (profileToggle && profileMenu) {
    profileToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      profileMenu.classList.toggle('active');
    });
    
    // Close on click outside
    document.addEventListener('click', (e) => {
      if (!profileMenu.contains(e.target) && e.target !== profileToggle) {
        profileMenu.classList.remove('active');
      }
    });
  }
  
  // Get and display user name in profile menu
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();
      
      if (userData && userData.name) {
        const profileMenuName = document.querySelector('.profile-menu-name');
        if (profileMenuName) {
          profileMenuName.textContent = userData.name;
        }
        
        const profileMenuEmail = document.querySelector('.profile-menu-email');
        if (profileMenuEmail) {
          profileMenuEmail.textContent = user.email;
        }
        
        if (welcomeMessage) {
          welcomeMessage.textContent = `Hey, ${userData.name}!`;
        }
      }
    }
  });
}

// Load dashboard data
async function loadDashboardData(userId) {
  try {
    // Show loading state
    showLoading(true);
    
    // Fetch user's transactions
    const transactionsQuery = query(
      collection(db, 'users', userId, 'transactions'),
      orderBy('date', 'desc')
    );
    
    const transactionsSnapshot = await getDocs(transactionsQuery);
    const transactions = [];
    
    transactionsSnapshot.forEach(doc => {
      transactions.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Calculate totals
    let totalIncome = 0;
    let totalExpenses = 0;
    
    transactions.forEach(transaction => {
      if (transaction.type === 'income') {
        totalIncome += parseFloat(transaction.amount);
      } else {
        totalExpenses += parseFloat(transaction.amount);
      }
    });
    
    const currentBalance = totalIncome - totalExpenses;
    
    // Update summary cards
    if (totalIncomeElement) {
      totalIncomeElement.textContent = `₹${totalIncome.toFixed(2)}`;
    }
    
    if (totalExpensesElement) {
      totalExpensesElement.textContent = `₹${totalExpenses.toFixed(2)}`;
    }
    
    if (currentBalanceElement) {
      currentBalanceElement.textContent = `₹${currentBalance.toFixed(2)}`;
    }
    
    // Display recent transactions
    displayRecentTransactions(transactions.slice(0, 5));
    
    // Initialize chart with data
    initializeChart('pie', transactions);
    
    // Hide loading state
    showLoading(false);
  } catch (error) {
    console.error('Error loading dashboard data:', error);
    showToast('Error loading dashboard data. Please try again.', 'error');
    showLoading(false);
  }
}

// Display recent transactions
function displayRecentTransactions(transactions) {
  if (!transactionList) return;
  
  // Clear existing content
  transactionList.innerHTML = '';
  
  if (transactions.length === 0) {
    const emptyState = document.createElement('div');
    emptyState.className = 'recent-transactions-empty';
    emptyState.innerHTML = `
      <p>No transactions yet. Add your first transaction to get started!</p>
    `;
    transactionList.appendChild(emptyState);
    return;
  }
  
  // Add new transactions
  transactions.forEach(transaction => {
    const li = document.createElement('li');
    li.className = 'transaction-item';
    
    // Format date
    const date = new Date(transaction.date);
    const formattedDate = date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    
    // Get icon based on category
    const icon = getCategoryIcon(transaction.category);
    
    li.innerHTML = `
      <div class="transaction-info">
        <div class="transaction-category-icon">
          <i class="${icon}"></i>
        </div>
        <div class="transaction-details">
          <h4>${transaction.description}</h4>
          <span class="transaction-date">${formattedDate} · ${transaction.category}</span>
        </div>
      </div>
      <span class="transaction-amount ${transaction.type}">
        ${transaction.type === 'income' ? '+' : '-'}₹${parseFloat(transaction.amount).toFixed(2)}
      </span>
    `;
    
    transactionList.appendChild(li);
  });
}

// Get Font Awesome icon based on category
function getCategoryIcon(category) {
  const categoryIcons = {
    'Food': 'fas fa-utensils',
    'Transportation': 'fas fa-car',
    'Housing': 'fas fa-home',
    'Entertainment': 'fas fa-film',
    'Shopping': 'fas fa-shopping-bag',
    'Utilities': 'fas fa-bolt',
    'Healthcare': 'fas fa-heartbeat',
    'Education': 'fas fa-graduation-cap',
    'Travel': 'fas fa-plane',
    'Personal': 'fas fa-user',
    'Salary': 'fas fa-money-bill-wave',
    'Investment': 'fas fa-chart-line',
    'Gift': 'fas fa-gift',
    'Other': 'fas fa-tag'
  };
  
  return categoryIcons[category] || 'fas fa-tag';
}

// Initialize and render chart
function initializeChart(type, transactions) {
  if (!chartCanvas) return;
  
  // Destroy existing chart if any
  if (currentChart) {
    currentChart.destroy();
  }
  
  // Prepare data for chart
  const categoryData = {};
  
  transactions.forEach(transaction => {
    if (transaction.type === 'expense') {
      if (!categoryData[transaction.category]) {
        categoryData[transaction.category] = 0;
      }
      categoryData[transaction.category] += parseFloat(transaction.amount);
    }
  });
  
  const labels = Object.keys(categoryData);
  const data = Object.values(categoryData);
  
  // Generate colors for chart
  const colors = generateColors(labels.length);
  
  // Set active button
  if (pieChartBtn && barChartBtn) {
    if (type === 'pie') {
      pieChartBtn.classList.add('active');
      barChartBtn.classList.remove('active');
    } else {
      barChartBtn.classList.add('active');
      pieChartBtn.classList.remove('active');
    }
  }
  
  // Create chart
  if (type === 'pie') {
    currentChart = new Chart(chartCanvas, {
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
          }
        }
      }
    });
  } else {
    currentChart = new Chart(chartCanvas, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Expenses',
          data: data,
          backgroundColor: colors,
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return '₹' + value;
              }
            }
          }
        },
        plugins: {
          title: {
            display: true,
            text: 'Expenses by Category'
          }
        }
      }
    });
  }
}

// Toggle chart type
function toggleChart(type) {
  // Get the current user's transactions
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        const transactionsQuery = query(
          collection(db, 'users', user.uid, 'transactions'),
          orderBy('date', 'desc')
        );
        
        const transactionsSnapshot = await getDocs(transactionsQuery);
        const transactions = [];
        
        transactionsSnapshot.forEach(doc => {
          transactions.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        // Initialize chart with data
        initializeChart(type, transactions);
      } catch (error) {
        console.error('Error fetching transactions for chart:', error);
        showToast('Error loading chart data. Please try again.', 'error');
      }
    }
  });
}

// Generate colors for chart
function generateColors(count) {
  const colors = [
    '#00bcd4', '#b388ff', '#4caf50', '#f44336', '#ff9800', 
    '#9c27b0', '#3f51b5', '#e91e63', '#2196f3', '#ffeb3b',
    '#607d8b', '#009688', '#673ab7', '#ffc107', '#795548'
  ];
  
  // If we need more colors than available, generate them
  if (count > colors.length) {
    for (let i = colors.length; i < count; i++) {
      const r = Math.floor(Math.random() * 255);
      const g = Math.floor(Math.random() * 255);
      const b = Math.floor(Math.random() * 255);
      colors.push(`rgb(${r}, ${g}, ${b})`);
    }
  }
  
  return colors.slice(0, count);
}

// Show/hide loading state
function showLoading(show) {
  let loaderContainer = document.querySelector('.loader-container');
  
  if (show) {
    if (!loaderContainer) {
      loaderContainer = document.createElement('div');
      loaderContainer.className = 'loader-container';
      loaderContainer.innerHTML = '<div class="loader"></div>';
      document.body.appendChild(loaderContainer);
    }
  } else {
    if (loaderContainer) {
      loaderContainer.remove();
    }
  }
}
