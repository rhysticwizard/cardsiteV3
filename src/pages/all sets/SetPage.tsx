import React, { useState, useEffect } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import './styles.css';

interface Card {
  id: string;
  name: string;
  rarity: string;
  layout: string;
  colors?: string[];
  image_uris?: {
    normal: string;
    [key: string]: string;
  };
  card_faces?: Array<{
    name: string;
    image_uris?: {
      normal: string;
      [key: string]: string;
    };
  }>;
  set_name?: string;
  set?: string;
}

const SetPage: React.FC = () => {
  const { setCode } = useParams<{ setCode: string }>();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const setName = queryParams.get('name') || '';

  // State
  const [currentCards, setCurrentCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  
  // API URLs
  const SCRYFALL_BASE_URL = 'https://api.scryfall.com';
  const CORS_PROXY = 'https://corsproxy.io/?';
  const [useCorsProxy, setUseCorsProxy] = useState(false);

  const getApiUrl = (endpoint: string) => {
    const baseUrl = useCorsProxy ? CORS_PROXY + encodeURIComponent(SCRYFALL_BASE_URL) : SCRYFALL_BASE_URL;
    return `${baseUrl}${endpoint}`;
  };

  const getCardsUrl = (code: string) => {
    return getApiUrl(`/cards/search?order=set&q=e:${code}`);
  };

  // Toggle CORS proxy and retry
  const toggleCorsProxyAndRetry = () => {
    setUseCorsProxy(!useCorsProxy);
  };

  // Fetch and display cards for a set
  const fetchAndDisplayCards = async (code: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      let hasMore = true;
      let nextPage = getCardsUrl(code);
      let allCards: Card[] = [];
      
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
          if (hasMore && useCorsProxy && !nextPage.includes(CORS_PROXY)) {
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
        const rarityDiff = (rarityOrder[a.rarity as keyof typeof rarityOrder] || 99) - 
                          (rarityOrder[b.rarity as keyof typeof rarityOrder] || 99);
        
        if (rarityDiff !== 0) return rarityDiff;
        
        // Then by color identity
        const colorOrder = (card: Card) => {
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
      
      // Store current cards in state
      setCurrentCards(allCards);
      setIsLoading(false);
    } catch (error: any) {
      console.error('Error fetching cards:', error);
      
      // Check for CORS-related errors
      let errorMessage = 'Failed to load cards.';
      
      if (error.message.includes('NetworkError') || 
          error.message.includes('CORS') || 
          error.message.includes('Failed to fetch')) {
        if (!useCorsProxy) {
          errorMessage = 'Network error: This might be a CORS issue. Try enabling the CORS proxy.';
        } else {
          errorMessage = 'Network error: Could not connect to API even with CORS proxy.';
        }
      }
      
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  // Show demo mode message
  const showDemoModeMessage = () => {
    setIsDemoMode(true);
    setIsLoading(false);
  };

  // Disable demo mode
  const disableDemoMode = () => {
    localStorage.removeItem('isDemoMode');
    setIsDemoMode(false);
    if (setCode) {
      fetchAndDisplayCards(setCode);
    }
  };

  useEffect(() => {
    // Check if in demo mode
    const demoMode = localStorage.getItem('isDemoMode') === 'true';
    setIsDemoMode(demoMode);
    
    // Set document title
    document.title = `${setName} | Magic: The Gathering`;
    
    if (demoMode) {
      showDemoModeMessage();
    } else if (setCode) {
      fetchAndDisplayCards(setCode);
    }
  }, [setCode, setName]);

  // Refetch when CORS proxy setting changes
  useEffect(() => {
    if (!isLoading && !isDemoMode && setCode) {
      fetchAndDisplayCards(setCode);
    }
  }, [useCorsProxy]);

  // Render card grid item
  const renderCardItem = (card: Card, index: number) => {
    // Skip cards without images or double-faced card backs
    if ((!card.image_uris && !card.card_faces) || 
        (card.layout === 'transform' && index > 0 && currentCards[index-1]?.name === card.name)) {
      return null;
    }
    
    // Use the normal image if available, otherwise use the first face of a double-faced card
    const imageUrl = card.image_uris ? 
      card.image_uris.normal : 
      (card.card_faces && card.card_faces[0].image_uris ? 
        card.card_faces[0].image_uris.normal : 
        '');
    
    if (imageUrl) {
      return (
        <Link 
          key={card.id}
          to={`/card/${card.id}?set=${setCode}`} 
          className="card-item"
          onClick={() => {
            // Save card info in localStorage so the card page can access it
            localStorage.setItem('currentCard', JSON.stringify(card));
            localStorage.setItem('currentSetName', setName);
          }}
        >
          <img 
            src={imageUrl} 
            alt={card.name} 
            loading="lazy" 
            width="265" 
            height="370" 
          />
        </Link>
      );
    }
    
    return null;
  };

  return (
    <main>
      <div className="header">
        <div className="breadcrumb-container">
          <div className="breadcrumbs">
            <Link to="/sets" className="breadcrumb-item home-link">All Sets</Link>
            <span className="breadcrumb-separator">&gt;</span>
            <span id="set-breadcrumb" className="breadcrumb-item active">{setName}</span>
          </div>
        </div>
      </div>

      <div id="set-details-container">
        <div className="cards-content">
          <h2 id="set-title">{setName}</h2>
          {!isLoading && !error && !isDemoMode && currentCards.length > 0 && (
            <div className="cards-header">
              Revealed {new Date().toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </div>
          )}
          <div id="cards-grid">
            {isLoading ? (
              <span className="loading">Loading cards...</span>
            ) : error ? (
              <div className="error">
                {error}
                <button onClick={toggleCorsProxyAndRetry} className="retry-button">
                  <i className="fas fa-shield-alt"></i> {useCorsProxy ? 'Disable' : 'Enable'} CORS Proxy
                </button>
              </div>
            ) : isDemoMode ? (
              <div className="demo-card-message">
                <i className="fas fa-info-circle"></i>
                <h3>Demo Mode Active</h3>
                <p>Card data is not available in demo mode.</p>
                <div className="demo-card-actions">
                  <button onClick={disableDemoMode} className="retry-button">
                    <i className="fas fa-sync-alt"></i> Switch to Live Data
                  </button>
                </div>
              </div>
            ) : currentCards.length === 0 ? (
              <div className="no-results">No cards found for this set.</div>
            ) : (
              currentCards.map((card, index) => renderCardItem(card, index))
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default SetPage; 