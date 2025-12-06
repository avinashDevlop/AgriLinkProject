// firebase.js

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth"; // <-- REQUIRED for phone login

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAVlD5yzefdPfqkgmbMzmFH_JMyZEPT-z8",
  authDomain: "argilink.firebaseapp.com",
  databaseURL: "https://argilink-default-rtdb.firebaseio.com",
  projectId: "argilink",
  storageBucket: "argilink.firebasestorage.app",
  messagingSenderId: "581424374010",
  appId: "1:581424374010:web:29d09c37aab3cd40c32943",
  measurementId: "G-P9YDR48T2N"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth (THIS WAS MISSING)
const auth = getAuth(app);

// Export what LoginScreen needs
export { auth, firebaseConfig };
