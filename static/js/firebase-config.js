// Firebase SDK import
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

// Firebase configuration from the environment variables
const firebaseConfig = {
  apiKey: window.FIREBASE_API_KEY,
  authDomain: `${window.FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: window.FIREBASE_PROJECT_ID,
  storageBucket: `${window.FIREBASE_PROJECT_ID}.appspot.com`,
  messagingSenderId: "",
  appId: window.FIREBASE_APP_ID
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and Firestore
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
