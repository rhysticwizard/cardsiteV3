// DOM Elements
const setsContainer = document.getElementById('sets-container');
// No longer need these references since cards are shown in set.html now
// const cardsContainer = document.createElement('div');
// cardsContainer.id = 'cards-container';
// cardsContainer.className = 'hidden';
// If we're on the main page, add the cards container to the DOM
// document.addEventListener('DOMContentLoaded', () => {
//     const main = document.querySelector('main');
//     if (main && !document.getElementById('cards-container')) {
//         main.appendChild(cardsContainer);
//     }
// });
// const backButton = document.getElementById('back-button');
// const setTitle = document.getElementById('set-title');
// const cardsGrid = document.getElementById('cards-grid');
const cardModal = document.getElementById('card-modal');
const modalBody = document.querySelector('.modal-body');
const closeModal = document.querySelector('.close-modal');
const navTabs = document.querySelectorAll('.nav-tab');
const filterButton = document.querySelector('.filter-button');
const sortButton = document.querySelector('.sort-button');
const filterDropdown = document.getElementById('filter-dropdown');
const sortDropdown = document.getElementById('sort-dropdown');
const filterOptions = document.querySelectorAll('.filter-option');
const gridViewButton = document.querySelector('.grid-view');
const listViewButton = document.querySelector('.list-view');

// API URLs
const SCRYFALL_BASE_URL = 'https://api.scryfall.com';
const CORS_PROXY = 'https://corsproxy.io/?';
let USE_CORS_PROXY = false;

function getApiUrl(endpoint) {
    const baseUrl = USE_CORS_PROXY ? CORS_PROXY + encodeURIComponent(SCRYFALL_BASE_URL) : SCRYFALL_BASE_URL;
    return `${baseUrl}${endpoint}`;
}

// Updated API URLs function
function getSetsUrl() {
    return getApiUrl('/sets');
}

function getCardsUrl(setCode) {
    return getApiUrl(`/cards/search?order=set&q=e:${setCode}`);
}

// Toggle CORS proxy and retry
function toggleCorsProxyAndRetry() {
    USE_CORS_PROXY = !USE_CORS_PROXY;
    console.log(`CORS Proxy ${USE_CORS_PROXY ? 'enabled' : 'disabled'}`);
    fetchSets();
}

// State
let allSets = [];
let currentCards = [];
let currentFilter = 'all';
let currentSort = 'newest';
let currentView = 'grid';
let currentYear = null;

// Flag to indicate if we're in demo mode
let isDemoMode = false;

// Show error message with fallback option
function showError(message) {
    setsContainer.innerHTML = `
        <div class="error">
            ${message}
            <div class="error-buttons">
                <button class="retry-button" onclick="retryFetch()">
                    <i class="fas fa-sync-alt"></i> Retry
                </button>
                <button class="retry-button" onclick="toggleCorsProxyAndRetry()">
                    <i class="fas fa-shield-alt"></i> ${USE_CORS_PROXY ? 'Disable' : 'Enable'} CORS Proxy
                </button>
                <button class="retry-button" onclick="useDemoData()">
                    <i class="fas fa-database"></i> Use Demo Data
                </button>
            </div>
        </div>`;
    console.error(message);
}

// Retry fetching sets
function retryFetch() {
    console.log("Retrying fetch...");
    fetchSets();
}

