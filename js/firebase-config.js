const firebaseConfig = {
  apiKey: "AIzaSyCEYNUiuWzlLTEiDj3K4DG7g_ACahdHCb4",
  authDomain: "expense-tracker-18426.firebaseapp.com",
  projectId: "expense-tracker-18426",
  storageBucket: "expense-tracker-18426.firebasestorage.app",
  messagingSenderId: "86199323923",
  appId: "1:86199323923:web:13bfb20462d8fec901dee6",
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

window.auth = auth;
window.db = db;
