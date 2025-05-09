/**
 * Cards module for handling card display and rendering
 */
const Cards = {
    // Store current cards data and DOM elements
    cardsData: [],
    elements: {
        cardsGrid: null,
        loadingElement: null,
        loadMoreButton: null
    },
    
    // Image loading queue
    imageQueue: [],
    processingQueue: false,
    
    // Pagination tracking
    currentPage: 1,
    hasMore: false,
    currentFilters: {},
    
    /**
     * Initialize cards module
     * @returns {Object} - The cards module
     */
    init() {
        this.elements = {
            cardsGrid: document.getElementById('cards-grid'),
            loadingElement: document.getElementById('loading')
        };
        
        // Reset pagination tracking
        this.currentPage = 1;
        this.hasMore = false;
        this.currentFilters = {};
        
        return this;
    },
    
    /**
     * Create the load more button
     */
    createLoadMoreButton() {
        // Check if button already exists
        let loadMoreButton = document.getElementById('load-more-button');
        
        if (!loadMoreButton) {
            loadMoreButton = document.createElement('button');
            loadMoreButton.id = 'load-more-button';
            loadMoreButton.className = 'load-more-button';
            loadMoreButton.textContent = 'Load More Cards';
            loadMoreButton.style.display = 'none'; // Hide initially
            
            // Add click event
            loadMoreButton.addEventListener('click', () => this.loadMoreCards());
            
            // Add to document
            const container = document.querySelector('.container');
            if (container) {
                container.appendChild(loadMoreButton);
            } else {
                document.body.appendChild(loadMoreButton);
            }
        }
        
        this.elements.loadMoreButton = loadMoreButton;
    },
    
    /**
     * Load cards with optional filters
     * @param {Object} filters - Filters to apply
     */
    async loadCards(filters = {}) {
        try {
            this.showLoading(true);
            this.clearCards();
            
            // Reset pagination
            this.currentPage = 1;
            this.currentFilters = { ...filters };
            
            // Fetch cards from API
            const data = await ScryfallAPI.getLatestSpoilers(filters);
            
            if (data?.data?.length) {
                this.cardsData = data.data;
                this.renderCardsOptimized(data.data);
                
                // Check if there are more pages
                this.hasMore = data.has_more || false;
                this.updateLoadMoreButton();
            } else {
                this.showNoResults();
                this.hideLoadMoreButton();
            }
            
            this.showLoading(false);
        } catch (error) {
            console.error('Error loading cards:', error);
            
            // If we get a 400 error and have filters, try loading without filters
            if (error.message.includes('400') && this.hasActiveFilters(filters)) {
                console.log('Trying to load cards without filters...');
                this.showError('Invalid search query. Trying to load cards without filters...');
                
                // Wait a moment before trying again
                setTimeout(() => this.loadCards({}), 1000);
                return;
            }
            
            this.showError(this.getErrorMessage(error));
            this.showLoading(false);
            this.hideLoadMoreButton();
        }
    },
    
    /**
     * Load more cards (next page)
     * @returns {Promise} - Promise resolving when done
     */
    async loadMoreCards() {
        if (!this.hasMore) return Promise.resolve();
        
        try {
            console.log('Loading more cards, page:', this.currentPage + 1);
            
            // Increment page
            this.currentPage++;
            
            // Make sure we have a valid filter object
            if (!this.currentFilters) {
                this.currentFilters = {};
            }
            
            // Fetch next page
            console.log('Fetching with filters:', this.currentFilters);
            const nextPageData = await ScryfallAPI.getPagedCards(this.currentFilters, this.currentPage);
            
            if (nextPageData?.data?.length) {
                console.log(`Loaded ${nextPageData.data.length} more cards`);
                
                // Add new cards to existing data
                this.cardsData = [...this.cardsData, ...nextPageData.data];
                
                // Render only the new cards using date-based grouping
                this.renderAdditionalCards(nextPageData.data);
                
                // Update has more flag
                this.hasMore = nextPageData.has_more || false;
                console.log('Updated hasMore flag:', this.hasMore);
            } else {
                console.log('No more cards found');
                this.hasMore = false;
            }
            
            return Promise.resolve();
        } catch (error) {
            console.error('Error loading more cards:', error);
            return Promise.reject(error);
        }
    },
    
    /**
     * Update the load more button state
     */
    updateLoadMoreButton() {
        // Use the load-more button from the HTML instead of creating our own
        const loadMoreButton = document.getElementById('load-more');
        if (!loadMoreButton) return;
        
        if (this.hasMore) {
            loadMoreButton.style.display = 'block';
            loadMoreButton.textContent = 'Load More Spoilers';
            loadMoreButton.disabled = false;
        } else {
            loadMoreButton.style.display = 'none';
        }
    },
    
    /**
     * Hide the load more button
     */
    hideLoadMoreButton() {
        const loadMoreButton = document.getElementById('load-more');
        if (loadMoreButton) {
            loadMoreButton.style.display = 'none';
        }
    },
    
    /**
     * Check if there are active filters
     * @param {Object} filters - Filters to check
     * @returns {Boolean} - True if there are active filters
     */
    hasActiveFilters(filters) {
        return filters.set || 
               (filters.colors && filters.colors.length) || 
               filters.rarity || 
               filters.type ||
               filters.name;
    },
    
    /**
     * Get appropriate error message based on error
     * @param {Error} error - The error object
     * @returns {String} - Error message
     */
    getErrorMessage(error) {
        if (error.message.includes('400')) {
            return 'Invalid search query. Please check your filters and try again.';
        } else if (error.message.includes('404')) {
            return 'No cards found matching your filters.';
        } else if (error.message.includes('429')) {
            return 'Too many requests. Please wait a moment and try again.';
        } else if (error.message.includes('abort')) {
            return 'Request timed out. Please try again.';
        }
        return 'Failed to load cards. Please try again later.';
    },
    
    /**
     * Render cards to the grid with optimized performance
     * @param {Array} cards - Array of card data (optional, uses this.cardsData if not provided)
     */
    renderCardsOptimized(cards) {
        const { cardsGrid } = this.elements;
        
        if (!cardsGrid) {
            console.error('Cards grid element not found');
            return;
        }
        
        // Use provided cards or fall back to stored cards
        const cardsToProcess = cards || this.cardsData;
        
        if (!cardsToProcess || !cardsToProcess.length) {
            this.showNoResults();
            return;
        }
        
        // Use DocumentFragment for better performance
        const fragment = document.createDocumentFragment();
        
        // Group cards by release date
        const cardsByDate = this.groupCardsByReleaseDate(cardsToProcess);
        
        // Reset image queue
        this.imageQueue = [];
        
        // Process each date group
        Object.keys(cardsByDate).sort((a, b) => new Date(b) - new Date(a)).forEach(date => {
            // Create date header
            const headerElement = document.createElement('div');
            headerElement.className = 'category-header';
            
            // Format date for display
            const formattedDate = new Date(date).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
            });
            
            headerElement.innerHTML = `Revealed ${formattedDate}`;
            fragment.appendChild(headerElement);
            
            // Create and append card elements for this date
            cardsByDate[date].forEach(card => {
                try {
                    const cardElement = this.createCardElement(card);
                    if (cardElement) {
                        fragment.appendChild(cardElement);
                    }
                } catch (error) {
                    console.error('Error rendering card:', error, card);
                    // Continue with other cards if one fails
                }
            });
        });
        
        // Append all cards at once for better performance
        cardsGrid.appendChild(fragment);
        
        // Process image queue
        this.processImageQueue();
    },
    
    /**
     * Group cards by release date
     * @param {Array} cards - Array of card data
     * @returns {Object} - Object with dates as keys and arrays of cards as values
     */
    groupCardsByReleaseDate(cards) {
        const groups = {};
        const today = new Date().toISOString().split('T')[0]; // Today's date in YYYY-MM-DD format
        
        // Group cards by their release date
        cards.forEach(card => {
            // Use the card's released_at date or default to today
            const releaseDate = card.released_at || today;
            const dateKey = releaseDate.split('T')[0]; // Convert to YYYY-MM-DD format
            
            // Initialize group if it doesn't exist
            if (!groups[dateKey]) {
                groups[dateKey] = [];
            }
            
            // Add card to group
            groups[dateKey].push(card);
        });
        
        return groups;
    },
    
    /**
     * Render additional cards (for load more functionality)
     * @param {Array} newCards - New cards to render
     */
    renderAdditionalCards(newCards) {
        const { cardsGrid } = this.elements;
        
        if (!cardsGrid || !newCards || !newCards.length) return;
        
        // Use DocumentFragment for better performance
        const fragment = document.createDocumentFragment();
        
        // Group cards by release date
        const cardsByDate = this.groupCardsByReleaseDate(newCards);
        
        // Reset image queue for new batch
        this.imageQueue = [];
        
        // Process each date group
        Object.keys(cardsByDate).sort((a, b) => new Date(b) - new Date(a)).forEach(date => {
            // Create date header
            const headerElement = document.createElement('div');
            headerElement.className = 'category-header';
            
            // Format date for display
            const formattedDate = new Date(date).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
            });
            
            headerElement.innerHTML = `Revealed ${formattedDate}`;
            fragment.appendChild(headerElement);
            
            // Create and append card elements for this date
            cardsByDate[date].forEach(card => {
                try {
                    const cardElement = this.createCardElement(card);
                    if (cardElement) {
                        fragment.appendChild(cardElement);
                    }
                } catch (error) {
                    console.error('Error rendering card:', error, card);
                    // Continue with other cards if one fails
                }
            });
        });
        
        // Append all cards at once for better performance
        cardsGrid.appendChild(fragment);
        
        // Process image queue
        this.processImageQueue();
    },
    
    /**
     * Process the image loading queue
     */
    processImageQueue() {
        if (this.processingQueue || this.imageQueue.length === 0) return;
        
        this.processingQueue = true;
        
        // Process images in batches of 5 (smaller batch for better performance)
        const batchSize = 5;
        const batch = this.imageQueue.splice(0, batchSize);
        
        // Use Intersection Observer for lazy loading
        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    const src = img.dataset.src;
                    if (src) {
                        // Set a timeout to prevent hanging on image load
                        const imageTimeout = setTimeout(() => {
                            // If image takes too long, use fallback
                            if (img.dataset.src) {
                                img.src = 'https://c2.scryfall.com/file/scryfall-cards/normal/front/0/c/0c082aa8-bf7f-47f2-baf8-43ad253fd7d7.jpg';
                                img.removeAttribute('data-src');
                            }
                        }, 10000); // 10 second timeout for images
                        
                        // Create a new image to preload
                        const preloadImg = new Image();
                        preloadImg.onload = () => {
                            clearTimeout(imageTimeout);
                            img.src = src;
                            img.removeAttribute('data-src');
                        };
                        preloadImg.onerror = () => {
                            clearTimeout(imageTimeout);
                            img.src = 'https://c2.scryfall.com/file/scryfall-cards/normal/front/0/c/0c082aa8-bf7f-47f2-baf8-43ad253fd7d7.jpg';
                            img.removeAttribute('data-src');
                        };
                        preloadImg.src = src;
                    }
                    observer.unobserve(img);
                }
            });
        }, { rootMargin: '200px 0px', threshold: 0.1 });
        
        // Observe each image in the batch
        batch.forEach(img => {
            observer.observe(img);
        });
        
        // Schedule next batch with a shorter delay for smoother loading
        setTimeout(() => {
            this.processingQueue = false;
            this.processImageQueue();
        }, 100); // 100ms delay between batches
    },
    
    /**
     * Create a card element from card data
     * @param {Object} card - Card data from Scryfall API
     * @returns {HTMLElement} - Card element
     */
    createCardElement(card) {
        if (!card) return null;
        
        const cardElement = document.createElement('div');
        cardElement.className = 'card';
        
        // Store card data for modal - only store essential properties to avoid circular references
        try {
            // Create a simplified version of the card data to avoid circular references
            const simplifiedCard = {
                id: card.id,
                name: card.name,
                type_line: card.type_line,
                oracle_text: card.oracle_text,
                power: card.power,
                toughness: card.toughness,
                loyalty: card.loyalty,
                rarity: card.rarity,
                set: card.set,
                set_name: card.set_name,
                released_at: card.released_at,
                legalities: card.legalities,
                scryfall_uri: card.scryfall_uri,
                image_uris: card.image_uris
            };
            
            // If it's a double-faced card, include card_faces
            if (card.card_faces) {
                simplifiedCard.card_faces = card.card_faces.map(face => ({
                    name: face.name,
                    type_line: face.type_line,
                    oracle_text: face.oracle_text,
                    power: face.power,
                    toughness: face.toughness,
                    loyalty: face.loyalty,
                    image_uris: face.image_uris
                }));
            }
            
            cardElement.dataset.card = JSON.stringify(simplifiedCard);
        } catch (error) {
            console.error('Error stringifying card data:', error);
            // If stringification fails, add a data attribute to indicate this card has an issue
            cardElement.dataset.cardError = 'true';
        }
        
        // Get the appropriate image URI
        const imageUris = this.getCardImageUris(card);
        
        if (imageUris) {
            // Create image element
            const cardImageContainer = document.createElement('div');
            cardImageContainer.className = 'card-image-container';
            
            const cardImage = document.createElement('img');
            cardImage.className = 'card-image';
            
            // Use normal size for better quality at the expense of load time
            // Fallback to other sizes if normal isn't available
            const imageSrc = imageUris.normal || imageUris.large || imageUris.small || imageUris.png;
            
            // Add image to loading queue
            this.addImageToLoadQueue(cardImage, imageSrc);
            
            cardImageContainer.appendChild(cardImage);
            cardElement.appendChild(cardImageContainer);
        } else {
            // Fallback for cards without images
            cardElement.innerHTML = `<div class="card-image-missing">${card.name}</div>`;
        }
        
        // No card info section
        
        return cardElement;
    },
    
    /**
     * Get the image URL for a card
     * @param {Object} card - Card data
     * @param {String} size - Image size (small, normal, large)
     * @returns {String} - Image URL
     */
    getCardImageUrl(card, size = 'normal') {
        if (!card) return '';
        
        if (card.image_uris) {
            return card.image_uris[size] || card.image_uris.normal || card.image_uris.small;
        } else if (card.card_faces && card.card_faces[0].image_uris) {
            return card.card_faces[0].image_uris[size] || card.card_faces[0].image_uris.normal || card.card_faces[0].image_uris.small;
        }
        
        return 'https://c2.scryfall.com/file/scryfall-cards/normal/front/0/c/0c082aa8-bf7f-47f2-baf8-43ad253fd7d7.jpg';
    },
    
    /**
     * Format rarity string with proper capitalization
     * @param {String} rarity - Rarity string
     * @returns {String} - Formatted rarity
     */
    formatRarity(rarity) {
        return rarity ? 
            (rarity.charAt(0).toUpperCase() + rarity.slice(1)) : 
            'Unknown';
    },
    
    /**
     * Clear all cards from the grid
     */
    clearCards() {
        const { cardsGrid } = this.elements;
        if (cardsGrid) {
            cardsGrid.innerHTML = '';
        }
        
        // Reset image queue
        this.imageQueue = [];
        this.processingQueue = false;
        
        // Hide load more button
        this.hideLoadMoreButton();
    },
    
    /**
     * Show or hide loading indicator
     * @param {Boolean} show - Whether to show loading
     */
    showLoading(show) {
        const { loadingElement } = this.elements;
        if (loadingElement) {
            loadingElement.style.display = show ? 'block' : 'none';
        }
    },
    
    /**
     * Show error message
     * @param {String} message - Error message
     */
    showError(message) {
        const { cardsGrid } = this.elements;
        if (!cardsGrid) return;
        
        this.clearCards();
        
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.textContent = message;
        cardsGrid.appendChild(errorElement);
    },
    
    /**
     * Show no results message
     */
    showNoResults() {
        const { cardsGrid } = this.elements;
        if (!cardsGrid) return;
        
        this.clearCards();
        
        const noResultsElement = document.createElement('div');
        noResultsElement.className = 'no-results';
        noResultsElement.textContent = 'No cards found matching your filters.';
        cardsGrid.appendChild(noResultsElement);
    },
    
    /**
     * Get image URIs for a card
     * @param {Object} card - Card data
     * @returns {Object|null} - Image URIs object or null
     */
    getCardImageUris(card) {
        if (!card) return null;
     
        if (card.image_uris) {
            return card.image_uris;
        } else if (card.card_faces && card.card_faces[0].image_uris) {
            return card.card_faces[0].image_uris;
        }
        
        return null;
    },
    
    /**
     * Add image to loading queue
     * @param {HTMLImageElement} imgElement - Image element
     * @param {String} src - Image source URL
     */
    addImageToLoadQueue(imgElement, src) {
        if (!imgElement || !src) return;
        
        imgElement.dataset.src = src;
        imgElement.alt = 'Magic card';
        imgElement.onerror = function() {
            this.src = 'https://c2.scryfall.com/file/scryfall-cards/normal/front/0/c/0c082aa8-bf7f-47f2-baf8-43ad253fd7d7.jpg';
            this.onerror = null;
        };
        
        this.imageQueue.push(imgElement);
    }
}; 