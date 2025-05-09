// DOM Elements
const cardDetailsContainer = document.getElementById('card-details-container');
const cardPageContent = document.querySelector('.card-page-content');
const setBreadcrumb = document.getElementById('set-breadcrumb');
const cardBreadcrumb = document.getElementById('card-breadcrumb');

// API URLs
const SCRYFALL_BASE_URL = 'https://api.scryfall.com';
const CORS_PROXY = 'https://corsproxy.io/?';
let USE_CORS_PROXY = false;

// MTG Wiki base URL
const MTG_WIKI_BASE_URL = 'https://mtg.fandom.com/wiki/';

// Notable characters that have wiki pages
const NOTABLE_CHARACTERS = {
    // Planeswalkers
    'jace beleren': true,
    'liliana vess': true,
    'chandra nalaar': true,
    'nissa revane': true,
    'gideon jura': true,
    'ajani goldmane': true,
    'teferi': true,
    'kaya': true,
    'sorin markov': true,
    'nahiri': true,
    'tamiyo': true,
    'tezzeret': true,
    'nicol bolas': true,
    'ugin': true,
    'karn': true,
    'vivien reid': true,
    'ral zarek': true,
    'narset': true,
    'vraska': true,
    'sarkhan vol': true,
    'garruk wildspeaker': true,
    'elspeth tirel': true,
    'dovin baan': true,
    'saheeli rai': true,
    'huatli': true,
    
    // Legendary creatures with lore significance
    'ragavan': true,
    'thalia': true,
    'gisa': true,
    'geralf': true,
    'avacyn': true,
    'bruna': true,
    'gisela': true,
    'sigarda': true,
    'odric': true,
    'olivia voldaren': true,
    'emrakul': true,
    'kozilek': true,
    'ulamog': true,
    'niv-mizzet': true,
    'emmara tandris': true,
    'lazav': true,
    'borborygmos': true,
    'isperia': true,
    'rakdos': true,
    'trostani': true,
    'aurelia': true,
    'zacama': true,
    'ghalta': true,
    'azusa': true,
    'azor': true,
    'teysa karlov': true,
    'judith': true,
    'gishath': true,
    'kambal': true,
    'kumena': true
};

function getApiUrl(endpoint) {
    const baseUrl = USE_CORS_PROXY ? CORS_PROXY + encodeURIComponent(SCRYFALL_BASE_URL) : SCRYFALL_BASE_URL;
    return `${baseUrl}${endpoint}`;
}

// Check if a card is a notable character
function isNotableCharacter(cardName) {
    // Clean up the name for lookup
    const cleanName = cardName.toLowerCase()
        .replace(/,.*$/, '') // Remove anything after a comma (e.g., "Ragavan, Nimble Pilferer" -> "Ragavan")
        .replace(/\s+the\s+.*$/, '') // Remove "the" and anything after it (e.g., "Thalia, Guardian of Thraben" -> "Thalia")
        .trim();
    
    // Check if the clean name or the full lowercase name is in our list
    return NOTABLE_CHARACTERS[cleanName] || NOTABLE_CHARACTERS[cardName.toLowerCase()];
}

// Get wiki URL for a character
function getWikiUrl(cardName) {
    // Extract the main part of the name (before any comma)
    const mainName = cardName.split(',')[0].trim();
    
    // Create URL-friendly name (e.g., "Nicol Bolas" -> "Nicol_Bolas")
    const urlName = mainName.replace(/\s+/g, '_');
    
    return `${MTG_WIKI_BASE_URL}${urlName}`;
}

// Fetch character data from MTG Wiki API
async function fetchWikiData(characterName) {
    try {
        // Create URL-friendly name
        const urlName = characterName.split(',')[0].trim().replace(/\s+/g, '_');
        
        // Use the MediaWiki API to get basic page info
        const apiUrl = `https://mtg.fandom.com/api.php?action=parse&page=${urlName}&prop=text&format=json&origin=*`;
        
        const response = await fetch(apiUrl);
        if (!response.ok) return null;
        
        const data = await response.json();
        
        // Check if page exists
        if (data.error) return null;
        
        return {
            url: `${MTG_WIKI_BASE_URL}${urlName}`,
            exists: true
        };
    } catch (error) {
        console.error('Error fetching wiki data:', error);
        return null;
    }
}

