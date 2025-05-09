// Community page specific script

document.addEventListener('DOMContentLoaded', function() {
    console.log('Community page loaded');
    
    // Set up filter buttons
    setupFilters();
    
    // Set up hearts
    setupHearts();
});

// Handle filter buttons (New, Top)
function setupFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    console.log('Found filter buttons:', filterButtons.length);
    
    filterButtons.forEach(function(button) {
        button.addEventListener('click', function() {
            // Visual feedback - update active state
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Get filter type from button text
            const filterType = this.textContent.trim().toLowerCase();
            console.log('Filtering by:', filterType);
            
            // Sort posts based on filter type
            sortPosts(filterType);
        });
    });
    
    // Apply default sorting (New)
    sortPosts('new');
}

// Sort posts based on filter type
function sortPosts(filterType) {
    // Get posts container and all posts
    const postsContainer = document.querySelector('.posts-list');
    const posts = Array.from(postsContainer.querySelectorAll('.post-item'));
    
    console.log(`Sorting ${posts.length} posts by ${filterType}`);
    
    // Apply different sorting based on filter type
    if (filterType === 'new') {
        // New: Sort by how recently posted
        posts.sort((a, b) => {
            const aAge = getDaysAgo(a.querySelector('.post-meta').textContent);
            const bAge = getDaysAgo(b.querySelector('.post-meta').textContent);
            
            return aAge - bAge; // Newest first
        });
    } 
    else if (filterType === 'top') {
        // Top: Sort by heart count
        posts.sort((a, b) => {
            const aHearts = parseInt(a.querySelector('.heart-btn').textContent.trim().split(' ')[1]);
            const bHearts = parseInt(b.querySelector('.heart-btn').textContent.trim().split(' ')[1]);
            
            return bHearts - aHearts; // Highest hearts first
        });
    }
    
    // Remove posts from DOM
    posts.forEach(post => post.remove());
    
    // Add sorted posts back
    posts.forEach(post => postsContainer.appendChild(post));
    
    console.log('Posts sorted successfully');
}

// Extract days ago from post metadata
function getDaysAgo(metaText) {
    // Handle "hours ago" format
    const hoursMatch = metaText.match(/(\d+) hours? ago/);
    if (hoursMatch && hoursMatch[1]) {
        return parseInt(hoursMatch[1]) / 24; // Convert hours to fractional days
    }
    
    // Handle "days ago" format
    const daysMatch = metaText.match(/(\d+) days? ago/);
    if (daysMatch && daysMatch[1]) {
        return parseInt(daysMatch[1]);
    }
    
    return 0;
}

// Handle hearts
function setupHearts() {
    const heartButtons = document.querySelectorAll('.heart-btn');
    
    heartButtons.forEach(function(button) {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Toggle active state
            this.classList.toggle('active');
            
            // Update heart count
            const heartText = this.textContent.trim();
            let count = parseInt(heartText.split(' ')[1]);
            
            if (this.classList.contains('active')) {
                // If now active, increment heart count
                count++;
            } else {
                // If now inactive, decrement heart count
                count--;
            }
            
            // Update the displayed count
            this.innerHTML = `<i class="fa fa-heart"></i> ${count}`;
        });
    });
} 