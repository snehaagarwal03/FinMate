// Utility functions for the FinMate application

// Import Firebase modules
import { auth, db } from './firebase-config.js';
import { 
  doc, 
  getDoc 
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

// Show toast notification
function showToast(message, type = 'default') {
  // Check if toast container exists, if not create it
  let toastContainer = document.querySelector('.toast');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast';
    document.body.appendChild(toastContainer);
  }

  // Set message and type
  toastContainer.textContent = message;
  toastContainer.className = 'toast'; // Reset classes
  if (type) {
    toastContainer.classList.add(type);
  }

  // Show toast
  toastContainer.classList.add('show');

  // Hide toast after 3 seconds
  setTimeout(() => {
    toastContainer.classList.remove('show');
  }, 3000);
}

// Initialize sidebar functionality
function initializeSidebar() {
  const navbarToggle = document.getElementById('navbar-toggle');
  const sidenav = document.querySelector('.sidenav');
  const mainContent = document.querySelector('.main-content') || 
                    document.querySelector('.transactions-main') || 
                    document.querySelector('.insights-main') || 
                    document.querySelector('.profile-main') || 
                    document.querySelector('.budgeting-main');
  
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
async function initializeProfileDropdown() {
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
  
  // Get current user
  const user = auth.currentUser;
  if (user) {
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
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
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  }
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

// Format currency (INR)
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
}

// Format date
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
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

// Get all categories
function getCategories() {
  return [
    'Food',
    'Transportation',
    'Housing',
    'Entertainment',
    'Shopping',
    'Utilities',
    'Healthcare',
    'Education',
    'Travel',
    'Personal',
    'Salary',
    'Investment',
    'Gift',
    'Other'
  ];
}

// Generate chart colors
function generateChartColors(count) {
  const baseColors = [
    '#00bcd4', '#b388ff', '#4caf50', '#f44336', '#ff9800', 
    '#9c27b0', '#3f51b5', '#e91e63', '#2196f3', '#ffeb3b',
    '#607d8b', '#009688', '#673ab7', '#ffc107', '#795548'
  ];
  
  // If we need more colors than available, generate them
  if (count > baseColors.length) {
    for (let i = baseColors.length; i < count; i++) {
      const r = Math.floor(Math.random() * 255);
      const g = Math.floor(Math.random() * 255);
      const b = Math.floor(Math.random() * 255);
      baseColors.push(`rgb(${r}, ${g}, ${b})`);
    }
  }
  
  return baseColors.slice(0, count);
}

// Export utility functions
export {
  showToast,
  initializeSidebar,
  initializeProfileDropdown,
  showLoading,
  formatCurrency,
  formatDate,
  getCategoryIcon,
  getCategories,
  generateChartColors
};
