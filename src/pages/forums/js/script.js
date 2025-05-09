// Forum script file
// Placeholder for future JavaScript functionality

document.addEventListener('DOMContentLoaded', () => {
    console.log('Forum page loaded and script running.');
    
    // Handle voting on posts
    setupVoting();
    
    // Handle expanding rules in sidebar
    setupRuleExpansion();
    
    // Handle filter buttons
    setupFilters();
    
    // Get category from URL if on community page
    setupCommunityPage();
    
    // DEBUG: Check if filter buttons exist
    const filterButtons = document.querySelectorAll('.filter-btn');
    console.log('Found filter buttons:', filterButtons.length);
    filterButtons.forEach(btn => console.log('Button text:', btn.textContent.trim()));
});

function setupVoting() {
    // Find all vote controls
    const voteButtons = document.querySelectorAll('.upvote, .downvote');
    
    voteButtons.forEach(button => {
        button.addEventListener('click', function() {
            const voteControls = this.closest('.vote-controls');
            const voteCount = voteControls.querySelector('.vote-count');
            const currentCount = parseInt(voteCount.textContent);
            
            // Remove any previous active state
            voteControls.querySelectorAll('button').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Toggle active state and update count
            if (this.classList.contains('active')) {
                // If already active, remove vote
                this.classList.remove('active');
                voteCount.textContent = this.classList.contains('upvote') 
                    ? currentCount - 1 
                    : currentCount + 1;
            } else {
                // Add active state
                this.classList.add('active');
                
                // Set color to white (previously might have been blue)
                this.style.color = '#fff';
                
                // Update vote count
                if (this.classList.contains('upvote')) {
                    voteCount.textContent = currentCount + 1;
                } else {
                    voteCount.textContent = currentCount - 1;
                }
            }
        });
    });
}

function setupRuleExpansion() {
    // Find all rule expansion buttons
    const expandButtons = document.querySelectorAll('.expand-rule');
    
    expandButtons.forEach(button => {
        button.addEventListener('click', function() {
            const rule = this.closest('.rule');
            rule.classList.toggle('expanded');
            
            // Toggle icon
            const icon = this.querySelector('i');
            if (rule.classList.contains('expanded')) {
                icon.classList.remove('fa-chevron-down');
                icon.classList.add('fa-chevron-up');
            } else {
                icon.classList.remove('fa-chevron-up');
                icon.classList.add('fa-chevron-down');
            }
        });
    });
}

function setupFilters() {
    // Find all filter buttons
    const filterButtons = document.querySelectorAll('.filter-btn');
    console.log('Setting up filters, found buttons:', filterButtons.length);
    
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            console.log('Filter button clicked:', this.textContent.trim());
            
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Get the filter type from the button text
            const filterType = this.textContent.trim().toLowerCase();
            console.log('Filter type:', filterType);
            
            // Apply the filter
            filterPosts(filterType);
        });
    });
    
    // Initial filter (default is "Hot")
    console.log('Applying initial "hot" filter');
    filterPosts('hot');
}

function filterPosts(filterType) {
    console.log('filterPosts called with type:', filterType);
    
    // Get all posts
    const postsList = document.querySelector('.posts-list');
    console.log('Found posts list element:', postsList !== null);
    
    const posts = Array.from(postsList.querySelectorAll('.post-item'));
    console.log('Found post items:', posts.length);
    
    // Sort posts based on filter type
    if (filterType === 'hot') {
        // Hot: Sort by a combination of vote count and recency (using post item order as proxy for recency)
        posts.sort((a, b) => {
            const aVotes = parseInt(a.querySelector('.vote-count').textContent);
            const bVotes = parseInt(b.querySelector('.vote-count').textContent);
            const aIndex = posts.indexOf(a);
            const bIndex = posts.indexOf(b);
            
            // Formula: votes + recency bonus (smaller index = more recent)
            const aHotScore = aVotes + (posts.length - aIndex) * 5;
            const bHotScore = bVotes + (posts.length - bIndex) * 5;
            
            return bHotScore - aHotScore;
        });
    } else if (filterType === 'new') {
        // New: Sort by post time (using metadata)
        posts.sort((a, b) => {
            // Extract "X days ago" from the post meta text
            const aTimeText = a.querySelector('.post-meta').textContent;
            const bTimeText = b.querySelector('.post-meta').textContent;
            
            // Extract days ago
            const aDaysAgo = extractDaysAgo(aTimeText);
            const bDaysAgo = extractDaysAgo(bTimeText);
            
            // Sort from newest to oldest
            return aDaysAgo - bDaysAgo;
        });
    } else if (filterType === 'top') {
        // Top: Sort by vote count
        posts.sort((a, b) => {
            const aVotes = parseInt(a.querySelector('.vote-count').textContent);
            const bVotes = parseInt(b.querySelector('.vote-count').textContent);
            
            return bVotes - aVotes;
        });
    }
    
    // Remove existing posts from the DOM
    posts.forEach(post => post.remove());
    
    // Append sorted posts back to the list
    posts.forEach(post => postsList.appendChild(post));
    
    // Log the current sorting
    console.log(`Posts sorted by: ${filterType}`);
}

function extractDaysAgo(timeText) {
    const match = timeText.match(/(\d+) days? ago/);
    if (match && match[1]) {
        return parseInt(match[1]);
    }
    return 0;
}

function setupCommunityPage() {
    // Check if we're on a community page
    const params = new URLSearchParams(window.location.search);
    const category = params.get('category');
    
    if (category) {
        console.log('Viewing category:', category);
        // In a real app, this would load the specific community data
        
        // Update the page title based on category
        document.title = `${getCategoryTitle(category)} - CardSite V2`;
        
        // Set the community icon and name
        const communityIcon = document.querySelector('.community-icon i');
        const communityName = document.querySelector('.community-name');
        
        if (communityName) {
            communityName.textContent = getCategoryTitle(category);
        }
        
        if (communityIcon) {
            communityIcon.className = getCategoryIcon(category);
        }
    }
}

function getCategoryTitle(category) {
    const categories = {
        'general': 'General Discussion',
        'strategy': 'Strategy & Gameplay',
        'decks': 'Deck Building',
        'rules': 'Rules & Rulings'
    };
    
    return categories[category] || 'Community';
}

function getCategoryIcon(category) {
    const icons = {
        'general': 'fa fa-comments',
        'strategy': 'fa fa-chess',
        'decks': 'fa fa-layer-group',
        'rules': 'fa fa-book'
    };
    
    return icons[category] || 'fa fa-users';
} 