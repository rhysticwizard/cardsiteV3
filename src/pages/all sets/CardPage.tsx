import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import './styles.css';

// Interface for card objects
interface Card {
  id: string;
  name: string;
  type_line?: string;
  oracle_text?: string;
  flavor_text?: string;
  mana_cost?: string;
  cmc?: number;
  rarity?: string;
  power?: string;
  toughness?: string;
  loyalty?: string;
  set_name?: string;
  set?: string;
  collector_number?: string;
  artist?: string;
  layout?: string;
  colors?: string[];
  color_identity?: string[];
  legalities?: Record<string, string>;
  prices?: Record<string, string | null>;
  scryfall_uri?: string;
  image_uris?: {
    normal: string;
    large: string;
    png: string;
    [key: string]: string;
  };
  card_faces?: Array<{
    name: string;
    type_line?: string;
    oracle_text?: string;
    flavor_text?: string;
    mana_cost?: string;
    image_uris?: {
      normal: string;
      large: string;
      png: string;
      [key: string]: string;
    };
  }>;
  rulings_uri?: string;
}

// Interface for card printings
interface CardPrinting {
  id: string;
  set: string;
  set_name: string;
  set_uri: string;
  object: string;
  name: string;
  collector_number: string;
  image_uris?: {
    normal: string;
    [key: string]: string;
  };
  card_faces?: Array<{
    image_uris?: {
      normal: string;
      [key: string]: string;
    };
  }>;
}

// MTG Wiki URL and notable characters data
const MTG_WIKI_BASE_URL = 'https://mtg.fandom.com/wiki/';

// Notable characters that have wiki pages - simplified for this example
const NOTABLE_CHARACTERS: Record<string, boolean> = {
  'jace beleren': true,
  'liliana vess': true,
  'chandra nalaar': true,
  'nissa revane': true,
  'gideon jura': true,
  'ajani goldmane': true,
  'teferi': true,
  'kaya': true,
  'sorin markov': true,
  'nicol bolas': true,
  'ugin': true,
};

