// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, collection, getDocs, addDoc, arrayUnion, arrayRemove, onSnapshot } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

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
let unsubscribeUser = null; // To hold the detachment function for the user's data listener
const defaultPfpUrl = 'https://i.imgur.com/3gZpW5A.png';
let editingClassId = null;

// --- DOM Elements ---
const notificationContainer = document.getElementById('notification-container');
const authWrapper = document.getElementById('auth-wrapper');
const authContainer = document.getElementById('auth-container');
const appContainer = document.getElementById('app-container');
const signupForm = document.getElementById('signup-form');
const loginForm = document.getElementById('login-form');
const logoutButton = document.getElementById('logout-button');
const userInfo = document.getElementById('user-info');
const scheduleContainer = document.getElementById('schedule-container');
const scheduleDisplay = document.getElementById('schedule-display');
const addScheduleContainer = document.getElementById('add-schedule-container');
const homeLink = document.getElementById('home-link');
const myScheduleButton = document.getElementById('my-schedule-button');
const headerPfp = document.getElementById('header-pfp');
const modalPfp = document.getElementById('modal-pfp');
const profileModal = document.getElementById('profile-modal');
const modalCloseButton = document.getElementById('modal-close-button');
const profileNameHeader = document.getElementById('profile-name-header');
const profileName = document.getElementById('profile-name');
const profileEmail = document.getElementById('profile-email');
const profileGrade = document.getElementById('profile-grade');
const editProfileButton = document.getElementById('edit-profile-button');
const profileView = document.getElementById('profile-view');
const profileEdit = document.getElementById('profile-edit');
const profileEditForm = document.getElementById('profile-edit-form');
const cancelEditButton = document.getElementById('cancel-edit-button');
const scheduleModal = document.getElementById('schedule-modal');
const scheduleModalCloseButton = document.getElementById('schedule-modal-close-button');
const scheduleList = document.getElementById('schedule-list');
const addClassButton = document.getElementById('add-class-button');
const addEditModal = document.getElementById('add-edit-modal');
const addEditModalCloseButton = document.getElementById('add-edit-modal-close-button');
const addEditModalTitle = document.getElementById('add-edit-modal-title');
const addEditForm = document.getElementById('add-edit-form');
const classNameInput = document.getElementById('class-name-input');
const teacherNameInput = document.getElementById('teacher-name-input');
const classSuggestions = document.getElementById('class-suggestions');
const teacherSuggestions = document.getElementById('teacher-suggestions');
const addNewClassBtn = document.getElementById('add-new-class-btn');
const addNewTeacherBtn = document.getElementById('add-new-teacher-btn');

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

function renderSchedule(scheduleData) {
    if (scheduleData && scheduleData.length > 0) {
        scheduleContainer.classList.remove('hidden');
        addScheduleContainer.classList.add('hidden');
        scheduleDisplay.innerHTML = '<pre>' + JSON.stringify(scheduleData, null, 2) + '</pre>';
        scheduleList.innerHTML = '';
        scheduleData.forEach(cls => {
            const item = document.createElement('div');
            item.className = 'schedule-item';
            item.innerHTML = `
                <div class="schedule-item-info">
                    <strong>${cls.name}</strong> - ${cls.teacher} <br>
                    <small>${cls.block} Block | ${cls.color} | ${cls.semester}</small>
                </div>
                <div class="schedule-item-actions">
                    <button class="edit-class-btn" data-id="${cls.id}">✏️</button>
                    <button class="remove-class-btn" data-id="${cls.id}">❌</button>
                </div>
            `;
            scheduleList.appendChild(item);
        });
    } else {
        scheduleContainer.classList.add('hidden');
        addScheduleContainer.classList.remove('hidden');
        scheduleList.innerHTML = '<p>You haven\'t added any classes to your schedule yet.</p>';
    }
}