// Check if a character wiki page exists with API verification
async function verifyAndDisplayWikiLink(cardName, containerElement) {
    // First check our predefined list for a quick response
    if (isNotableCharacter(cardName)) {
        try {
            // Try to fetch real data from the wiki to verify the link works
            const wikiData = await fetchWikiData(cardName);
            
            if (wikiData && wikiData.exists) {
                // Create and add wiki link element
                const wikiLinkElement = document.createElement('div');
                wikiLinkElement.className = 'wiki-link';
                wikiLinkElement.innerHTML = `
                    <a href="${wikiData.url}" target="_blank" class="character-wiki-link">
                        <i class="fas fa-book"></i> Read about this character on MTG Wiki
                    </a>
                `;
                
                // Insert after the card name
                if (containerElement) {
                    const cardNameHeading = containerElement.querySelector('h1');
                    if (cardNameHeading) {
                        cardNameHeading.insertAdjacentElement('afterend', wikiLinkElement);
                    }
                }
            }
        } catch (error) {
            console.error('Error verifying wiki link:', error);
        }
    }
}

// Get card details from URL parameters
function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        set: params.get('set'),
        id: params.get('id')
    };
}

// Fetch card data from API or localStorage
async function fetchCardData() {
    const params = getUrlParams();
    
    // Check if we have the card data in localStorage
    const storedCard = localStorage.getItem('currentCard');
    const setName = localStorage.getItem('currentSetName');
    
    if (storedCard && params.id) {
        const card = JSON.parse(storedCard);
        
        // Verify this is the correct card
        if (card.id === params.id) {
            displayCardData(card, setName);
            return;
        }
    }
    
    // If we don't have the data or it's not the right card, fetch it from API
    if (params.id) {
        try {
            const apiUrl = getApiUrl(`/cards/${params.id}`);
            const response = await fetch(apiUrl);
            
            if (response.ok) {
                const cardData = await response.json();
                
                // Get set name for breadcrumb
                let setName = '';
                if (params.set) {
                    const setResponse = await fetch(getApiUrl(`/sets/${params.set}`));
                    if (setResponse.ok) {
                        const setData = await setResponse.json();
                        setName = setData.name;
                    }
                }
                
                displayCardData(cardData, setName);
            } else {
                showError('Could not fetch card data. Please try again later.');
            }
        } catch (error) {
            console.error('Error fetching card:', error);
            showError('Failed to load card data. Please try again later.');
        }
    } else {
        showError('Invalid card ID. Please go back to the sets view.');
    }
}