// Use demo data
function useDemoData() {
    console.log("Loading demo data...");
    isDemoMode = true;
    
    // Sample demo data with a few sets
    const demoSets = [
        {
            name: "The Brothers' War",
            code: "bro",
            released_at: "2022-11-18",
            set_type: "expansion",
            card_count: 287,
            icon_svg_uri: "https://svgs.scryfall.io/sets/bro.svg"
        },
        {
            name: "Dominaria United",
            code: "dmu",
            released_at: "2022-09-09",
            set_type: "expansion",
            card_count: 281,
            icon_svg_uri: "https://svgs.scryfall.io/sets/dmu.svg"
        },
        {
            name: "Streets of New Capenna",
            code: "snc",
            released_at: "2022-04-29",
            set_type: "expansion",
            card_count: 467,
            icon_svg_uri: "https://svgs.scryfall.io/sets/snc.svg"
        },
        {
            name: "Kamigawa: Neon Dynasty",
            code: "neo",
            released_at: "2022-02-18",
            set_type: "expansion",
            card_count: 302,
            icon_svg_uri: "https://svgs.scryfall.io/sets/neo.svg"
        },
        {
            name: "Innistrad: Crimson Vow",
            code: "vow",
            released_at: "2021-11-19",
            set_type: "expansion",
            card_count: 267,
            icon_svg_uri: "https://svgs.scryfall.io/sets/vow.svg"
        },
        {
            name: "Innistrad: Midnight Hunt",
            code: "mid",
            released_at: "2021-09-24",
            set_type: "expansion",
            card_count: 282,
            icon_svg_uri: "https://svgs.scryfall.io/sets/mid.svg"
        },
        {
            name: "Core Set 2021",
            code: "m21",
            released_at: "2020-07-03",
            set_type: "core",
            card_count: 274,
            icon_svg_uri: "https://svgs.scryfall.io/sets/m21.svg"
        },
        {
            name: "Modern Horizons",
            code: "mh1",
            released_at: "2019-06-14",
            set_type: "draft_innovation",
            card_count: 254,
            icon_svg_uri: "https://svgs.scryfall.io/sets/mh1.svg"
        },
        {
            name: "Modern Horizons 2",
            code: "mh2",
            released_at: "2021-06-18",
            set_type: "draft_innovation",
            card_count: 303,
            icon_svg_uri: "https://svgs.scryfall.io/sets/mh2.svg"
        },
        {
            name: "Double Masters",
            code: "2xm",
            released_at: "2020-08-07",
            set_type: "masters",
            card_count: 332,
            icon_svg_uri: "https://svgs.scryfall.io/sets/2xm.svg"
        },
        {
            name: "Commander 2021",
            code: "c21",
            released_at: "2021-04-23",
            set_type: "commander",
            card_count: 82,
            icon_svg_uri: "https://svgs.scryfall.io/sets/c21.svg"
        }
    ];
    
    // Store the demo flag in localStorage so set.html can use it
    localStorage.setItem('isDemoMode', 'true');
    
    // Set the demo data and display
    allSets = demoSets;
    applyFiltersAndDisplay();
    
    // Add a banner to indicate demo mode
    const demoModeBanner = document.createElement('div');
    demoModeBanner.className = 'demo-mode-banner';
    demoModeBanner.innerHTML = `
        <i class="fas fa-info-circle"></i> 
        Running in demo mode with limited data. Card details will not be available.
        <button onclick="retryFetch()" class="demo-retry-btn">
            <i class="fas fa-sync-alt"></i> Try API Again
        </button>
    `;
    document.querySelector('.header').appendChild(demoModeBanner);
}

