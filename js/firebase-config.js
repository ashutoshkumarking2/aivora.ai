// Firebase SDK Modules Import
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getAuth, 
    GoogleAuthProvider, 
    signInWithPopup, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    sendPasswordResetEmail, 
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAAzgs-nn0RSOCURftTYKjCPpUsqiMH3vM",
    authDomain: "ecommerce-website-ff5d1.firebaseapp.com",
    projectId: "ecommerce-website-ff5d1",
    storageBucket: "ecommerce-website-ff5d1.firebasestorage.app",
    messagingSenderId: "658375545234",
    appId: "1:658375545234:web:5036452a8e9979788ff14b",
    measurementId: "G-R14RG1BRKV"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
const auth = getAuth(app);

// Initialize Google Auth Provider
const googleProvider = new GoogleAuthProvider();

// Export required modules for auth.js
export { 
    auth, 
    googleProvider, 
    signInWithPopup, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    sendPasswordResetEmail, 
    signOut, 
    onAuthStateChanged 
};