// Display card data on the page
function displayCardData(card, setName) {
    if (!card) {
        showError('Card data not found.');
        return;
    }
    
    // Update page title
    document.title = `${card.name} | Magic: The Gathering`;
    
    // Update breadcrumbs
    if (setName) {
        setBreadcrumb.textContent = setName;
        
        // Make set breadcrumb a link back to the set - directly to set.html
        if (card.set) {
            setBreadcrumb.innerHTML = `<a href="set.html?code=${card.set}&name=${encodeURIComponent(setName)}">${setName}</a>`;
        }
    }
    cardBreadcrumb.textContent = card.name;
    
    // Card content HTML
    let cardHTML = '<div class="card-page-layout">';
    
    // Card image section
    cardHTML += '<div class="card-page-image">';
    
    // Handle double-faced cards
    if (card.card_faces && card.card_faces.length > 0 && !card.image_uris) {
        // Show front face
        cardHTML += `<img src="${card.card_faces[0].image_uris.normal}" alt="${card.name} (Front)">`;
        
        // Show back face if it exists
        if (card.card_faces.length > 1 && card.card_faces[1].image_uris) {
            cardHTML += `<img src="${card.card_faces[1].image_uris.normal}" alt="${card.name} (Back)" class="card-backface">`;
        }
    } else if (card.image_uris) {
        // Regular single-faced card
        cardHTML += `<img src="${card.image_uris.normal}" alt="${card.name}">`;
    }
    
    cardHTML += '</div>'; // Close card-page-image
    
    // Card details section
    cardHTML += '<div class="card-page-info">';
    
    // Card name and mana cost
    cardHTML += `<h1>${card.name}`;
    if (card.mana_cost) {
        cardHTML += `<span class="mana-cost">${card.mana_cost}</span>`;
    }
    cardHTML += '</h1>';
    
    // Card type, rarity, collector number row
    cardHTML += '<div class="info-row">';
    
    // Card type
    if (card.type_line) {
        cardHTML += `<div class="info-item type">${card.type_line}</div>`;
    }
    
    // Rarity
    cardHTML += `<div class="info-item rarity">${card.rarity.charAt(0).toUpperCase() + card.rarity.slice(1)}</div>`;
    
    // Power/Toughness or Loyalty
    if (card.power && card.toughness) {
        cardHTML += `<div class="info-item stats">${card.power}/${card.toughness}</div>`;
    } else if (card.loyalty) {
        cardHTML += `<div class="info-item loyalty">${card.loyalty}</div>`;
    }
    
    cardHTML += '</div>'; // Close info-row
    
    // Oracle text
    if (card.oracle_text) {
        cardHTML += `
            <div class="card-property">
                <div class="property-value card-text">${card.oracle_text.replace(/\n/g, '<br>')}</div>
            </div>
        `;
    } else if (card.card_faces) {
        // Handle split cards text
        card.card_faces.forEach((face, i) => {
            if (face.oracle_text) {
                cardHTML += `
                    <div class="card-property">
                        <div class="property-label">${face.name}</div>
                        <div class="property-value card-text">${face.oracle_text.replace(/\n/g, '<br>')}</div>
                    </div>
                `;
            }
        });
    }
    
    // Flavor text
    if (card.flavor_text) {
        cardHTML += `
            <div class="card-property">
                <div class="property-value flavor-text">${card.flavor_text.replace(/\n/g, '<br>')}</div>
            </div>
        `;
    }
    
    // Artist and collector number on one row
    cardHTML += '<div class="info-row secondary">';
    
    if (card.artist) {
        cardHTML += `<div class="info-item">Illus. ${card.artist}</div>`;
    }
    
    if (card.collector_number) {
        cardHTML += `<div class="info-item">#${card.collector_number}</div>`;
    }
    
    cardHTML += '</div>'; // Close secondary info-row
    
    // Legality and pricing in a compact view
    cardHTML += '<div class="info-sections">';
    
    // Legality section
    if (card.legalities) {
        const formatMap = {
            'standard': 'Standard',
            'pioneer': 'Pioneer',
            'modern': 'Modern',
            'legacy': 'Legacy',
            'vintage': 'Vintage',
            'commander': 'Commander',
            'brawl': 'Brawl'
        };
        
        // Filter to just legal formats for more compact display
        const legalFormats = Object.entries(card.legalities)
            .filter(([format, status]) => status === 'legal' && formatMap[format])
            .map(([format]) => formatMap[format]);
        
        if (legalFormats.length > 0) {
            cardHTML += `
                <div class="info-section">
                    <div class="info-section-title">Legal in:</div>
                    <div class="format-tags">
                        ${legalFormats.map(format => `<span class="format-tag legal">${format}</span>`).join('')}
                    </div>
                </div>
            `;
        }
    }
    
    // Prices section
    if (card.prices && (card.prices.usd || card.prices.usd_foil || card.prices.eur)) {
        cardHTML += `
            <div class="info-section">
                <div class="info-section-title">Prices:</div>
                <div class="price-tags">
                    ${card.prices.usd ? `<span class="price-tag">$${card.prices.usd}</span>` : ''}
                    ${card.prices.usd_foil ? `<span class="price-tag">$${card.prices.usd_foil} (Foil)</span>` : ''}
                    ${card.prices.eur ? `<span class="price-tag">€${card.prices.eur}</span>` : ''}
                </div>
            </div>
        `;
    }
    
    cardHTML += '</div>'; // Close info-sections
    
    // Scryfall link
    if (card.scryfall_uri) {
        cardHTML += `
            <div class="external-links">
                <a href="${card.scryfall_uri}" target="_blank" class="scryfall-link">
                    View on Scryfall <i class="fas fa-external-link-alt"></i>
                </a>
            </div>
        `;
    }
    
    cardHTML += '</div>'; // Close card-page-info
    cardHTML += '</div>'; // Close card-page-layout
    
    // Set HTML content
    cardPageContent.innerHTML = cardHTML;
    
    // Add wiki link for notable characters if applicable
    addWikiLinkIfCharacter(card.name);
    
    // Fetch and display other printings of this card
    if (card.name) {
        fetchCardPrintings(card.name, card.id);
    }
}

// Add wiki link for character cards
async function addWikiLinkIfCharacter(cardName) {
    // First try the API approach for dynamically checking if a wiki page exists
    try {
        const wikiData = await fetchWikiData(cardName);
        
        if (wikiData && wikiData.exists) {
            addWikiLinkToDOM(wikiData.url, cardName);
            return;
        }
    } catch (error) {
        console.error('Error with API wiki check:', error);
    }
    
    // Fallback to our predefined list
    if (isNotableCharacter(cardName)) {
        const wikiUrl = getWikiUrl(cardName);
        addWikiLinkToDOM(wikiUrl, cardName);
    }
}