// Fetch all MTG sets
async function fetchSets() {
    try {
        setsContainer.innerHTML = '<div class="loading">Loading sets...</div>';
        
        const setsUrl = getSetsUrl();
        console.log(`Fetching sets from: ${setsUrl}`);
        
        const response = await fetch(setsUrl, {
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
        console.log('API response received:', data);
        
        if (!data || !data.data || !Array.isArray(data.data)) {
            throw new Error('Invalid API response format: missing data array');
        }
        
        if (data.data.length === 0) {
            throw new Error('API returned empty sets list');
        }
        
        // Filter out tokens and memorabilia
        allSets = data.data.filter(set => set.set_type !== 'token' && set.set_type !== 'memorabilia');
        console.log(`Filtered ${allSets.length} sets for display`);
        
        // Check for icon_svg_uri in the sets and log if missing
        const setsMissingIcon = allSets.filter(set => !set.icon_svg_uri && !set.svg_uri);
        if (setsMissingIcon.length > 0) {
            console.warn(`${setsMissingIcon.length} sets missing icon_svg_uri:`, setsMissingIcon);
        }
        
        // Fix set icons - replace default with specific codes and ensure all sets have icons
        allSets = allSets.map(set => {
            // Create a specific icon URL if missing or is default
            if (!set.icon_svg_uri || set.icon_svg_uri === 'https://svgs.scryfall.io/sets/default.svg') {
                const svgUrl = `https://svgs.scryfall.io/sets/${set.code}.svg`;
                console.log(`Generated or replaced icon URL for ${set.name} (${set.code}): ${svgUrl}`);
                set.icon_svg_uri = svgUrl;
            }
            return set;
        });
        
        if (allSets.length === 0) {
            throw new Error('No valid sets after filtering');
        }
        
        applyFiltersAndDisplay();
    } catch (error) {
        console.error('Error fetching sets:', error);
        
        // Check for CORS-related errors
        let errorMessage = 'Failed to load sets. Please try again later.';
        
        if (error.message.includes('NetworkError') || 
            error.message.includes('CORS') || 
            error.message.includes('Failed to fetch')) {
            if (!USE_CORS_PROXY) {
                errorMessage = 'Network error: This might be a CORS issue. Try enabling the CORS proxy below.';
            } else {
                errorMessage = 'Network error: Could not connect to API even with CORS proxy. Please check your internet connection.';
            }
        }
        
        showError(`${errorMessage}<br><small>${error.message}</small>`);
    }
}

// Apply filters and display sets
function applyFiltersAndDisplay() {
    try {
        // Debug: Log sets data to verify icons are available
        console.log("All sets data:", allSets);
        if (allSets.length > 0) {
            console.log("Sample set icon:", allSets[0].icon_svg_uri);
        }
        
        // Filter sets based on current filter
        let filteredSets = [...allSets];
        
        if (currentFilter !== 'all') {
            filteredSets = filteredSets.filter(set => {
                // Map Scryfall set types to our filter categories
                const setType = set.set_type;
                
                if (currentFilter === 'expansion') {
                    return setType === 'expansion';
                } else if (currentFilter === 'core') {
                    return setType === 'core';
                } else if (currentFilter === 'masters') {
                    return setType === 'masters';
                } else if (currentFilter === 'commander') {
                    return setType === 'commander';
                } else if (currentFilter === 'draft') {
                    return setType === 'draft_innovation';
                }
                
                return true;
            });
        }
        
        // Filter by year if specified
        if (currentYear) {
            filteredSets = filteredSets.filter(set => {
                const releaseDate = new Date(set.released_at);
                return releaseDate.getFullYear().toString() === currentYear;
            });
        }
        
        // Sort sets
        if (currentSort === 'newest') {
            filteredSets.sort((a, b) => new Date(b.released_at) - new Date(a.released_at));
        } else if (currentSort === 'oldest') {
            filteredSets.sort((a, b) => new Date(a.released_at) - new Date(b.released_at));
        } else if (currentSort === 'name-asc') {
            filteredSets.sort((a, b) => a.name.localeCompare(b.name));
        } else if (currentSort === 'name-desc') {
            filteredSets.sort((a, b) => b.name.localeCompare(a.name));
        }
        
        // Display sets based on current view and filters
        if (currentSort === 'newest' || currentSort === 'oldest') {
            displaySetsByYear(filteredSets);
        } else {
            displaySetsFlat(filteredSets);
        }
    } catch (error) {
        console.error('Error applying filters:', error);
        showError(`Error displaying sets. Please try again.<br><small>${error.message}</small>`);
    }
}

// Display sets grouped by year
function displaySetsByYear(filteredSets = allSets) {
    // Clear loading message
    setsContainer.innerHTML = '';
    
    // Group sets by release year
    const setsByYear = {};
    
    filteredSets.forEach(set => {
        const releaseDate = new Date(set.released_at);
        const year = releaseDate.getFullYear();
        
        if (!setsByYear[year]) {
            setsByYear[year] = [];
        }
        
        setsByYear[year].push(set);
    });
    
    // Sort years in descending order (newest first)
    const sortedYears = Object.keys(setsByYear).sort((a, b) => b - a);
    
    if (sortedYears.length === 0) {
        setsContainer.innerHTML = '<div class="no-results">No sets match your filters.</div>';
        return;
    }
    
    // Create HTML for each year and its sets
    sortedYears.forEach(year => {
        const yearContainer = document.createElement('div');
        yearContainer.className = 'year-container';
        
        const yearHeader = document.createElement('h2');
        yearHeader.className = 'year-header';
        yearHeader.textContent = year;
        
        // Sort sets within each year by release date (newest first)
        const sortedSets = setsByYear[year].sort((a, b) => 
            new Date(b.released_at) - new Date(a.released_at)
        );
        
        // Create container based on view
        const setsContainer = document.createElement('div');
        setsContainer.className = currentView === 'grid' ? 'sets-grid' : 'sets-list';
        
        // Create set items
        sortedSets.forEach(set => {
            const setElement = currentView === 'grid' 
                ? createSetCard(set) 
                : createSetListItem(set);
            
            setsContainer.appendChild(setElement);
        });
        
        yearContainer.appendChild(yearHeader);
        yearContainer.appendChild(setsContainer);
        document.getElementById('sets-container').appendChild(yearContainer);
    });
}

// Display sets in a flat list (for alphabetical sorting)
function displaySetsFlat(filteredSets) {
    // Clear loading message
    setsContainer.innerHTML = '';
    
    if (filteredSets.length === 0) {
        setsContainer.innerHTML = '<div class="no-results">No sets match your filters.</div>';
        return;
    }
    
    // Create container based on view
    const setsDisplayContainer = document.createElement('div');
    setsDisplayContainer.className = currentView === 'grid' ? 'sets-grid' : 'sets-list';
    
    // Create set items
    filteredSets.forEach(set => {
        const setElement = currentView === 'grid' 
            ? createSetCard(set) 
            : createSetListItem(set);
        
        setsDisplayContainer.appendChild(setElement);
    });
    
    document.getElementById('sets-container').appendChild(setsDisplayContainer);
}

// Create a set card for grid view
function createSetCard(set) {
    const setCard = document.createElement('div');
    setCard.className = 'set-card';
    setCard.dataset.code = set.code;
    
    const logoContainer = document.createElement('div');
    logoContainer.className = 'set-logo-container';
    
    // Determine the icon URL
    let iconUrl = null;
    if (set.icon_svg_uri) {
        iconUrl = set.icon_svg_uri;
    } else if (set.svg_uri) {
        iconUrl = set.svg_uri;
    }
    
    // Add logo if available, otherwise create placeholder
    if (iconUrl) {
        const logo = document.createElement('img');
        logo.src = iconUrl;
        logo.alt = `${set.name} icon`;
        logo.className = 'set-logo';
        
        // Add error handling for the image
        logo.onerror = function() {
            this.onerror = null;
            // Replace with placeholder
            const placeholder = document.createElement('div');
            placeholder.className = 'set-logo-placeholder';
            placeholder.textContent = set.code.toUpperCase().slice(0, 2);
            this.parentNode.replaceChild(placeholder, this);
        };
        
        logoContainer.appendChild(logo);
    } else {
        // Create text-based placeholder if no logo
        const placeholder = document.createElement('div');
        placeholder.className = 'set-logo-placeholder';
        placeholder.textContent = set.code.toUpperCase().slice(0, 2);
        logoContainer.appendChild(placeholder);
    }
    
    // Release date formatting
    const releaseDate = new Date(set.released_at);
    const formattedDate = releaseDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
    
    // Set info container
    const setInfo = document.createElement('div');
    setInfo.className = 'set-info';
    
    setInfo.innerHTML = `
        <div class="set-name">${set.name}</div>
        <div class="set-code">${set.code.toUpperCase()}</div>
        <div class="set-date">${formattedDate}</div>
    `;
    
    setCard.appendChild(logoContainer);
    setCard.appendChild(setInfo);
    
    // Add click event to navigate to set.html page
    setCard.addEventListener('click', () => {
        window.location.href = `set.html?code=${set.code}&name=${encodeURIComponent(set.name)}`;
    });
    
    return setCard;
}

// Create a set list item for list view
function createSetListItem(set) {
    const setItem = document.createElement('div');
    setItem.className = 'set-list-item';
    setItem.dataset.code = set.code;
    
    // Icon container
    const iconContainer = document.createElement('div');
    iconContainer.className = 'set-list-icon';
    
    // Determine the icon URL
    let iconUrl = null;
    if (set.icon_svg_uri) {
        iconUrl = set.icon_svg_uri;
    } else if (set.svg_uri) {
        iconUrl = set.svg_uri;
    }
    
    if (iconUrl) {
        const icon = document.createElement('img');
        icon.src = iconUrl;
        icon.alt = `${set.name} icon`;
        icon.className = 'set-icon';
        
        // Add error handling for the image
        icon.onerror = function() {
            this.onerror = null;
            // Replace with placeholder
            const placeholder = document.createElement('div');
            placeholder.className = 'set-logo-placeholder';
            placeholder.textContent = set.code.toUpperCase().slice(0, 2);
            this.parentNode.replaceChild(placeholder, this);
        };
        
        iconContainer.appendChild(icon);
    } else {
        // Create text-based placeholder if no logo
        const placeholder = document.createElement('div');
        placeholder.className = 'set-logo-placeholder';
        placeholder.textContent = set.code.toUpperCase().slice(0, 2);
        iconContainer.appendChild(placeholder);
    }
    
    // Release date formatting
    const releaseDate = new Date(set.released_at);
    const formattedDate = releaseDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
    
    // List info container
    const infoContainer = document.createElement('div');
    infoContainer.className = 'set-list-info';
    
    // Add info content
    infoContainer.innerHTML = `
        <div class="set-list-name">${set.name}</div>
        <div class="set-list-meta">
            <span>${set.code.toUpperCase()}</span>
            <span>${formattedDate}</span>
            <span>${set.card_count} cards</span>
        </div>
    `;
    
    setItem.appendChild(iconContainer);
    setItem.appendChild(infoContainer);
    
    // Add click event to navigate to set.html page
    setItem.addEventListener('click', () => {
        window.location.href = `set.html?code=${set.code}&name=${encodeURIComponent(set.name)}`;
    });
    
    return setItem;
}

// Show card modal with details
function showCardModal(cardIndex) {
    const card = currentCards[cardIndex];
    
    if (!card) return;
    
    // Prepare modal content
    let modalContent = '<div class="modal-body">';
    
    // Card image section
    modalContent += '<div class="card-image-container">';
    
    // Handle double-faced cards
    if (card.card_faces && card.card_faces.length > 0 && !card.image_uris) {
        // Show front face
        modalContent += `<img src="${card.card_faces[0].image_uris.normal}" alt="${card.name} (Front)">`;
        
        // Show back face if it exists
        if (card.card_faces.length > 1 && card.card_faces[1].image_uris) {
            modalContent += `<img src="${card.card_faces[1].image_uris.normal}" alt="${card.name} (Back)" style="margin-top: 15px;">`;
        }
    } else if (card.image_uris) {
        // Regular single-faced card
        modalContent += `<img src="${card.image_uris.normal}" alt="${card.name}">`;
    }
    
    modalContent += '</div>';
    
    // Card details section
    modalContent += '<div class="card-details">';
    
    // Card name and mana cost
    modalContent += `<h3>${card.name}`;
    if (card.mana_cost) {
        modalContent += `<span class="mana-cost">${card.mana_cost}</span>`;
    }
    modalContent += '</h3>';
    
    // Card type
    if (card.type_line) {
        modalContent += `
            <div class="card-property">
                <div class="property-label">Type</div>
                <div class="property-value">${card.type_line}</div>
            </div>
        `;
    }
    
    // Rarity and set
    modalContent += `
        <div class="card-property">
            <div class="property-label">Rarity</div>
            <div class="property-value">${card.rarity.charAt(0).toUpperCase() + card.rarity.slice(1)}</div>
        </div>
    `;
    
    // Power/Toughness for creatures
    if (card.power && card.toughness) {
        modalContent += `
            <div class="card-property">
                <div class="property-label">Power/Toughness</div>
                <div class="property-value">${card.power}/${card.toughness}</div>
            </div>
        `;
    }
    
    // Loyalty for planeswalkers
    if (card.loyalty) {
        modalContent += `
            <div class="card-property">
                <div class="property-label">Loyalty</div>
                <div class="property-value">${card.loyalty}</div>
            </div>
        `;
    }
    
    // Oracle text
    if (card.oracle_text) {
        modalContent += `
            <div class="card-property">
                <div class="property-label">Text</div>
                <div class="property-value card-text">${card.oracle_text.replace(/\n/g, '<br>')}</div>
            </div>
        `;
    } else if (card.card_faces) {
        // Handle split cards text
        card.card_faces.forEach((face, i) => {
            if (face.oracle_text) {
                modalContent += `
                    <div class="card-property">
                        <div class="property-label">${face.name} Text</div>
                        <div class="property-value card-text">${face.oracle_text.replace(/\n/g, '<br>')}</div>
                    </div>
                `;
            }
        });
    }
    
    // Flavor text
    if (card.flavor_text) {
        modalContent += `
            <div class="card-property">
                <div class="property-value flavor-text">${card.flavor_text.replace(/\n/g, '<br>')}</div>
            </div>
        `;
    }
    
    // Artist
    if (card.artist) {
        modalContent += `
            <div class="card-property">
                <div class="property-label">Artist</div>
                <div class="property-value">${card.artist}</div>
            </div>
        `;
    }
    
    // Collector number
    if (card.collector_number) {
        modalContent += `
            <div class="card-property">
                <div class="property-label">Collector Number</div>
                <div class="property-value">${card.collector_number}</div>
            </div>
        `;
    }
    
    modalContent += '</div>'; // Close card-details
    modalContent += '</div>'; // Close modal-body
    
    // Set modal content and show modal
    modalBody.innerHTML = modalContent;
    cardModal.classList.remove('hidden');
    cardModal.classList.add('active');
    
    // Prevent scrolling on the body when modal is open
    document.body.style.overflow = 'hidden';
}

// Close modal function
function closeCardModal() {
    cardModal.classList.remove('active');
    
    // Use setTimeout to match the transition duration
    setTimeout(() => {
        cardModal.classList.add('hidden');
        // Re-enable scrolling
        document.body.style.overflow = '';
    }, 300);
}

// Toggle dropdown visibility
function toggleDropdown(dropdown) {
    // Close all dropdowns first
    document.querySelectorAll('.dropdown-content').forEach(el => {
        if (el !== dropdown) {
            el.classList.remove('show');
        }
    });
    
    // Toggle the clicked dropdown
    dropdown.classList.toggle('show');
}

// Event Listeners

// Close modal event listeners
closeModal.addEventListener('click', closeCardModal);
cardModal.addEventListener('click', (e) => {
    // Close modal when clicking outside the content
    if (e.target === cardModal) {
        closeCardModal();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !cardModal.classList.contains('hidden')) {
        closeCardModal();
    }
});

// Nav tab click handlers
navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        // Update active tab
        navTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // Update filter and display
        currentFilter = tab.dataset.filter;
        applyFiltersAndDisplay();
    });
});