const CardPage: React.FC = () => {
  // Get URL params
  const { cardId } = useParams<{ cardId: string }>();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const setCode = queryParams.get('set') || '';

  // State
  const [card, setCard] = useState<Card | null>(null);
  const [setName, setSetName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cardPrintings, setCardPrintings] = useState<CardPrinting[]>([]);
  const [hasWikiLink, setHasWikiLink] = useState(false);
  const [wikiUrl, setWikiUrl] = useState<string>('');
  const [loadPrintings, setLoadPrintings] = useState(false);
  // Add modal state
  const [showModal, setShowModal] = useState(false);
  const [modalImage, setModalImage] = useState<string>('');

  // API URLs
  const SCRYFALL_BASE_URL = 'https://api.scryfall.com';
  const CORS_PROXY = 'https://corsproxy.io/?';
  const [useCorsProxy, setUseCorsProxy] = useState(false);

  const getApiUrl = (endpoint: string) => {
    const baseUrl = useCorsProxy ? CORS_PROXY + encodeURIComponent(SCRYFALL_BASE_URL) : SCRYFALL_BASE_URL;
    return `${baseUrl}${endpoint}`;
  };

  // Check if a card is a notable character
  const isNotableCharacter = (cardName: string) => {
    // Clean up the name for lookup
    const cleanName = cardName.toLowerCase()
      .replace(/,.*$/, '') // Remove anything after a comma
      .replace(/\s+the\s+.*$/, '') // Remove "the" and anything after it
      .trim();
    
    // Check if the clean name or the full lowercase name is in our list
    return NOTABLE_CHARACTERS[cleanName] || NOTABLE_CHARACTERS[cardName.toLowerCase()];
  };

  // Get wiki URL for a character
  const getWikiUrl = (cardName: string) => {
    // Extract the main part of the name (before any comma)
    const mainName = cardName.split(',')[0].trim();
    
    // Create URL-friendly name
    const urlName = mainName.replace(/\s+/g, '_');
    
    return `${MTG_WIKI_BASE_URL}${urlName}`;
  };

  // Fetch card data from API or localStorage
  const fetchCardData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Check if we have the card data in localStorage
      const storedCard = localStorage.getItem('currentCard');
      const storedSetName = localStorage.getItem('currentSetName');
      
      if (storedCard && cardId) {
        const parsedCard = JSON.parse(storedCard);
        
        // Verify this is the correct card
        if (parsedCard.id === cardId) {
          setCard(parsedCard);
          if (storedSetName) {
            setSetName(storedSetName);
          }
          
          // Check if character has a wiki page
          if (isNotableCharacter(parsedCard.name)) {
            setHasWikiLink(true);
            setWikiUrl(getWikiUrl(parsedCard.name));
          }
          
          // Don't fetch printings immediately
          setLoadPrintings(true);
          
          setIsLoading(false);
          return;
        }
      }
      
      // If we don't have the data or it's not the right card, fetch it from API
      if (cardId) {
        const apiUrl = getApiUrl(`/cards/${cardId}`);
        const response = await fetch(apiUrl);
        
        if (response.ok) {
          const cardData = await response.json();
          
          // Get set name for breadcrumb
          let setNameFromAPI = cardData.set_name;
          
          // Store card data
          setCard(cardData);
          if (setNameFromAPI) {
            setSetName(setNameFromAPI);
          }
          
          // Check if character has a wiki page
          if (isNotableCharacter(cardData.name)) {
            setHasWikiLink(true);
            setWikiUrl(getWikiUrl(cardData.name));
          }
          
          // Don't fetch printings immediately
          setLoadPrintings(true);
        } else {
          throw new Error(`API request failed with status ${response.status}`);
        }
      } else {
        throw new Error('No card ID provided');
      }
    } catch (error: any) {
      console.error('Error fetching card:', error);
      setError(`Failed to load card: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch all printings of a card
  const fetchCardPrintings = async (cardName: string, currentCardId: string) => {
    try {
      // Encode the card name for the URL
      const encodedName = encodeURIComponent(`!"${cardName}"`);
      const apiUrl = getApiUrl(`/cards/search?q=${encodedName}&unique=prints`);
      
      const response = await fetch(apiUrl);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.data && Array.isArray(data.data)) {
          // Filter out the current card
          const otherPrintings = data.data.filter((printing: CardPrinting) => printing.id !== currentCardId);
          setCardPrintings(otherPrintings);
        }
      } else {
        console.error('Error fetching printings:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching printings:', error);
    }
  };

  // Toggle CORS proxy and retry
  const toggleCorsProxyAndRetry = () => {
    setUseCorsProxy(!useCorsProxy);
  };

  // Initial data fetch
  useEffect(() => {
    fetchCardData();
  }, [cardId]);

  // Lazy load printings when user has been viewing the card for a bit
  useEffect(() => {
    let printingsTimer: NodeJS.Timeout;
    
    if (loadPrintings && card) {
      // Delay loading of printings to improve initial load time
      printingsTimer = setTimeout(() => {
        fetchCardPrintings(card.name, card.id);
      }, 2000); // 2-second delay
    }
    
    return () => {
      if (printingsTimer) {
        clearTimeout(printingsTimer);
      }
    };
  }, [loadPrintings, card]);

  // Refetch when CORS proxy setting changes
  useEffect(() => {
    if (!isLoading && cardId) {
      fetchCardData();
    }
  }, [useCorsProxy]);

  // Open image modal
  const openImageModal = (imageUrl: string) => {
    setModalImage(imageUrl);
    setShowModal(true);
    // Prevent scrolling when modal is open
    document.body.style.overflow = 'hidden';
  };

  // Close image modal
  const closeImageModal = () => {
    setShowModal(false);
    // Re-enable scrolling
    document.body.style.overflow = '';
  };

  // Render card details
  const renderCardDetails = () => {
    if (!card) return null;
    
    // Get card image URL
    const imageUrl = card.image_uris ? 
      card.image_uris.normal : 
      (card.card_faces && card.card_faces[0].image_uris ? 
        card.card_faces[0].image_uris.normal : 
        '');
    
    // Get backface image if it exists
    const backImageUrl = (card.card_faces && card.card_faces[1] && card.card_faces[1].image_uris) ? 
      card.card_faces[1].image_uris.normal : null;
    
    // Format card properties
    const typeLine = card.type_line || '';
    const rarity = card.rarity ? card.rarity.charAt(0).toUpperCase() + card.rarity.slice(1) : '';
    const set = card.set_name || '';
    const collectorNumber = card.collector_number || '';
    const artist = card.artist || '';
    
    // Card text (may be from either main card or first face)
    const oracleText = card.oracle_text || (card.card_faces && card.card_faces[0].oracle_text ? card.card_faces[0].oracle_text : '');
    const flavorText = card.flavor_text || (card.card_faces && card.card_faces[0].flavor_text ? card.card_faces[0].flavor_text : '');
    
    // Stats (power/toughness or loyalty)
    const hasPowerToughness = card.power && card.toughness;
    const hasLoyalty = card.loyalty;
    
    // Price data
    const usdPrice = card.prices?.usd || null;
    const usdFoilPrice = card.prices?.usd_foil || null;
    const usdEtchedPrice = card.prices?.usd_etched || null;
    
    return (
      <div className="card-page-content">
        <div className="card-page-layout">
          <div className="card-page-image">
            {imageUrl && <img src={imageUrl} alt={card.name} onClick={() => openImageModal(imageUrl)} style={{cursor: 'pointer'}} />}
            {backImageUrl && <img src={backImageUrl} alt={`${card.name} (back face)`} className="card-backface" onClick={() => openImageModal(backImageUrl)} style={{cursor: 'pointer'}} />}
          </div>
          
          <div className="card-page-info">
            <h1>{card.name}</h1>
            
            {hasWikiLink && (
              <div className="wiki-link">
                <a href={wikiUrl} target="_blank" rel="noopener noreferrer" className="character-wiki-link">
                  <i className="fas fa-book"></i> Read about this character on MTG Wiki
                </a>
              </div>
            )}
            
            <div className="info-row">
              <div className="info-item type">{typeLine}</div>
              <div className="info-item rarity">{rarity}</div>
              {hasPowerToughness && <div className="info-item stats">{card.power}/{card.toughness}</div>}
              {hasLoyalty && <div className="info-item loyalty">Loyalty: {card.loyalty}</div>}
            </div>
            
            <div className="info-row secondary">
              <div className="card-property">
                <span className="property-label">Set:</span>
                <span className="property-value">{set}</span>
              </div>
              <div className="card-property">
                <span className="property-label">Number:</span>
                <span className="property-value">{collectorNumber}</span>
              </div>
              <div className="card-property">
                <span className="property-label">Artist:</span>
                <span className="property-value">{artist}</span>
              </div>
            </div>
            
            {oracleText && (
              <div className="card-text">
                {oracleText.split('\n').map((paragraph, index) => (
                  <p key={index} dangerouslySetInnerHTML={{ __html: paragraph.replace(/\{([^}]+)\}/g, '<i>$1</i>') }} />
                ))}
              </div>
            )}
            
            {flavorText && (
              <div className="flavor-text">
                {flavorText.split('\n').map((paragraph, index) => (
                  <p key={index}><em>{paragraph}</em></p>
                ))}
              </div>
            )}
            
            <div className="info-sections">
              <div className="info-section">
                <div className="info-section-title">Format Legality</div>
                <div className="format-tags">
                  {card.legalities && Object.entries(card.legalities).map(([format, legality]) => (
                    <div key={format} className={`format-tag ${legality}`}>
                      {format.charAt(0).toUpperCase() + format.slice(1)}: {legality}
                    </div>
                  ))}
                </div>
              </div>
              
              {(usdPrice || usdFoilPrice || usdEtchedPrice) && (
                <div className="info-section">
                  <div className="info-section-title">Prices</div>
                  <div className="price-tags">
                    {usdPrice && (
                      <div className="price-tag">
                        Regular: ${parseFloat(usdPrice).toFixed(2)}
                      </div>
                    )}
                    {usdFoilPrice && (
                      <div className="price-tag">
                        Foil: ${parseFloat(usdFoilPrice).toFixed(2)}
                      </div>
                    )}
                    {usdEtchedPrice && (
                      <div className="price-tag">
                        Etched: ${parseFloat(usdEtchedPrice).toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div className="info-section">
                <div className="info-section-title">External Links</div>
                <div className="external-links">
                  {card.scryfall_uri && (
                    <a href={card.scryfall_uri} target="_blank" rel="noopener noreferrer" className="scryfall-link">
                      <i className="fas fa-external-link-alt"></i> View on Scryfall
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {cardPrintings.length > 0 && (
          <div className="other-printings">
            <h2>Other Printings</h2>
            <div className="printings-grid">
              {cardPrintings.map(printing => {
                const printingImageUrl = printing.image_uris ? 
                  printing.image_uris.normal : 
                  (printing.card_faces && printing.card_faces[0].image_uris ? 
                    printing.card_faces[0].image_uris.normal : 
                    '');
                
                if (printingImageUrl) {
                  return (
                    <Link 
                      key={printing.id}
                      to={`/card/${printing.id}?set=${printing.set}`} 
                      className="printing-card"
                    >
                      <img src={printingImageUrl} alt={printing.name} />
                      <div className="printing-set-name">{printing.set_name}</div>
                    </Link>
                  );
                }
                return null;
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Error component
  const renderError = () => (
    <div className="error-link">
      <i className="fas fa-exclamation-triangle"></i>
      <p>{error}</p>
      <button onClick={toggleCorsProxyAndRetry} className="retry-button">
        <i className="fas fa-shield-alt"></i> {useCorsProxy ? 'Disable' : 'Enable'} CORS Proxy
      </button>
    </div>
  );

  return (
    <main>
      <div className="header">
        <div className="breadcrumb-container">
          <div className="breadcrumbs">
            <Link to="/sets" className="breadcrumb-item home-link">All Sets</Link>
            <span className="breadcrumb-separator">&gt;</span>
            <Link to={`/sets/${setCode}?name=${encodeURIComponent(setName)}`} className="breadcrumb-item">
              {setName}
            </Link>
            <span className="breadcrumb-separator">&gt;</span>
            <span id="card-breadcrumb" className="breadcrumb-item active">
              {card ? card.name : 'Loading...'}
            </span>
          </div>
        </div>
      </div>

      <div id="card-details-container">
        <div className="card-page">
          {isLoading ? (
            <span className="loading">Loading cards...</span>
          ) : error ? (
            renderError()
          ) : (
            renderCardDetails()
          )}
        </div>
      </div>
      
      {/* Image Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeImageModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ background: 'transparent', boxShadow: 'none' }}>
            <img src={modalImage} alt="Enlarged Card Image" className="enlarged-image" />
          </div>
        </div>
      )}
    </main>
  );
};

export default CardPage; 