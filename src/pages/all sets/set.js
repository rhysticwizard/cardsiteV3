// DOM Elements
const setTitle = document.getElementById('set-title');
const cardsGrid = document.getElementById('cards-grid');
const cardModal = document.getElementById('card-modal');
const modalBody = document.querySelector('.modal-body');
const closeModal = document.querySelector('.close-modal');
const setBreadcrumb = document.getElementById('set-breadcrumb');

// API URLs
const SCRYFALL_BASE_URL = 'https://api.scryfall.com';
const CORS_PROXY = 'https://corsproxy.io/?';
let USE_CORS_PROXY = false;

// State
let currentCards = [];
let isDemoMode = localStorage.getItem('isDemoMode') === 'true';

// Get URL parameters
const urlParams = new URLSearchParams(window.location.search);
const setCode = urlParams.get('code');
const setName = urlParams.get('name');

// Initialize the page
document.addEventListener('DOMContentLoaded', async () => {
    // Update page title and breadcrumb
    document.title = `${setName} | Magic: The Gathering`;
    setTitle.textContent = setName;
    setBreadcrumb.textContent = setName;
    
    // Check if in demo mode
    if (isDemoMode) {
        showDemoModeMessage();
    } else {
        // Load cards
        await fetchAndDisplayCards(setCode);
    }
    
    // Set up event listeners
    closeModal.addEventListener('click', closeCardModal);
    window.addEventListener('click', (event) => {
        if (event.target === cardModal) {
            closeCardModal();
        }
    });
});

function getApiUrl(endpoint) {
    const baseUrl = USE_CORS_PROXY ? CORS_PROXY + encodeURIComponent(SCRYFALL_BASE_URL) : SCRYFALL_BASE_URL;
    return `${baseUrl}${endpoint}`;
}

function getCardsUrl(setCode) {
    return getApiUrl(`/cards/search?order=set&q=e:${setCode}`);
}

// Fetch and display cards for a set
async function fetchAndDisplayCards(setCode) {
    try {
        let hasMore = true;
        let nextPage = getCardsUrl(setCode);
        let allCards = [];
        
        // Fetch all pages of results
        while (hasMore && nextPage) {
            const response = await fetch(nextPage, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                },
                mode: 'cors'
            });
            
            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.data) {
                allCards = [...allCards, ...data.data];
                
                hasMore = data.has_more;
                nextPage = data.next_page;
                
                // Apply CORS proxy to next_page URL if needed
                if (hasMore && USE_CORS_PROXY && !nextPage.includes(CORS_PROXY)) {
                    nextPage = CORS_PROXY + encodeURIComponent(nextPage);
                }
            } else {
                hasMore = false;
            }
        }
        
        // Sort cards by collector number
        allCards.sort((a, b) => {
            // First by rarity (mythic, rare, uncommon, common)
            const rarityOrder = { mythic: 1, rare: 2, uncommon: 3, common: 4 };
            const rarityDiff = (rarityOrder[a.rarity] || 99) - (rarityOrder[b.rarity] || 99);
            
            if (rarityDiff !== 0) return rarityDiff;
            
            // Then by color identity
            const colorOrder = card => {
                if (card.colors) {
                    if (card.colors.length === 0) return 8; // Colorless
                    if (card.colors.length > 1) return 7; // Multicolor
                    if (card.colors.includes('W')) return 1;
                    if (card.colors.includes('U')) return 2;
                    if (card.colors.includes('B')) return 3;
                    if (card.colors.includes('R')) return 4;
                    if (card.colors.includes('G')) return 5;
                }
                return 9; // Other
            };
            
            const colorDiff = colorOrder(a) - colorOrder(b);
            if (colorDiff !== 0) return colorDiff;
            
            // Finally by name
            return a.name.localeCompare(b.name);
        });
        
        // Store current cards in state for modal access
        currentCards = allCards;
        
        // Display cards
        displayCards(allCards);
    } catch (error) {
        console.error('Error fetching cards:', error);
        
        // Check for CORS-related errors
        let errorMessage = 'Failed to load cards.';
        
        if (error.message.includes('NetworkError') || 
            error.message.includes('CORS') || 
            error.message.includes('Failed to fetch')) {
            if (!USE_CORS_PROXY) {
                errorMessage = 'Network error: This might be a CORS issue. Try enabling the CORS proxy.';
            } else {
                errorMessage = 'Network error: Could not connect to API even with CORS proxy.';
            }
        }
        
        cardsGrid.innerHTML = `<div class="error">${errorMessage}<br><small>${error.message}</small>
            <button onclick="toggleCorsProxyAndRetry()" class="retry-button">
                <i class="fas fa-shield-alt"></i> ${USE_CORS_PROXY ? 'Disable' : 'Enable'} CORS Proxy
            </button>
        </div>`;
    }
}

