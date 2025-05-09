// Import components and utilities
import Post from './components/Post.js';
import * as Storage from './utils/storage.js';

// DOM Elements
const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn');
const newPostBtn = document.getElementById('new-post-btn');
const loginModal = document.getElementById('login-modal');
const signupModal = document.getElementById('signup-modal');
const newPostModal = document.getElementById('new-post-modal');
const closeBtns = document.querySelectorAll('.close');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const newPostForm = document.getElementById('new-post-form');
const postsList = document.getElementById('posts-list');

// Sample data for initial posts
const samplePosts = [
    {
        id: 1,
        title: 'New card expansion announced!',
        author: 'CardMaster42',
        content: 'Just heard that the new expansion will be released next month. Anyone excited about the new dragon cards?',
        upvotes: 24,
        comments: 7,
        category: 'Card Reveals',
        timestamp: '2023-04-15T10:30:00'
    },
    {
        id: 2,
        title: 'Strategy guide for beginners',
        author: 'NewbHelper',
        content: 'I\'ve put together a comprehensive guide for new players. Check it out and let me know what you think!',
        upvotes: 18,
        comments: 3,
        category: 'Strategy & Deck Building',
        timestamp: '2023-04-14T15:45:00'
    },
    {
        id: 3,
        title: 'Trading my rare collectibles',
        author: 'Collector99',
        content: 'I have some rare cards from the first edition that I\'m looking to trade. DM me if interested!',
        upvotes: 5,
        comments: 12,
        category: 'Trading',
        timestamp: '2023-04-13T08:20:00'
    }
];

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Initialize posts
    initializePosts();
    
    // Modal event listeners
    loginBtn.addEventListener('click', () => openModal(loginModal));
    signupBtn.addEventListener('click', () => openModal(signupModal));
    newPostBtn.addEventListener('click', () => {
        if (Storage.getCurrentUser()) {
            openModal(newPostModal);
        } else {
            alert('Please log in to create a post');
            openModal(loginModal);
        }
    });
    
    closeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            closeAllModals();
        });
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === loginModal || event.target === signupModal || event.target === newPostModal) {
            closeAllModals();
        }
    });
    
    // Form submissions
    loginForm.addEventListener('submit', handleLogin);
    signupForm.addEventListener('submit', handleSignup);
    newPostForm.addEventListener('submit', handleNewPost);
    
    // Update UI based on user status
    updateUIForUser();
});

// Functions
function initializePosts() {
    let posts = Storage.getPosts();
    
    // If no posts in storage, use sample posts
    if (posts.length === 0) {
        Storage.savePosts(samplePosts);
        posts = samplePosts;
    }
    
    // Render posts
    renderPosts(posts);
}

function renderPosts(posts) {
    postsList.innerHTML = '';
    
    posts.forEach(postData => {
        // Use the Post component
        const post = new Post(postData);
        const postElement = post.render();
        postsList.appendChild(postElement);
    });
}

function openModal(modal) {
    closeAllModals();
    modal.style.display = 'block';
}

function closeAllModals() {
    loginModal.style.display = 'none';
    signupModal.style.display = 'none';
    newPostModal.style.display = 'none';
}

function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    
    const users = Storage.getUsers();
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        // Store current user (excluding password for security)
        const currentUser = {
            username: user.username,
            email: user.email
        };
        Storage.setCurrentUser(currentUser);
        
        // Update UI
        updateUIForUser();
        closeAllModals();
        loginForm.reset();
    } else {
        alert('Invalid username or password');
    }
}

function handleSignup(event) {
    event.preventDefault();
    
    const username = document.getElementById('signup-username').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm').value;
    
    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }
    
    // Add new user
    const newUser = {
        username,
        email,
        password
    };
    
    try {
        // This will throw if username exists
        const user = Storage.addUser(newUser);
        
        // Log in the new user
        Storage.setCurrentUser(user);
        
        // Update UI
        updateUIForUser();
        closeAllModals();
        signupForm.reset();
    } catch (error) {
        alert(error.message);
    }
}

function handleNewPost(event) {
    event.preventDefault();
    
    const title = document.getElementById('post-title').value;
    const category = document.getElementById('post-category').value;
    const content = document.getElementById('post-content').value;
    
    const currentUser = Storage.getCurrentUser();
    
    if (!currentUser) {
        alert('You must be logged in to create a post');
        closeAllModals();
        openModal(loginModal);
        return;
    }
    
    // Create new post
    const categoryText = document.querySelector(`#post-category option[value="${category}"]`).textContent;
    const newPost = Storage.addPost({
        title,
        author: currentUser.username,
        content,
        category: categoryText
    });
    
    // Render all posts again (could optimize to just add the new one)
    renderPosts(Storage.getPosts());
    
    // Close modal and reset form
    closeAllModals();
    newPostForm.reset();
}

function updateUIForUser() {
    const currentUser = Storage.getCurrentUser();
    
    if (currentUser) {
        // User is logged in
        loginBtn.textContent = currentUser.username;
        signupBtn.textContent = 'Logout';
        signupBtn.removeEventListener('click', () => openModal(signupModal));
        signupBtn.addEventListener('click', handleLogout);
    } else {
        // User is logged out
        loginBtn.textContent = 'Log In';
        signupBtn.textContent = 'Sign Up';
        signupBtn.removeEventListener('click', handleLogout);
        signupBtn.addEventListener('click', () => openModal(signupModal));
    }
}

function handleLogout() {
    Storage.clearCurrentUser();
    updateUIForUser();
} 