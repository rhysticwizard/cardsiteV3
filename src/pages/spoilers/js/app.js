/**
 * Main application entry point
 */
document.addEventListener('DOMContentLoaded', () => {
    // Initialize modules with performance optimizations
    Cards.init();
    CardModal.init();
    
    // Set up performance-optimized event listeners
    setupEventListeners();
    
    // Load initial cards with performance optimizations
    loadInitialCards();
});

/**
 * Set up event listeners with performance optimizations
 */
function setupEventListeners() {
    // Use event delegation for card clicks to improve performance
    document.getElementById('cards-grid').addEventListener('click', (e) => {
        const cardElement = e.target.closest('.card');
        if (cardElement && cardElement.dataset.card) {
            try {
                const cardData = JSON.parse(cardElement.dataset.card);
                if (cardData) {
                    CardModal.showModal(cardData);
                } else {
                    console.error('Card data is null or undefined after parsing');
                }
            } catch (error) {
                console.error('Error parsing card data:', error);
                // If there's an error parsing the card data, show an error message
                alert('Sorry, there was an error displaying this card. Please try another card.');
            }
        } else if (cardElement && cardElement.dataset.cardError) {
            // Handle cards that had issues during data stringification
            alert('Sorry, there was an error with this card data. Please try another card.');
        }
    });

    // Add load more button functionality
    const loadMoreButton = document.getElementById('load-more');
    if (loadMoreButton) {
        loadMoreButton.addEventListener('click', () => {
            // Show loading state
            loadMoreButton.textContent = 'Loading...';
            loadMoreButton.disabled = true;
            
            console.log('Loading more cards, current page:', Cards.currentPage);
            
            // Use the Cards module's loadMoreCards function
            Cards.loadMoreCards()
                .then(() => {
                    console.log('Load more completed, hasMore:', Cards.hasMore);
                    // Update button state based on hasMore flag
                    if (Cards.hasMore) {
                        loadMoreButton.textContent = 'Load More Spoilers';
                        loadMoreButton.disabled = false;
                    } else {
                        loadMoreButton.style.display = 'none';
                    }
                })
                .catch(error => {
                    console.error('Error loading more cards:', error);
                    loadMoreButton.textContent = 'Try Again';
                    loadMoreButton.disabled = false;
                });
        });
    }
}

/**
 * Load initial cards with multiple fallback strategies
 * and performance optimizations
 */
async function loadInitialCards() {
    const loadingElement = document.getElementById('loading');
    
    try {
        // Clear all caches to ensure fresh data
        ScryfallAPI.clearAllCaches();
        
        // Try to load recently added cards first (fastest option)
        updateLoadingMessage(loadingElement, 'Loading spoilers...');
        let recentCards;
        try {
            recentCards = await ScryfallAPI.getRecentlyAddedCards();
        } catch (error) {
            console.warn('Failed to load recently added cards:', error);
            recentCards = { data: [] };
        }
        
        if (recentCards && recentCards.data && recentCards.data.length > 0) {
            // Set pagination data properly
            Cards.cardsData = recentCards.data;
            Cards.hasMore = recentCards.has_more || false;
            Cards.currentPage = 1;
            
            Cards.renderCardsOptimized(recentCards.data);
            // Show load more button if there are more cards
            Cards.updateLoadMoreButton();
            hideLoading(loadingElement);
            return;
        }
        
        // Fallback to standard method
        updateLoadingMessage(loadingElement, 'Loading latest spoilers...');
        let spoilers;
        try {
            spoilers = await ScryfallAPI.getLatestSpoilers();
        } catch (error) {
            console.warn('Failed to load latest spoilers:', error);
            spoilers = { data: [] };
        }
        
        if (spoilers && spoilers.data && spoilers.data.length > 0) {
            // Set pagination data properly
            Cards.cardsData = spoilers.data;
            Cards.hasMore = spoilers.has_more || false;
            Cards.currentPage = 1;
            
            Cards.renderCardsOptimized(spoilers.data);
            // Show load more button if there are more cards
            Cards.updateLoadMoreButton();
            hideLoading(loadingElement);
            return;
        }
        
        // Final fallback to latest set
        updateLoadingMessage(loadingElement, 'Loading latest set cards...');
        let latestSetCards;
        try {
            latestSetCards = await ScryfallAPI.getLatestSetCards();
        } catch (error) {
            console.warn('Failed to load latest set cards:', error);
            latestSetCards = { data: [] };
        }
        
        if (latestSetCards && latestSetCards.data && latestSetCards.data.length > 0) {
            // Set pagination data properly
            Cards.cardsData = latestSetCards.data;
            Cards.hasMore = latestSetCards.has_more || false;
            Cards.currentPage = 1;
            
            Cards.renderCardsOptimized(latestSetCards.data);
            // Show load more button if there are more cards
            Cards.updateLoadMoreButton();
            hideLoading(loadingElement);
            return;
        }
        
        // If all methods fail, show no results
        showNoCardsMessage();
        hideLoading(loadingElement);
        
    } catch (error) {
        console.error('Error loading initial cards:', error);
        
        // Try one more time with a simple approach
        try {
            updateLoadingMessage(loadingElement, 'Trying alternative loading method...');
            
            // Use a simple query to get any recent cards
            const simpleQuery = 'year=2023';
            const url = `${ScryfallAPI.baseUrl}/cards/search?q=${encodeURIComponent(simpleQuery)}&order=released&dir=desc&page=1&per_page=30`;
            const response = await fetch(url);
            const data = await response.json();
            
            if (data && data.data && data.data.length > 0) {
                Cards.renderCardsOptimized(data.data);
                hideLoading(loadingElement);
                return;
            }
        } catch (fallbackError) {
            console.error('Fallback loading also failed:', fallbackError);
        }
        
        showErrorMessage(error);
        hideLoading(loadingElement);
    }
}

/**
 * Update loading message with animation for better UX
 */
function updateLoadingMessage(element, message) {
    if (element) {
        element.textContent = message;
        element.style.display = 'block';
    }
}

/**
 * Hide loading indicator with fade effect
 */
function hideLoading(element) {
    if (element) {
        element.style.opacity = '0';
        setTimeout(() => {
            element.style.display = 'none';
            element.style.opacity = '1';
        }, 300);
    }
}

/**
 * Show error message when all fallback attempts fail
 */
function showErrorMessage(error) {
    const cardsGrid = document.getElementById('cards-grid');
    if (!cardsGrid) return;
    
    cardsGrid.innerHTML = '';
    
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.textContent = `Failed to load spoilers: ${error.message || 'Unknown error'}`;
    cardsGrid.appendChild(errorElement);
}

/**
 * Show message when no cards are found
 */
function showNoCardsMessage() {
    const cardsGrid = document.getElementById('cards-grid');
    if (!cardsGrid) return;
    
    cardsGrid.innerHTML = '';
    
    const noResultsElement = document.createElement('div');
    noResultsElement.className = 'no-results';
    noResultsElement.textContent = 'No spoilers found. Check back later for new spoilers.';
    cardsGrid.appendChild(noResultsElement);
} 