// Display cards in the grid
function displayCards(cards) {
    cardsGrid.innerHTML = '';
    
    if (cards.length === 0) {
        cardsGrid.innerHTML = '<div class="no-cards">No cards found for this set.</div>';
        return;
    }
    
    // Add a revealed date header
    const dateHeader = document.createElement('div');
    dateHeader.className = 'cards-header';
    const releaseDate = new Date();
    dateHeader.textContent = `Revealed ${releaseDate.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    })}`;
    cardsGrid.appendChild(dateHeader);
    
    // Create cards container
    const cardsContainer = document.createElement('div');
    cardsContainer.className = 'cards-container';
    
    cards.forEach((card, index) => {
        // Skip cards without images or double-faced card backs
        if ((!card.image_uris && !card.card_faces) || 
            (card.layout === 'transform' && index > 0 && cards[index-1].name === card.name)) {
            return;
        }
        
        const cardItem = document.createElement('div');
        cardItem.className = 'card-item';
        cardItem.dataset.index = index;
        
        // Use the normal image if available, otherwise use the first face of a double-faced card
        const imageUrl = card.image_uris ? 
            card.image_uris.normal : 
            (card.card_faces && card.card_faces[0].image_uris ? 
                card.card_faces[0].image_uris.normal : 
                '');
        
        if (imageUrl) {
            cardItem.innerHTML = `<img src="${imageUrl}" alt="${card.name}">`;
            
            // Add click event to navigate to card page
            cardItem.addEventListener('click', () => {
                // Save set icon information in case it's needed on the card page
                if (card.set_icon_svg_uri) {
                    localStorage.setItem('currentSetIcon', card.set_icon_svg_uri);
                } else if (card.set_svg_uri) {
                    localStorage.setItem('currentSetIcon', card.set_svg_uri);
                }
                
                // Save current card data to localStorage for the card page to use
                localStorage.setItem('currentCard', JSON.stringify(card));
                localStorage.setItem('currentSetName', setTitle.textContent);
                
                // Navigate to card page with card index as parameter
                window.location.href = `card.html?set=${encodeURIComponent(card.set)}&id=${encodeURIComponent(card.id)}`;
            });
            
            cardsContainer.appendChild(cardItem);
        }
    });
    
    cardsGrid.appendChild(cardsContainer);
}

// Toggle CORS proxy and retry
function toggleCorsProxyAndRetry() {
    USE_CORS_PROXY = !USE_CORS_PROXY;
    console.log(`CORS Proxy ${USE_CORS_PROXY ? 'enabled' : 'disabled'}`);
    fetchAndDisplayCards(setCode);
}

// Close card modal
function closeCardModal() {
    cardModal.classList.add('hidden');
    document.body.classList.remove('modal-open');
}

// Show demo mode message
function showDemoModeMessage() {
    cardsGrid.innerHTML = `
        <div class="demo-card-message">
            <i class="fas fa-info-circle"></i>
            <h3>Demo Mode Limitation</h3>
            <p>In demo mode, individual card data cannot be displayed as it would require API access.</p>
            <p>To view actual cards, please try one of these options:</p>
            <div class="demo-card-actions">
                <button onclick="window.location.href='index.html'" class="retry-button">
                    <i class="fas fa-arrow-left"></i> Back to Sets
                </button>
                <button onclick="disableDemoMode()" class="retry-button">
                    <i class="fas fa-sync-alt"></i> Try API Mode
                </button>
            </div>
        </div>
    `;
    
    // Add demo mode banner
    const demoModeBanner = document.createElement('div');
    demoModeBanner.className = 'demo-mode-banner';
    demoModeBanner.innerHTML = `
        <i class="fas fa-info-circle"></i> 
        Running in demo mode with limited data. Card details will not be available.
        <button onclick="disableDemoMode()" class="demo-retry-btn">
            <i class="fas fa-sync-alt"></i> Try API Mode
        </button>
    `;
    document.querySelector('main').insertBefore(demoModeBanner, document.querySelector('main').firstChild);
}

// Disable demo mode
function disableDemoMode() {
    localStorage.removeItem('isDemoMode');
    isDemoMode = false;
    fetchAndDisplayCards(setCode);
    
    // Remove demo mode banner if it exists
    const demoModeBanner = document.querySelector('.demo-mode-banner');
    if (demoModeBanner) {
        demoModeBanner.remove();
    }
} 