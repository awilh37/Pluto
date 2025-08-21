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
const auth = getAuth(app);
const db = getFirestore(app);

console.log("Firebase initialized successfully with Auth and Firestore!");

let currentUserData = null;

// --- DOM Elements ---
const notificationContainer = document.getElementById('notification-container');
const authWrapper = document.getElementById('auth-wrapper');
const appContainer = document.getElementById('app-container');
const signupForm = document.getElementById('signup-form');
const loginForm = document.getElementById('login-form');
const logoutButton = document.getElementById('logout-button');
const userInfo = document.getElementById('user-info');
const scheduleContainer = document.getElementById('schedule-container');
const scheduleDisplay = document.getElementById('schedule-display');
const addScheduleContainer = document.getElementById('add-schedule-container');
const homeLink = document.getElementById('home-link');
const profileLink = document.getElementById('profile-link');
const addScheduleButton = document.getElementById('add-schedule-button');

// Profile Modal Elements
const profileModal = document.getElementById('profile-modal');
const modalCloseButton = document.getElementById('modal-close-button');
const profileName = document.getElementById('profile-name');
const profileEmail = document.getElementById('profile-email');
const profileGrade = document.getElementById('profile-grade');
const editProfileButton = document.getElementById('edit-profile-button');
const profileView = document.getElementById('profile-view');
const profileEdit = document.getElementById('profile-edit');
const profileEditForm = document.getElementById('profile-edit-form');
const cancelEditButton = document.getElementById('cancel-edit-button');

// --- UI Helpers ---
let notificationTimeout;
function showNotification(message, type = 'success') {
    if (notificationTimeout) clearTimeout(notificationTimeout);
    notificationContainer.textContent = message;
    notificationContainer.className = 'show';
    notificationContainer.classList.add(type);
    notificationTimeout = setTimeout(() => {
        notificationContainer.classList.remove('show');
    }, 3000);
}

// --- Modal Controls ---
function openProfileModal() {
    console.log("Opening profile modal...");
    profileModal.classList.add('show');
}

function closeProfileModal() {
    console.log("Closing profile modal...");
    profileModal.classList.remove('show');
    // Reset to view mode when closing, ensuring it's not stuck in edit mode next time
    profileEdit.classList.add('hidden');
    profileView.classList.remove('hidden');
}

// --- Navigation Listeners ---
homeLink.addEventListener('click', (e) => {
    e.preventDefault();
    console.log('Home link clicked. No action needed.');
});

profileLink.addEventListener('click', (e) => {
    e.preventDefault();
    console.log('Profile link clicked.');
    openProfileModal();
});

addScheduleButton.addEventListener('click', (e) => {
    e.preventDefault();
    console.log('Add schedule button clicked.');
    openProfileModal();
});

modalCloseButton.addEventListener('click', closeProfileModal);
profileModal.addEventListener('click', (e) => {
    // Closes the modal if user clicks on the backdrop
    if (e.target === profileModal) {
        closeProfileModal();
    }
});


// --- Profile Page Logic ---
editProfileButton.addEventListener('click', () => {
    if (!currentUserData) return;
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

    const updatedData = {
        grade: document.getElementById('profile-grade-edit').value,
        profilePic: document.getElementById('profile-pic-edit').value,
        // Schedule is no longer editable in this form
    };

    try {
        const userDocRef = doc(db, 'users', auth.currentUser.uid);
        await updateDoc(userDocRef, updatedData);

        // Manually update the view and the currentUserData variable
        currentUserData = { ...currentUserData, ...updatedData };
        profileGrade.textContent = updatedData.grade || 'Not set';

        showNotification('Profile updated successfully!');
        closeProfileModal();
    } catch (error) {
        console.error('Error updating profile:', error);
        showNotification('Failed to update profile.', 'error');
    }
});

// --- Auth Logic ---
signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const signupName = document.getElementById('signup-name').value;
    const signupEmail = document.getElementById('signup-email').value;
    const signupPassword = document.getElementById('signup-password').value;

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, signupEmail, signupPassword);
        const user = userCredential.user;
        await setDoc(doc(db, "users", user.uid), { name: signupName, email: signupEmail });
        showNotification('Sign up successful!');
        signupForm.reset();
    } catch (error) {
        console.error("Error signing up:", error);
        showNotification(error.message, 'error');
    }
});

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const loginEmail = document.getElementById('login-email').value;
    const loginPassword = document.getElementById('login-password').value;

    try {
        await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
        showNotification('Login successful!');
        loginForm.reset();
    } catch (error) {
        console.error("Error logging in:", error);
        showNotification(error.message, 'error');
    }
});

logoutButton.addEventListener('click', async () => {
    try {
        await signOut(auth);
        showNotification('Logout successful!');
    } catch (error) {
        showNotification(error.message, 'error');
    }
});

onAuthStateChanged(auth, async (user) => {
    if (user) {
        authWrapper.style.display = 'none';
        appContainer.classList.remove('hidden');
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
        authWrapper.style.display = 'flex';
        appContainer.classList.add('hidden');
        userInfo.textContent = '';
        currentUserData = null;
    }
});
