/**
 * Modal module for handling card detail modals
 */
const CardModal = {
    // Store modal elements
    elements: {
        modal: null,
        closeButton: null,
        cardImage: null,
        cardName: null,
        cardType: null,
        cardText: null,
        cardStats: null,
        cardSet: null,
        cardLegality: null,
        scryfallLink: null,
        printingsButton: null,
        printingsContainer: null
    },
    
    // Store current card data
    currentCard: null,
    
    // Store other printings
    otherPrintings: [],
    
    // Track if printings are loading
    loadingPrintings: false,
    
    // Cache for printings
    printingsCache: {},
    
    /**
     * Initialize the modal
     * @returns {Object} - The modal module
     */
    init() {
        // Get modal elements
        this.elements = {
            modal: document.getElementById('card-modal'),
            closeButton: document.querySelector('.close-modal'),
            cardImage: document.querySelector('.modal-card-image'),
            cardName: document.querySelector('.modal-card-name'),
            cardType: document.querySelector('.modal-card-type'),
            cardText: document.querySelector('.modal-card-text'),
            cardStats: document.querySelector('.modal-card-stats'),
            cardSet: document.querySelector('.modal-card-set'),
            cardLegality: document.querySelector('.modal-card-legality'),
            scryfallLink: document.querySelector('.modal-scryfall-link'),
            printingsButton: document.querySelector('.modal-printings-button'),
            printingsContainer: document.querySelector('.modal-printings-container')
        };
        
        // Validate that all elements exist
        if (!this.validateElements()) {
            console.error('Some modal elements could not be found');
            
            // Create missing elements if needed
            this.createMissingElements();
        }
        
        this.setupEventListeners();
        
        // Pre-render the modal to improve first-time display performance
        this.preRenderModal();
        
        return this;
    },
    
    /**
     * Pre-render the modal to improve first-time display performance
     */
    preRenderModal() {
        const { modal } = this.elements;
        if (!modal) return;
        
        // Force layout calculation
        modal.style.display = 'block';
        modal.style.opacity = '0';
        modal.offsetHeight; // Force reflow
        modal.style.display = 'none';
        modal.style.opacity = '';
    },
    
    /**
     * Create any missing elements needed for the printings feature
     */
    createMissingElements() {
        // Create printings button if it doesn't exist
        if (!this.elements.printingsButton) {
            const modalDetails = document.querySelector('.modal-card-details');
            if (modalDetails) {
                // Create button
                const printingsButton = document.createElement('button');
                printingsButton.className = 'modal-printings-button';
                printingsButton.textContent = 'Load Other Printings';
                
                // Create container for printings
                const printingsContainer = document.createElement('div');
                printingsContainer.className = 'modal-printings-container';
                printingsContainer.style.display = 'none';
                
                // Insert before the Scryfall link
                const scryfallLink = modalDetails.querySelector('.modal-scryfall-link');
                if (scryfallLink) {
                    modalDetails.insertBefore(printingsContainer, scryfallLink);
                    modalDetails.insertBefore(printingsButton, printingsContainer);
                } else {
                    modalDetails.appendChild(printingsButton);
                    modalDetails.appendChild(printingsContainer);
                }
                
                // Update elements
                this.elements.printingsButton = printingsButton;
                this.elements.printingsContainer = printingsContainer;
            }
        }
    },
    
    /**
     * Validate that all required elements exist
     * @returns {Boolean} - True if all elements exist
     */
    validateElements() {
        return this.elements.modal && 
               this.elements.closeButton && 
               this.elements.cardImage && 
               this.elements.cardName && 
               this.elements.cardType && 
               this.elements.cardText && 
               this.elements.cardStats && 
               this.elements.cardSet && 
               this.elements.cardLegality && 
               this.elements.scryfallLink &&
               this.elements.printingsButton &&
               this.elements.printingsContainer;
    },
    
    /**
     * Set up event listeners for the modal
     */
    setupEventListeners() {
        const { modal, closeButton, printingsButton } = this.elements;
        
        // Close modal when clicking the close button
        closeButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.hideModal();
        });
        
        // Close modal when clicking outside the modal content
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                this.hideModal();
            }
        });
        
        // Close modal when pressing Escape key
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                this.hideModal();
            }
        });
        
        // Load other printings when clicking the printings button
        if (printingsButton) {
            printingsButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.togglePrintings();
            });
        }
    },
    
    /**
     * Toggle the display of other printings
     */
    async togglePrintings() {
        const { printingsButton, printingsContainer } = this.elements;
        
        if (!this.currentCard || !printingsButton || !printingsContainer) return;
        
        // If printings are already visible, hide them
        if (printingsContainer.style.display === 'block') {
            printingsContainer.style.display = 'none';
            printingsButton.textContent = 'Load Other Printings';
            return;
        }
        
        // If we haven't loaded printings yet, load them
        if (!this.loadingPrintings && this.otherPrintings.length === 0) {
            this.loadingPrintings = true;
            printingsButton.textContent = 'Loading Printings...';
            printingsButton.disabled = true;
            
            try {
                await this.loadOtherPrintings();
            } catch (error) {
                console.error('Error loading printings:', error);
                printingsContainer.innerHTML = '<p class="error-message">Failed to load other printings.</p>';
            } finally {
                this.loadingPrintings = false;
                printingsButton.disabled = false;
            }
        }
        
        // Show printings
        printingsContainer.style.display = 'block';
        printingsButton.textContent = 'Hide Other Printings';
    },
    
    /**
     * Load other printings of the current card
     */
    async loadOtherPrintings() {
        if (!this.currentCard || !this.currentCard.name) return;
        
        const { printingsContainer } = this.elements;
        const cardName = this.currentCard.name;
        
        try {
            // Check cache first
            if (this.printingsCache[cardName]) {
                this.otherPrintings = this.printingsCache[cardName];
                this.renderPrintings();
                return;
            }
            
            // Search for cards with the same name
            const query = `!"${cardName}"`;
            const printingsData = await ScryfallAPI.searchCards(query);
            
            if (printingsData && printingsData.data && printingsData.data.length > 0) {
                this.otherPrintings = printingsData.data;
                
                // Cache the results
                this.printingsCache[cardName] = printingsData.data;
                
                // Render printings
                this.renderPrintings();
            } else {
                printingsContainer.innerHTML = '<p>No other printings found.</p>';
            }
        } catch (error) {
            console.error('Error loading printings:', error);
            printingsContainer.innerHTML = '<p class="error-message">Failed to load other printings.</p>';
            throw error;
        }
    },
    
    /**
     * Render the other printings in the container
     */
    renderPrintings() {
        const { printingsContainer } = this.elements;
        
        if (!printingsContainer || this.otherPrintings.length === 0) return;
        
        // Clear container
        printingsContainer.innerHTML = '';
        
        // Create heading
        const heading = document.createElement('h3');
        heading.textContent = 'Other Printings';
        printingsContainer.appendChild(heading);
        
        // Create printings grid
        const printingsGrid = document.createElement('div');
        printingsGrid.className = 'printings-grid';
        printingsContainer.appendChild(printingsGrid);
        
        // Create a document fragment for better performance
        const fragment = document.createDocumentFragment();
        let printingsCount = 0;
        
        // Add each printing
        this.otherPrintings.forEach(printing => {
            // Skip the current printing
            if (printing.id === this.currentCard.id) return;
            
            const printingElement = document.createElement('div');
            printingElement.className = 'printing-card';
            
            // Get image URL - use small size for better performance
            const imageUrl = this.getCardImageUrl(printing, 'small');
            
            printingElement.innerHTML = `
                <img src="${imageUrl}" alt="${printing.name}" loading="lazy">
                <div class="printing-info">
                    <div class="printing-set">${printing.set_name} (${printing.set.toUpperCase()})</div>
                </div>
            `;
            
            // Add click event to switch to this printing
            printingElement.addEventListener('click', () => {
                this.switchToPrinting(printing);
            });
            
            fragment.appendChild(printingElement);
            printingsCount++;
        });
        
        // Append all printings at once
        printingsGrid.appendChild(fragment);
        
        // If no other printings were added, show a message
        if (printingsCount === 0) {
            printingsContainer.innerHTML = '<p>No other printings found.</p>';
        }
    },
    
    /**
     * Switch the modal to display a different printing
     * @param {Object} printing - The printing to switch to
     */
    switchToPrinting(printing) {
        if (!printing) return;
        
        // Update current card
        this.currentCard = printing;
        
        // Update modal content
        this.updateModalContent(printing);
        
        // Scroll to top of modal
        const modalBody = document.querySelector('.modal-body');
        if (modalBody) {
            modalBody.scrollTop = 0;
        }
    },
    
    /**
     * Show the modal with card details
     * @param {Object} card - Card data from Scryfall API
     */
    showModal(card) {
        if (!card) {
            console.error('No card data provided to showModal');
            return;
        }
        
        // Store current card data
        this.currentCard = card;
        
        // Reset printings
        this.otherPrintings = [];
        
        const { modal, printingsButton, printingsContainer } = this.elements;
        
        // Update modal content
        this.updateModalContent(card);
        
        // Reset printings button and container
        if (printingsButton) {
            printingsButton.textContent = 'Load Other Printings';
            printingsButton.disabled = false;
        }
        
        if (printingsContainer) {
            printingsContainer.style.display = 'none';
            printingsContainer.innerHTML = '';
        }
        
        // Show the modal
        modal.style.display = 'block';
        
        // Force reflow to ensure transitions work properly
        modal.offsetHeight;
        
        // Add show class for animation
        modal.classList.add('show');
        
        // Prevent scrolling on the body
        document.body.style.overflow = 'hidden';
    },
    
    /**
     * Update the modal content with card data
     * @param {Object} card - Card data
     */
    updateModalContent(card) {
        const { 
            cardImage, cardName, cardType, cardText, 
            cardStats, cardSet, cardLegality, scryfallLink 
        } = this.elements;
        
        // Set card image - use normal size for modal
        cardImage.innerHTML = this.getCardImageHtml(card);
        
        // Set card name
        cardName.textContent = card.name || 'Unknown Card';
        
        // Set card type
        cardType.textContent = card.type_line || '';
        
        // Set card text
        cardText.innerHTML = this.getCardTextHtml(card);
        
        // Set card stats (power/toughness or loyalty)
        cardStats.innerHTML = this.getCardStatsHtml(card);
        
        // Set card set
        cardSet.innerHTML = `<strong>Set:</strong> ${card.set_name || 'Unknown Set'} (${card.set ? card.set.toUpperCase() : '???'})`;
        
        // Set card legality
        cardLegality.innerHTML = this.getCardLegalityHtml(card);
        
        // Set Scryfall link
        scryfallLink.href = card.scryfall_uri || 
            `https://scryfall.com/search?q=${encodeURIComponent(card.name || 'Unknown Card')}`;
    },
    
    /**
     * Hide the modal
     */
    hideModal() {
        const { modal } = this.elements;
        
        if (!modal) return;
        
        // Remove show class to trigger transition
        modal.classList.remove('show');
        
        // Wait for transition to complete before hiding
        setTimeout(() => {
            modal.style.display = 'none';
            
            // Re-enable scrolling on the body
            document.body.style.overflow = '';
            
            // Clear current card data
            this.currentCard = null;
            this.otherPrintings = [];
        }, 300); // Match the transition duration in CSS
    },
    
    /**
     * Get HTML for card image(s)
     * @param {Object} card - Card data
     * @returns {String} - HTML for card image(s)
     */
    getCardImageHtml(card) {
        if (!card) return '';
        
        if (card.image_uris) {
            // Normal card
            return `<img src="${card.image_uris.normal || card.image_uris.small}" alt="${card.name || 'Card'}" loading="lazy">`;
        } else if (card.card_faces && card.card_faces[0].image_uris) {
            // Double-faced card - show both faces
            return `
                <img src="${card.card_faces[0].image_uris.normal || card.card_faces[0].image_uris.small}" alt="${card.card_faces[0].name || 'Card face'}" loading="lazy">
                ${card.card_faces[1]?.image_uris ? 
                    `<img src="${card.card_faces[1].image_uris.normal || card.card_faces[1].image_uris.small}" alt="${card.card_faces[1].name || 'Card back face'}" loading="lazy" style="margin-top: 10px;">` : 
                    ''}
            `;
        } else {
            // Fallback for cards without images
            return `<img src="https://c2.scryfall.com/file/scryfall-cards/normal/front/0/c/0c082aa8-bf7f-47f2-baf8-43ad253fd7d7.jpg" alt="Card back">`;
        }
    },
    
    /**
     * Get image URL for a card
     * @param {Object} card - Card data
     * @param {String} size - Image size (small, normal, large)
     * @returns {String} - Image URL
     */
    getCardImageUrl(card, size = 'small') {
        if (!card) return '';
        
        if (card.image_uris) {
            return card.image_uris[size] || card.image_uris.normal || card.image_uris.small;
        } else if (card.card_faces && card.card_faces[0].image_uris) {
            return card.card_faces[0].image_uris[size] || card.card_faces[0].image_uris.normal || card.card_faces[0].image_uris.small;
        }
        
        return 'https://c2.scryfall.com/file/scryfall-cards/normal/front/0/c/0c082aa8-bf7f-47f2-baf8-43ad253fd7d7.jpg';
    },
    
    /**
     * Get HTML for card text
     * @param {Object} card - Card data
     * @returns {String} - HTML for card text
     */
    getCardTextHtml(card) {
        if (!card) return '';
        
        if (card.oracle_text) {
            return card.oracle_text.replace(/\n/g, '<br>');
        } else if (card.card_faces) {
            // Handle double-faced cards
            let html = '';
            card.card_faces.forEach(face => {
                if (face.name && face.oracle_text) {
                    html += `<strong>${face.name}:</strong><br>${face.oracle_text.replace(/\n/g, '<br>')}<br><br>`;
                }
            });
            return html;
        }
        return '';
    },
    
    /**
     * Get HTML for card stats
     * @param {Object} card - Card data
     * @returns {String} - HTML for card stats
     */
    getCardStatsHtml(card) {
        if (!card) return '';
        
        if (card.power && card.toughness) {
            return `<strong>Power/Toughness:</strong> ${card.power}/${card.toughness}`;
        } else if (card.loyalty) {
            return `<strong>Loyalty:</strong> ${card.loyalty}`;
        } else if (card.card_faces) {
            // Handle double-faced cards
            let html = '';
            card.card_faces.forEach(face => {
                if (face.name) {
                    if (face.power && face.toughness) {
                        html += `<strong>${face.name}:</strong> ${face.power}/${face.toughness}<br>`;
                    } else if (face.loyalty) {
                        html += `<strong>${face.name}:</strong> Loyalty ${face.loyalty}<br>`;
                    }
                }
            });
            return html;
        }
        return '';
    },
    
    /**
     * Get HTML for card legality
     * @param {Object} card - Card data
     * @returns {String} - HTML for card legality
     */
    getCardLegalityHtml(card) {
        if (!card || !card.legalities) return '';
        
        let html = '<strong>Legality:</strong><br>';
        const formats = ['standard', 'pioneer', 'modern', 'legacy', 'commander'];
        
        formats.forEach(format => {
            if (card.legalities[format]) {
                const isLegal = card.legalities[format] === 'legal';
                const formatName = format.charAt(0).toUpperCase() + format.slice(1);
                html += `<span class="${isLegal ? 'legal' : 'not-legal'}">${formatName}: ${isLegal ? 'Legal' : 'Not Legal'}</span><br>`;
            }
        });
        
        return html;
    },
    
    /**
     * Clear the printings cache
     */
    clearCache() {
        this.printingsCache = {};
    }
}; 