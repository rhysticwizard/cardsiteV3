import { getCurrentUser, updatePost } from '../utils/storage.js';

/**
 * Post Component
 * Represents a single post in the forum
 */
class Post {
    constructor(postData) {
        this.id = postData.id;
        this.title = postData.title;
        this.author = postData.author;
        this.content = postData.content;
        this.upvotes = postData.upvotes || 0;
        this.comments = postData.comments || 0;
        this.category = postData.category;
        this.timestamp = postData.timestamp;
        this.element = null;
    }
    
    /**
     * Formats the post date
     * @returns {string} Formatted date string
     */
    getFormattedDate() {
        const postDate = new Date(this.timestamp);
        return postDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
    
    /**
     * Creates the DOM element for this post
     * @returns {HTMLElement} The post element
     */
    render() {
        const postElement = document.createElement('div');
        postElement.classList.add('post-card');
        postElement.dataset.id = this.id;
        
        postElement.innerHTML = `
            <div class="post-card-header">
                <div>
                    <h3 class="post-card-title">${this.title}</h3>
                    <p class="post-card-author">Posted by ${this.author} on ${this.getFormattedDate()} in ${this.category}</p>
                </div>
                <div class="post-card-meta">
                    <div class="post-card-upvotes">
                        <i class="fas fa-arrow-up"></i>
                        <span class="upvote-count">${this.upvotes}</span>
                    </div>
                    <div class="post-card-comments">
                        <i class="fas fa-comment"></i>
                        <span class="comments-count">${this.comments}</span>
                    </div>
                </div>
            </div>
            <div class="post-card-content">
                <p>${this.content}</p>
            </div>
            <div class="post-card-actions">
                <button class="upvote-btn">Upvote</button>
                <button class="comment-btn">Comment</button>
            </div>
        `;
        
        this.element = postElement;
        this.attachEventListeners();
        return postElement;
    }
    
    /**
     * Attaches event listeners to the post's buttons
     */
    attachEventListeners() {
        if (!this.element) return;
        
        const upvoteBtn = this.element.querySelector('.upvote-btn');
        const commentBtn = this.element.querySelector('.comment-btn');
        
        upvoteBtn.addEventListener('click', () => this.handleUpvote());
        commentBtn.addEventListener('click', () => this.handleComment());
    }
    
    /**
     * Handles the upvote button click
     */
    handleUpvote() {
        const currentUser = getCurrentUser();
        
        if (!currentUser) {
            alert('Please log in to upvote posts');
            this.openLoginModal();
            return;
        }
        
        this.upvotes++;
        this.element.querySelector('.upvote-count').textContent = this.upvotes;
        
        // Update in storage
        this.updatePostInStorage();
    }
    
    /**
     * Handles the comment button click
     */
    handleComment() {
        const currentUser = getCurrentUser();
        
        if (!currentUser) {
            alert('Please log in to comment on posts');
            this.openLoginModal();
            return;
        }
        
        // For now, just increment comment count
        // In a real app, we would open a comment form
        this.comments++;
        this.element.querySelector('.comments-count').textContent = this.comments;
        
        // Update in storage
        this.updatePostInStorage();
    }
    
    /**
     * Updates this post in localStorage
     */
    updatePostInStorage() {
        const postData = {
            id: this.id,
            title: this.title,
            author: this.author,
            content: this.content,
            upvotes: this.upvotes,
            comments: this.comments,
            category: this.category,
            timestamp: this.timestamp
        };
        
        updatePost(postData);
    }
    
    /**
     * Opens the login modal
     */
    openLoginModal() {
        const loginModal = document.getElementById('login-modal');
        if (loginModal) {
            loginModal.style.display = 'block';
        }
    }
}

// Export the Post class
export default Post; 