// --- Auth Form Toggle ---
const showSignup = document.getElementById('show-signup');
const showLogin = document.getElementById('show-login');
const loginFormContainer = document.getElementById('login-form-container');
const signupFormContainer = document.getElementById('signup-form-container');
function setAuthContainerHeight() { if (authContainer.classList.contains('show-signup')) { authContainer.style.height = signupFormContainer.scrollHeight + 'px'; } else { authContainer.style.height = loginFormContainer.scrollHeight + 'px'; } }
showSignup.addEventListener('click', (e) => { e.preventDefault(); authContainer.classList.add('show-signup'); setAuthContainerHeight(); });
showLogin.addEventListener('click', (e) => { e.preventDefault(); authContainer.classList.remove('show-signup'); setAuthContainerHeight(); });
window.addEventListener('DOMContentLoaded', setAuthContainerHeight);

// --- Modal Controls ---
function openProfileModal() { profileModal.classList.add('show'); }
function closeProfileModal() { profileModal.classList.remove('show'); profileEdit.classList.add('hidden'); profileView.classList.remove('hidden'); }
function openScheduleModal() { scheduleModal.classList.add('show'); }
function closeScheduleModal() { scheduleModal.classList.remove('show'); }
function openAddEditModal(classData = null) {
    addEditForm.reset();
    if (classData) {
        editingClassId = classData.id;
        addEditModalTitle.textContent = 'Edit Class';
        classNameInput.value = classData.name;
        teacherNameInput.value = classData.teacher;
        document.getElementById('block-select').value = classData.block;
        document.querySelector(`input[name="color"][value="${classData.color}"]`).checked = true;
        document.querySelector(`input[name="semester"][value="${classData.semester}"]`).checked = true;
    } else {
        editingClassId = null;
        addEditModalTitle.textContent = 'Add Class';
    }
    addEditModal.classList.add('show');
}
function closeAddEditModal() { addEditModal.classList.remove('show'); }

// --- Navigation Listeners ---
homeLink.addEventListener('click', (e) => { e.preventDefault(); });
headerPfp.addEventListener('click', openProfileModal);
modalCloseButton.addEventListener('click', closeProfileModal);
profileModal.addEventListener('click', (e) => { if (e.target === profileModal) closeProfileModal(); });
myScheduleButton.addEventListener('click', openScheduleModal);
scheduleModalCloseButton.addEventListener('click', closeScheduleModal);
scheduleModal.addEventListener('click', (e) => { if (e.target === scheduleModal) closeScheduleModal(); });
addClassButton.addEventListener('click', () => openAddEditModal());
addEditModalCloseButton.addEventListener('click', closeAddEditModal);
addEditModal.addEventListener('click', (e) => { if (e.target === addEditModal) closeAddEditModal(); });


