// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-analytics.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

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

let currentUserData = null; // To hold the current user's data

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

// Profile Page Elements
const profileName = document.getElementById('profile-name');
const profileEmail = document.getElementById('profile-email');
const profileGrade = document.getElementById('profile-grade');
const editProfileButton = document.getElementById('edit-profile-button');
const profileView = document.getElementById('profile-view');
const profileEdit = document.getElementById('profile-edit');
const profileEditForm = document.getElementById('profile-edit-form');
const cancelEditButton = document.getElementById('cancel-edit-button');

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

// --- Profile Page ---
editProfileButton.addEventListener('click', () => {
    if (!currentUserData) return;

    // Pre-fill the edit form
    document.getElementById('profile-grade-edit').value = currentUserData.grade || '';
    document.getElementById('profile-pic-edit').value = currentUserData.profilePic || '';
    document.getElementById('schedule-edit').value = currentUserData.schedule ? JSON.stringify(currentUserData.schedule, null, 2) : '';

    profileView.classList.add('hidden');
    profileEdit.classList.remove('hidden');
});

cancelEditButton.addEventListener('click', () => {
    profileEdit.classList.add('hidden');
    profileView.classList.remove('hidden');
});

profileEditForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    const scheduleString = document.getElementById('schedule-edit').value;
    let scheduleData = null;
    if (scheduleString) {
        try {
            scheduleData = JSON.parse(scheduleString);
        } catch (error) {
            alert('Invalid JSON in schedule. Please correct it and try again.');
            return;
        }
    }

    const updatedData = {
        grade: document.getElementById('profile-grade-edit').value,
        profilePic: document.getElementById('profile-pic-edit').value,
        schedule: scheduleData,
    };

    try {
        const userDocRef = doc(db, 'users', auth.currentUser.uid);
        await updateDoc(userDocRef, updatedData);

        // Manually update the view and the currentUserData variable
        currentUserData = { ...currentUserData, ...updatedData };
        profileGrade.textContent = updatedData.grade || 'Not set';
        if (updatedData.schedule) {
            scheduleContainer.classList.remove('hidden');
            addScheduleContainer.classList.add('hidden');
            scheduleDisplay.innerHTML = '<pre>' + JSON.stringify(updatedData.schedule, null, 2) + '</pre>';
        } else {
            scheduleContainer.classList.add('hidden');
            addScheduleContainer.classList.remove('hidden');
        }

        alert('Profile updated successfully!');
        profileEdit.classList.add('hidden');
        profileView.classList.remove('hidden');

    } catch (error) {
        console.error('Error updating profile:', error);
        alert('Failed to update profile.');
    }
});

// --- Auth ---
signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const signupName = document.getElementById('signup-name').value;
    const signupEmail = document.getElementById('signup-email').value;
    const signupPassword = document.getElementById('signup-password').value;

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, signupEmail, signupPassword);
        const user = userCredential.user;

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

logoutButton.addEventListener('click', async () => {
    try {
        await signOut(auth);
        alert('Logout successful!');
    } catch (error) {
        console.error("Error signing out:", error);
        alert(error.message);
    }
});

onAuthStateChanged(auth, async (user) => {
    if (user) {
        authWrapper.classList.add('hidden');
        appContainer.classList.remove('hidden');
        showPage('landing-page');

        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            currentUserData = userDoc.data();
            const userData = currentUserData;
            userInfo.textContent = `Welcome, ${userData.name}`;

            if (userData.schedule) {
                scheduleContainer.classList.remove('hidden');
                addScheduleContainer.classList.add('hidden');
                scheduleDisplay.innerHTML = '<pre>' + JSON.stringify(userData.schedule, null, 2) + '</pre>';
            } else {
                scheduleContainer.classList.add('hidden');
                addScheduleContainer.classList.remove('hidden');
            }

            profileName.textContent = userData.name;
            profileEmail.textContent = userData.email;
            profileGrade.textContent = userData.grade || 'Not set';
        } else {
            userInfo.textContent = `Welcome, ${user.email}`;
            scheduleContainer.classList.add('hidden');
            addScheduleContainer.classList.remove('hidden');
        }

    } else {
        authWrapper.classList.remove('hidden');
        appContainer.classList.add('hidden');
        userInfo.textContent = '';
        currentUserData = null;
    }
});
