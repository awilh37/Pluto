// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-analytics.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDXbA0GRCEbsVTqMJ752_MjoebJbSCGqyM",
  authDomain: "pluto-350a2.firebaseapp.com",
  projectId: "pluto-350a2",
  storageBucket: "pluto-350a2.firebasestorage.app",
  messagingSenderId: "88359692401",
  appId: "1:88359692401:web:1960aa77336a4db7e093d0",
  measurementId: "G-Y9FB3B078J"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

console.log("Firebase initialized successfully with Auth and Firestore!");

// --- DOM Elements ---
const authContainer = document.getElementById('auth-container');
const appContainer = document.getElementById('app-container');
const signupForm = document.getElementById('signup-form');
const loginForm = document.getElementById('login-form');
const logoutButton = document.getElementById('logout-button');
const userInfo = document.getElementById('user-info');

// --- Sign Up ---
signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const signupName = document.getElementById('signup-name').value;
    const signupEmail = document.getElementById('signup-email').value;
    const signupPassword = document.getElementById('signup-password').value;

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, signupEmail, signupPassword);
        const user = userCredential.user;

        // Add user's name to Firestore
        await setDoc(doc(db, "users", user.uid), {
            name: signupName,
            email: signupEmail,
        });

        alert('Sign up successful!');
        signupForm.reset();
    } catch (error) {
        console.error("Error signing up:", error);
        alert(error.message);
    }
});

// --- Login ---
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const loginEmail = document.getElementById('login-email').value;
    const loginPassword = document.getElementById('login-password').value;

    try {
        await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
        alert('Login successful!');
        loginForm.reset();
    } catch (error) {
        console.error("Error logging in:", error);
        alert(error.message);
    }
});

// --- Logout ---
logoutButton.addEventListener('click', async () => {
    try {
        await signOut(auth);
        alert('Logout successful!');
    } catch (error) {
        console.error("Error signing out:", error);
        alert(error.message);
    }
});

// --- Auth State Change ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // User is signed in.
        authContainer.classList.add('hidden');
        appContainer.classList.remove('hidden');

        // Fetch user's name from Firestore
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
            userInfo.textContent = `Welcome, ${userDoc.data().name}`;
        } else {
            userInfo.textContent = `Welcome, ${user.email}`;
        }

    } else {
        // User is signed out.
        authContainer.classList.remove('hidden');
        appContainer.classList.add('hidden');
        userInfo.textContent = '';
    }
});