// --- Schedule Logic ---
async function populateDatalist(collectionName, datalistElement) {
    try {
        const querySnapshot = await getDocs(collection(db, collectionName));
        datalistElement.innerHTML = '';
        querySnapshot.forEach((doc) => {
            const option = document.createElement('option');
            option.value = doc.data().name;
            datalistElement.appendChild(option);
        });
    } catch (error) {
        console.error(`Error populating datalist for ${collectionName}:`, error);
    }
}
function setupSearchAndAdd(inputElement, buttonElement, collectionName, datalistElement) {
    inputElement.addEventListener('input', () => {
        const value = inputElement.value;
        const options = Array.from(datalistElement.options).map(opt => opt.value);
        buttonElement.classList.toggle('hidden', !value || options.includes(value));
    });
    buttonElement.addEventListener('click', async () => {
        const newValue = inputElement.value.trim();
        if (newValue) {
            try {
                await addDoc(collection(db, collectionName), { name: newValue });
                showNotification(`${collectionName.slice(0, -1)} '${newValue}' added successfully!`);
                await populateDatalist(collectionName, datalistElement);
                buttonElement.classList.add('hidden');
            } catch (error) {
                showNotification(`Error adding new ${collectionName.slice(0, -1)}.`, 'error');
            }
        }
    });
}
function initializeScheduleForm() {
    populateDatalist('courses', classSuggestions);
    populateDatalist('teachers', teacherSuggestions);
    setupSearchAndAdd(classNameInput, addNewClassBtn, 'courses', classSuggestions);
    setupSearchAndAdd(teacherNameInput, addNewTeacherBtn, 'teachers', teacherSuggestions);
}
addEditForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    const newClassData = {
        id: editingClassId || doc(collection(db, 'users')).id,
        name: classNameInput.value,
        teacher: teacherNameInput.value,
        block: document.getElementById('block-select').value,
        color: document.querySelector('input[name="color"]:checked').value,
        semester: document.querySelector('input[name="semester"]:checked').value,
    };
    const userDocRef = doc(db, 'users', auth.currentUser.uid);
    try {
        if (editingClassId) {
            const updatedSchedule = currentUserData.schedule.map(c => c.id === editingClassId ? newClassData : c);
            await updateDoc(userDocRef, { schedule: updatedSchedule });
        } else {
            await updateDoc(userDocRef, { schedule: arrayUnion(newClassData) });
        }
        showNotification(`Class ${editingClassId ? 'updated' : 'added'} successfully!`);
        closeAddEditModal();
    } catch (error) {
        console.error("Error saving class:", error);
        showNotification("Failed to save class.", 'error');
    }
});
scheduleList.addEventListener('click', async (e) => {
    const userDocRef = doc(db, 'users', auth.currentUser.uid);
    if (e.target.classList.contains('remove-class-btn')) {
        const classIdToRemove = e.target.dataset.id;
        const classToRemove = currentUserData.schedule.find(c => c.id === classIdToRemove);
        if (classToRemove) {
            try {
                await updateDoc(userDocRef, { schedule: arrayRemove(classToRemove) });
                showNotification('Class removed successfully!');
            } catch (error) {
                console.error("Error removing class:", error);
                showNotification('Failed to remove class.', 'error');
            }
        }
    }
    if (e.target.classList.contains('edit-class-btn')) {
        const classIdToEdit = e.target.dataset.id;
        const classToEdit = currentUserData.schedule.find(c => c.id === classIdToEdit);
        if (classToEdit) {
            openAddEditModal(classToEdit);
        }
    }
});

// --- Profile Page Logic ---
editProfileButton.addEventListener('click', () => {
    if (!currentUserData) return;
    document.getElementById('profile-grade-edit').value = currentUserData.grade || '';
    document.getElementById('profile-pic-edit').value = currentUserData.profilePic || '';
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
    };
    try {
        const userDocRef = doc(db, 'users', auth.currentUser.uid);
        await updateDoc(userDocRef, updatedData);
        currentUserData = { ...currentUserData, ...updatedData };
        profileGrade.textContent = updatedData.grade || 'Not set';
        headerPfp.src = updatedData.profilePic || defaultPfpUrl;
        modalPfp.src = updatedData.profilePic || defaultPfpUrl;
        showNotification('Profile updated successfully!');
        closeProfileModal();
    } catch (error) {
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
        await setDoc(doc(db, "users", userCredential.user.uid), { name: signupName, email: signupEmail });
        showNotification('Sign up successful!');
        signupForm.reset();
    } catch (error) {
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
    if (unsubscribeUser) {
        unsubscribeUser(); // Detach any previous listener
        unsubscribeUser = null;
    }

    if (user) {
        authWrapper.style.display = 'none';
        appContainer.classList.remove('hidden');
        const userDocRef = doc(db, 'users', user.uid);

        unsubscribeUser = onSnapshot(userDocRef, (doc) => {
            if (doc.exists()) {
                currentUserData = doc.data();
                const userData = currentUserData;
                userInfo.textContent = `Welcome, ${userData.name}`;
                headerPfp.src = userData.profilePic || defaultPfpUrl;
                modalPfp.src = userData.profilePic || defaultPfpUrl;
                profileNameHeader.textContent = userData.name;
                profileName.textContent = userData.name;
                profileEmail.textContent = userData.email;
                profileGrade.textContent = userData.grade || 'Not set';
                renderSchedule(userData.schedule);
            } else {
                userInfo.textContent = `Welcome, ${user.email}`;
                headerPfp.src = defaultPfpUrl;
                modalPfp.src = defaultPfpUrl;
                renderSchedule(null);
            }
        });

        initializeScheduleForm();

    } else {
        authWrapper.style.display = 'flex';
        appContainer.classList.add('hidden');
        userInfo.textContent = '';
        currentUserData = null;
    }
});