// Filter button click handler
filterButton.addEventListener('click', () => {
    toggleDropdown(filterDropdown);
});

// Sort button click handler
sortButton.addEventListener('click', () => {
    toggleDropdown(sortDropdown);
});

// Filter option click handlers
filterOptions.forEach(option => {
    option.addEventListener('click', () => {
        // Close the dropdown
        option.closest('.dropdown-content').classList.remove('show');
        
        // Apply the selected filter/sort
        if (option.dataset.filter) {
            currentFilter = option.dataset.filter;
            // Update active tab
            navTabs.forEach(tab => {
                tab.classList.toggle('active', tab.dataset.filter === currentFilter);
            });
        } else if (option.dataset.sort) {
            currentSort = option.dataset.sort;
        } else if (option.dataset.year) {
            currentYear = option.dataset.year;
        }
        
        // Update display
        applyFiltersAndDisplay();
    });
});

// View toggle handlers
gridViewButton.addEventListener('click', () => {
    if (currentView !== 'grid') {
        currentView = 'grid';
        gridViewButton.classList.add('active');
        listViewButton.classList.remove('active');
        applyFiltersAndDisplay();
    }
});

listViewButton.addEventListener('click', () => {
    if (currentView !== 'list') {
        currentView = 'list';
        listViewButton.classList.add('active');
        gridViewButton.classList.remove('active');
        applyFiltersAndDisplay();
    }
});

// Close dropdowns when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.dropdown')) {
        document.querySelectorAll('.dropdown-content').forEach(dropdown => {
            dropdown.classList.remove('show');
        });
    }
});

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    // Check if we have a set parameter in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const setCode = urlParams.get('set');
    
    if (setCode && window.location.pathname.endsWith('index.html')) {
        // We're on the index page with a set parameter
        // Redirect to the set.html page instead of showing cards directly
        
        // First fetch sets to get the set name if needed
        let setName = urlParams.get('name') || '';
        
        if (!setName) {
            // Try to get the set name from sets data
            fetchSets().then(() => {
                const set = allSets.find(s => s.code === setCode);
                if (set) {
                    setName = set.name;
                    // Now redirect to set.html
                    window.location.href = `set.html?code=${setCode}&name=${encodeURIComponent(setName)}`;
                }
            });
        } else {
            // We already have both code and name, redirect directly
            window.location.href = `set.html?code=${setCode}&name=${encodeURIComponent(setName)}`;
        }
    } else {
        // Normal initialization without a specific set, or we're on the set.html page
        fetchSets();
    }
}); 