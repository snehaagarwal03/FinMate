// Utility functions for the application

// Format currency to INR
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
  }).format(amount);
}

// Format date to readable format
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// Show toast notification
function showToast(message, type = 'default') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const toastIcon = document.createElement('span');
  toastIcon.className = 'toast-icon';
  
  switch (type) {
    case 'success':
      toastIcon.innerHTML = '<i class="fas fa-check-circle"></i>';
      break;
    case 'error':
      toastIcon.innerHTML = '<i class="fas fa-exclamation-circle"></i>';
      break;
    case 'warning':
      toastIcon.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
      break;
    default:
      toastIcon.innerHTML = '<i class="fas fa-info-circle"></i>';
  }
  
  const toastMessage = document.createElement('span');
  toastMessage.className = 'toast-message';
  toastMessage.textContent = message;
  
  toast.appendChild(toastIcon);
  toast.appendChild(toastMessage);
  
  const toastContainer = document.querySelector('.toast-container');
  if (toastContainer) {
    toastContainer.appendChild(toast);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }
}

// Initialize sidebar toggle
function initializeSidebar() {
  const navbarToggle = document.getElementById('navbar-toggle');
  const sideNav = document.getElementById('sidenav');
  
  if (navbarToggle && sideNav) {
    navbarToggle.addEventListener('click', function() {
      sideNav.classList.toggle('active');
    });
  }
}

// Initialize profile dropdown
function initializeProfileDropdown() {
  const profileToggle = document.getElementById('profile-toggle');
  const profileMenu = document.getElementById('profile-menu');
  const logoutBtn = document.getElementById('logout-btn');
  
  if (profileToggle && profileMenu) {
    profileToggle.addEventListener('click', function(e) {
      e.stopPropagation();
      profileMenu.classList.toggle('active');
    });
    
    // Close profile menu when clicking outside
    document.addEventListener('click', function(e) {
      if (profileMenu.classList.contains('active') && !profileMenu.contains(e.target) && e.target !== profileToggle) {
        profileMenu.classList.remove('active');
      }
    });
  }
  
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function(e) {
      e.preventDefault();
      
      firebase.auth().signOut()
        .then(() => {
          // Redirect to login page
          window.location.href = 'login.html';
        })
        .catch((error) => {
          console.error('Error signing out:', error);
          showToast('Error signing out. Please try again.', 'error');
        });
    });
  }
}

// Fetch and display user's name in dashboard greeting (support both IDs for legacy)
function setDashboardGreeting() {
  const greetingElem = document.getElementById('dashboard-greeting') || document.getElementById('welcome-message');
  if (greetingElem) {
    firebase.auth().onAuthStateChanged(async function(user) {
      if (user) {
        try {
          const userDoc = await firebase.firestore().collection('users').doc(user.uid).get();
          let name = 'User';
          if (userDoc.exists) {
            const userData = userDoc.data();
            if (userData.name) name = userData.name;
          }
          greetingElem.textContent = `Hey, ${name}!`;
        } catch (error) {
          greetingElem.textContent = 'Hey, User!';
        }
      }
    });
  }
}

// Dropdown: always fetch name from Firestore
firebase.auth().onAuthStateChanged(async function(user) {
  if (user) {
    const profileName = document.getElementById('profile-name');
    const profileEmail = document.getElementById('profile-email');
    if (profileEmail) profileEmail.textContent = user.email;
    try {
      const userDoc = await firebase.firestore().collection('users').doc(user.uid).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        if (profileName) profileName.textContent = userData.name || 'User';
      }
    } catch (error) {
      if (profileName) profileName.textContent = 'User';
    }
  }
});

// Prefill profile form name input if present (for profile.html)
function prefillProfileName() {
  firebase.auth().onAuthStateChanged(async function(user) {
    if (user) {
      try {
        const userDoc = await firebase.firestore().collection('users').doc(user.uid).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          const nameInput = document.getElementById('profile-name-input');
          if (nameInput) nameInput.value = userData.name || '';
        }
      } catch (error) {
        // silent fail
      }
    }
  });
}

// Call this function on profile.html after DOMContentLoaded
if (window.location.pathname.endsWith('profile.html')) {
  document.addEventListener('DOMContentLoaded', prefillProfileName);
}

// Call on dashboard.html after DOMContentLoaded
if (window.location.pathname.endsWith('dashboard.html')) {
  document.addEventListener('DOMContentLoaded', setDashboardGreeting);
}

// Show/hide loading spinner
function showLoading(show) {
  const loadingSpinner = document.getElementById('loading-spinner');
  if (loadingSpinner) {
    loadingSpinner.style.display = show ? 'flex' : 'none';
  }
}

// Get category icon based on category name
function getCategoryIcon(category) {
  switch (category.toLowerCase()) {
    case 'food':
      return 'fas fa-utensils';
    case 'shopping':
      return 'fas fa-shopping-bag';
    case 'transportation':
      return 'fas fa-car';
    case 'entertainment':
      return 'fas fa-film';
    case 'utilities':
      return 'fas fa-lightbulb';
    case 'housing':
      return 'fas fa-home';
    case 'healthcare':
      return 'fas fa-medkit';
    case 'education':
      return 'fas fa-graduation-cap';
    case 'travel':
      return 'fas fa-plane';
    case 'personal':
      return 'fas fa-user';
    case 'salary':
      return 'fas fa-money-check-alt';
    case 'investment':
      return 'fas fa-chart-line';
    case 'gift':
      return 'fas fa-gift';
    case 'other':
      return 'fas fa-box';
    default:
      return 'fas fa-receipt';
  }
}

// Get available categories
function getCategories() {
  return [
    'Food', 'Shopping', 'Transportation', 'Entertainment', 'Utilities',
    'Housing', 'Healthcare', 'Education', 'Travel', 'Personal',
    'Salary', 'Investment', 'Gift', 'Other'
  ];
}

// Generate chart colors
function generateChartColors(count) {
  const baseColors = [
    '#00BCD4', // Primary
    '#4CAF50', // Success
    '#F44336', // Danger
    '#FFC107', // Warning
    '#9C27B0', // Purple
    '#FF9800', // Orange
    '#3F51B5', // Indigo
    '#2196F3', // Blue
    '#009688', // Teal
    '#E91E63', // Pink
    '#673AB7', // Deep Purple
    '#CDDC39', // Lime
    '#795548', // Brown
    '#607D8B'  // Blue Grey
  ];
  
  if (count <= baseColors.length) {
    return baseColors.slice(0, count);
  }
  
  // If we need more colors than in our base set, generate them
  const colors = [...baseColors];
  
  for (let i = baseColors.length; i < count; i++) {
    const r = Math.floor(Math.random() * 255);
    const g = Math.floor(Math.random() * 255);
    const b = Math.floor(Math.random() * 255);
    
    colors.push(`rgb(${r}, ${g}, ${b})`);
  }
  
  return colors;
}