// Helper function to add wiki link to the DOM
function addWikiLinkToDOM(wikiUrl, cardName) {
    const wikiLinkElement = document.createElement('div');
    wikiLinkElement.className = 'wiki-link';
    
    const characterName = cardName.split(',')[0].trim();
    
    wikiLinkElement.innerHTML = `
        <a href="${wikiUrl}" target="_blank" class="character-wiki-link">
            <i class="fas fa-book"></i> Read about ${characterName} on MTG Wiki
        </a>
    `;
    
    // Insert after the card name
    const cardNameHeading = cardPageContent.querySelector('h1');
    if (cardNameHeading) {
        cardNameHeading.insertAdjacentElement('afterend', wikiLinkElement);
    }
}

// Fetch different printings of the same card
async function fetchCardPrintings(cardName, currentCardId) {
    // Create container for other printings with loading indicator
    const printingsContainer = document.createElement('div');
    printingsContainer.className = 'other-printings';
    printingsContainer.innerHTML = `
        <h2>Other Printings</h2>
        <div id="printings-loading" style="text-align: center; padding: 20px;">
            <div style="display: inline-block; width: 30px; height: 30px; border: 3px solid rgba(255,255,255,0.2); 
                 border-radius: 50%; border-top-color: #fff; animation: spin 1s ease-in-out infinite;"></div>
            <p style="margin-top: 10px; color: #aaa;">Loading other printings...</p>
        </div>
    `;
    
    // Add container to the page before starting the fetch
    cardDetailsContainer.appendChild(printingsContainer);
    
    // Add animation style
    if (!document.getElementById('loading-animation-style')) {
        const style = document.createElement('style');
        style.id = 'loading-animation-style';
        style.textContent = `
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }
    
    try {
        const apiUrl = getApiUrl(`/cards/search?q=!"${encodeURIComponent(cardName)}"&unique=prints`);
        const response = await fetch(apiUrl);
        
        if (response.ok) {
            const data = await response.json();
            
            if (data.data && data.data.length > 0) {
                // Filter out the current card from the results
                const otherPrintings = data.data.filter(printedCard => printedCard.id !== currentCardId);
                
                if (otherPrintings.length > 0) {
                    // Remove loading indicator
                    const loadingElement = document.getElementById('printings-loading');
                    if (loadingElement) {
                        loadingElement.remove();
                    }
                    
                    // Create and add the printings grid
                    displayCardPrintings(otherPrintings, printingsContainer);
                    return;
                }
            }
        }
        
        // If we get here, either the request failed or there are no other printings
        printingsContainer.remove(); // Remove the container completely
        
    } catch (error) {
        console.error('Error fetching card printings:', error);
        printingsContainer.remove(); // Remove the container on error
    }
}

// Display different printings of the card
function displayCardPrintings(printings, container) {
    // Create grid for card images
    const printingsGrid = document.createElement('div');
    printingsGrid.className = 'printings-grid';
    
    // Add each printing to the grid
    printings.forEach(printing => {
        // Get card image URL
        let imageUrl;
        if (printing.image_uris) {
            imageUrl = printing.image_uris.normal;
        } else if (printing.card_faces && printing.card_faces[0].image_uris) {
            imageUrl = printing.card_faces[0].image_uris.normal;
        } else {
            return; // Skip if no image available
        }
        
        // Create card element
        const cardElement = document.createElement('div');
        cardElement.className = 'printing-card';
        
        // Make it clickable to view that version
        cardElement.addEventListener('click', () => {
            window.location.href = `card.html?set=${printing.set}&id=${printing.id}`;
            
            // Also store in localStorage for faster loading
            localStorage.setItem('currentCard', JSON.stringify(printing));
            if (printing.set_name) {
                localStorage.setItem('currentSetName', printing.set_name);
            }
        });
        
        // Card image
        const img = document.createElement('img');
        img.src = imageUrl;
        img.alt = `${printing.name} (${printing.set_name})`;
        img.style.width = '100%';
        img.style.borderRadius = '4.75% / 3.5%';
        cardElement.appendChild(img);
        
        // Set name label
        const setLabel = document.createElement('div');
        setLabel.className = 'printing-set-name';
        setLabel.textContent = printing.set_name;
        cardElement.appendChild(setLabel);
        
        printingsGrid.appendChild(cardElement);
    });
    
    container.appendChild(printingsGrid);
}

// Show error message
function showError(message) {
    cardPageContent.innerHTML = `
        <div class="error">
            <i class="fas fa-exclamation-circle"></i>
            <p>${message}</p>
            <a href="index.html" class="error-link">Go to Set List</a>
        </div>
    `;
}

// Initialize
document.addEventListener('DOMContentLoaded', fetchCardData); 