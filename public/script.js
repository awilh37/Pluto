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
const authWrapper = document.getElementById('auth-wrapper');
const appContainer = document.getElementById('app-container');
const signupForm = document.getElementById('signup-form');
const loginForm = document.getElementById('login-form');
const logoutButton = document.getElementById('logout-button');
const userInfo = document.getElementById('user-info');
const scheduleContainer = document.getElementById('schedule-container');
const scheduleDisplay = document.getElementById('schedule-display');
const addScheduleContainer = document.getElementById('add-schedule-container');

// Navigation Elements
const homeLink = document.getElementById('home-link');
const profileLink = document.getElementById('profile-link');
const addScheduleButton = document.getElementById('add-schedule-button');

// Page Containers
const landingPage = document.getElementById('landing-page');
const profilePage = document.getElementById('profile-page');
const pages = document.querySelectorAll('.page-content');

// --- Navigation ---
function showPage(pageId) {
    // By default, show the landing page when a user is logged in.
    if (!pageId) {
        pageId = 'landing-page';
    }

    pages.forEach(page => {
        if (page.id === pageId) {
            page.classList.remove('hidden');
        } else {
            page.classList.add('hidden');
        }
    });
}

homeLink.addEventListener('click', (e) => {
    e.preventDefault();
    showPage('landing-page');
});

profileLink.addEventListener('click', (e) => {
    e.preventDefault();
    showPage('profile-page');
});

addScheduleButton.addEventListener('click', (e) => {
    e.preventDefault();
    showPage('profile-page');
});

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
        authWrapper.classList.add('hidden');
        appContainer.classList.remove('hidden');
        showPage('landing-page');

        // Fetch user's full data from Firestore
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            const userData = userDoc.data();
            userInfo.textContent = `Welcome, ${userData.name}`;

            // Check for schedule
            if (userData.schedule) {
                scheduleContainer.classList.remove('hidden');
                addScheduleContainer.classList.add('hidden');
                // Display schedule (simple for now)
                scheduleDisplay.innerHTML = '<pre>' + JSON.stringify(userData.schedule, null, 2) + '</pre>';
            } else {
                scheduleContainer.classList.add('hidden');
                addScheduleContainer.classList.remove('hidden');
            }
        } else {
            // This case can happen for a user who was created but Firestore doc creation failed.
            userInfo.textContent = `Welcome, ${user.email}`;
            scheduleContainer.classList.add('hidden');
            addScheduleContainer.classList.remove('hidden');
        }

    } else {
        // User is signed out.
        authWrapper.classList.remove('hidden');
        appContainer.classList.add('hidden');
        userInfo.textContent = '';
    }
});
