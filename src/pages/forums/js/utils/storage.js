/**
 * Storage utility functions
 * Handles all localStorage operations
 */

// Storage keys
export const POSTS_STORAGE_KEY = 'forum_posts';
export const USERS_STORAGE_KEY = 'forum_users';
export const CURRENT_USER_KEY = 'current_user';

/**
 * Gets posts from localStorage
 * @returns {Array} Array of post objects
 */
export function getPosts() {
    const storedPosts = localStorage.getItem(POSTS_STORAGE_KEY);
    return storedPosts ? JSON.parse(storedPosts) : [];
}

/**
 * Saves posts to localStorage
 * @param {Array} posts Array of post objects
 */
export function savePosts(posts) {
    localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(posts));
}

/**
 * Gets users from localStorage
 * @returns {Array} Array of user objects
 */
export function getUsers() {
    const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
    return storedUsers ? JSON.parse(storedUsers) : [];
}

/**
 * Saves users to localStorage
 * @param {Array} users Array of user objects
 */
export function saveUsers(users) {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

/**
 * Gets current logged in user
 * @returns {Object|null} User object or null if not logged in
 */
export function getCurrentUser() {
    const currentUser = localStorage.getItem(CURRENT_USER_KEY);
    return currentUser ? JSON.parse(currentUser) : null;
}

/**
 * Sets current logged in user
 * @param {Object} user User object (username, email)
 */
export function setCurrentUser(user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
}

/**
 * Clears current user (logout)
 */
export function clearCurrentUser() {
    localStorage.removeItem(CURRENT_USER_KEY);
}

/**
 * Adds a new post to storage
 * @param {Object} postData Post data object
 * @returns {Object} The saved post with ID
 */
export function addPost(postData) {
    const posts = getPosts();
    
    const newPost = {
        id: Date.now(), // Use timestamp as ID
        ...postData,
        upvotes: 0,
        comments: 0,
        timestamp: new Date().toISOString()
    };
    
    posts.unshift(newPost);
    savePosts(posts);
    
    return newPost;
}

/**
 * Updates an existing post
 * @param {Object} updatedPost Post object with id
 * @returns {boolean} True if post was updated successfully
 */
export function updatePost(updatedPost) {
    const posts = getPosts();
    const index = posts.findIndex(p => p.id == updatedPost.id);
    
    if (index !== -1) {
        posts[index] = updatedPost;
        savePosts(posts);
        return true;
    }
    
    return false;
}

/**
 * Adds a new user
 * @param {Object} userData User data object (username, email, password)
 * @returns {Object} The saved user (without password)
 */
export function addUser(userData) {
    const users = getUsers();
    
    // Check if username already exists
    if (users.some(u => u.username === userData.username)) {
        throw new Error('Username already exists');
    }
    
    users.push(userData);
    saveUsers(users);
    
    // Return user without password
    const { password, ...userWithoutPassword } = userData;
    return userWithoutPassword;
} 