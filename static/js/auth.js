// Import Firebase auth and firestore
import { 
  auth, 
  db 
} from './firebase-config.js';

import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';

import { 
  doc, 
  setDoc 
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

// DOM Elements
let signupForm, loginForm, logoutBtn, resetPasswordForm;
let authErrorElement;

// Initialize auth functionality based on page
document.addEventListener('DOMContentLoaded', () => {
  // Check if we're on signup page
  signupForm = document.getElementById('signup-form');
  if (signupForm) {
    signupForm.addEventListener('submit', handleSignup);
  }

  // Check if we're on login page
  loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }

  // Check for logout button (on authenticated pages)
  logoutBtn = document.querySelector('.logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }

  // Check for reset password form
  resetPasswordForm = document.getElementById('reset-password-form');
  if (resetPasswordForm) {
    resetPasswordForm.addEventListener('submit', handleResetPassword);
  }

  // Auth state observer
  onAuthStateChanged(auth, (user) => {
    if (user) {
      // User is signed in
      const currentPath = window.location.pathname;
      
      // If user is on login or signup page, redirect to dashboard
      if (currentPath === '/login' || currentPath === '/signup' || currentPath === '/') {
        window.location.href = '/dashboard';
      }
    } else {
      // User is signed out
      const currentPath = window.location.pathname;
      
      // If user is on an authenticated page, redirect to login
      if (
        currentPath === '/dashboard' || 
        currentPath === '/transactions' || 
        currentPath === '/insights' || 
        currentPath === '/profile' ||
        currentPath === '/budgeting'
      ) {
        window.location.href = '/login';
      }
    }
  });
});

// Handle signup form submission
async function handleSignup(e) {
  e.preventDefault();

  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;
  const confirmPassword = document.getElementById('signup-confirm-password').value;
  const name = document.getElementById('signup-name').value;

  // Form validation
  if (!email || !password || !confirmPassword || !name) {
    showAuthError('Please fill out all fields');
    return;
  }

  if (password !== confirmPassword) {
    showAuthError('Passwords do not match');
    return;
  }

  if (password.length < 6) {
    showAuthError('Password should be at least 6 characters');
    return;
  }

  try {
    // Create user with email and password
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Create user document in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      name: name,
      email: email,
      createdAt: new Date().toISOString()
    });

    // Create meta document with default values
    await setDoc(doc(db, 'users', user.uid, 'meta', 'profile'), {
      income: {
        amount: 0,
        type: 'monthly',
        currency: 'INR'
      },
      budgets: {}
    });

    // Redirect to dashboard
    window.location.href = '/dashboard';
  } catch (error) {
    console.error('Signup error:', error);
    showAuthError(getAuthErrorMessage(error.code));
  }
}

// Handle login form submission
async function handleLogin(e) {
  e.preventDefault();

  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  // Form validation
  if (!email || !password) {
    showAuthError('Please fill out all fields');
    return;
  }

  try {
    // Sign in with email and password
    await signInWithEmailAndPassword(auth, email, password);
    
    // Redirect happens automatically through onAuthStateChanged
  } catch (error) {
    console.error('Login error:', error);
    showAuthError(getAuthErrorMessage(error.code));
  }
}

// Handle logout
async function handleLogout(e) {
  e.preventDefault();
  
  try {
    await signOut(auth);
    // Redirect happens automatically through onAuthStateChanged
  } catch (error) {
    console.error('Logout error:', error);
    showToast('Error logging out. Please try again.', 'error');
  }
}

// Handle password reset
async function handleResetPassword(e) {
  e.preventDefault();

  const email = document.getElementById('reset-email').value;

  if (!email) {
    showAuthError('Please enter your email');
    return;
  }

  try {
    await sendPasswordResetEmail(auth, email);
    showToast('Password reset email sent! Check your inbox.', 'success');
    
    // Redirect to login page after 3 seconds
    setTimeout(() => {
      window.location.href = '/login';
    }, 3000);
  } catch (error) {
    console.error('Password reset error:', error);
    showAuthError(getAuthErrorMessage(error.code));
  }
}

// Show auth error message
function showAuthError(message) {
  authErrorElement = document.querySelector('.auth-error');
  if (authErrorElement) {
    authErrorElement.textContent = message;
    authErrorElement.classList.add('show');
    
    // Hide error after 5 seconds
    setTimeout(() => {
      authErrorElement.classList.remove('show');
    }, 5000);
  } else {
    // Fallback to toast if auth error element not found
    showToast(message, 'error');
  }
}

// Get human-readable error message from Firebase error code
function getAuthErrorMessage(errorCode) {
  switch (errorCode) {
    case 'auth/email-already-in-use':
      return 'This email is already registered. Try logging in instead.';
    case 'auth/invalid-email':
      return 'Invalid email format.';
    case 'auth/user-not-found':
      return 'No account found with this email. Please sign up.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/weak-password':
      return 'Password is too weak. Please use a stronger password.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    default:
      return 'An error occurred. Please try again.';
  }
}

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

// Export auth functions for use in other modules
export { 
  auth,
  handleSignup, 
  handleLogin, 
  handleLogout, 
  showToast
};
