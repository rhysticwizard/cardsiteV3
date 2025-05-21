import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card } from '../../utils/ScryfallAPI'; // ScryfallAPI is not needed directly anymore
import SearchBar from '../../components/SearchBar'; // Import the new SearchBar component
import CardPreview from '../../components/CardPreview'; // Import the CardPreview component
import './SearchPage.css';

const SearchPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialQuery = searchParams.get('q') || '';

  const [searchResults, setSearchResults] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(!!initialQuery);
  
  // State for card preview
  const [previewCard, setPreviewCard] = useState<Card | null>(null);
  const [previewPosition, setPreviewPosition] = useState<{ x: number; y: number } | null>(null);
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Effect to load initial search results from localStorage if available
  useEffect(() => {
    const storedResults = localStorage.getItem('searchResults');
    if (storedResults) {
      setSearchResults(JSON.parse(storedResults));
      localStorage.removeItem('searchResults'); // Clear after loading
    }
  }, []);

  // Effect to manage hasSearched state based on query, results, and loading status
  useEffect(() => {
    if (initialQuery && !isLoading) {
      // If there's a query, and we are not loading, a search has effectively occurred.
      // The presence of results (even an empty array) means the API call finished.
      setHasSearched(true);
    } else if (!initialQuery) {
      // If there's no query (e.g., input cleared and URL updated), reset hasSearched
      setHasSearched(false);
    }
    // We don't need to set hasSearched(false) during loading, as initialQuery might still be present
  }, [initialQuery, isLoading, searchResults]); // Listen to searchResults to re-evaluate when they arrive

  const handleSearchResults = (results: Card[] | null) => {
    if (results === null) {
      setIsLoading(true);
      setSearchResults([]); // Clear previous results
    } else {
      setSearchResults(results);
      setIsLoading(false);
    }
  };

  // Handle card selection from search results
  const handleCardSelect = (card: Card) => {
    localStorage.setItem('currentCard', JSON.stringify(card));
    localStorage.setItem('currentSetName', card.set_name || '');
    navigate(`/card/${card.id}?set=${card.set}`);
  };
  
  // Handle card hover to show preview
  const handleCardMouseEnter = (card: Card, event: React.MouseEvent) => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    
    const targetElement = event.currentTarget;
    hoverTimerRef.current = setTimeout(() => {
      if (!targetElement) return;
      
      const rect = targetElement.getBoundingClientRect();
      const posX = rect.right + 20; // Position to the right of the card
      const posY = rect.top;
      
      setPreviewCard(card);
      setPreviewPosition({ x: posX, y: posY });
    }, 500); // 500ms delay before showing preview
  };
  
  // Cancel preview when mouse leaves card
  const handleCardMouseLeave = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    setPreviewCard(null);
    setPreviewPosition(null);
  };

  return (
    <div className="search-page">
      {/* Use the SearchBar component */}
      <SearchBar 
        onSearch={handleSearchResults} 
        initialQuery={initialQuery} 
        onClearNavigateTo="/sets"
      />
      
      <div className="search-results-container">
        {isLoading ? (
          <div className="loading-indicator">
            <FontAwesomeIcon icon={faSpinner} spin size="2x" />
            <p>Loading cards...</p>
          </div>
        ) : (
          <>
            {searchResults.length > 0 ? (
              <>
                <div className="results-grid">
                  {searchResults.map(card => (
                    <div 
                      key={card.id} 
                      className="card-item"
                      onClick={() => handleCardSelect(card)}
                      onMouseEnter={(e) => handleCardMouseEnter(card, e)}
                      onMouseLeave={handleCardMouseLeave}
                    >
                      {card.image_uris?.normal ? (
                        <img 
                          src={card.image_uris.normal} 
                          alt={card.name} 
                          className="card-image"
                          loading="lazy"
                        />
                      ) : card.card_faces && card.card_faces[0]?.image_uris?.normal ? (
                        <img 
                          src={card.card_faces[0].image_uris.normal} 
                          alt={card.name} 
                          className="card-image"
                          loading="lazy"
                        />
                      ) : (
                        <div className="card-placeholder">
                          <p>{card.name}</p>
                        </div>
                      )}
                      <h3 className="card-name">{card.name}</h3>
                    </div>
                  ))}
                </div>
              </>
            ) : hasSearched && initialQuery ? ( // Check initialQuery to show no results message correctly
              <div className="no-results">
                <p>No cards found matching "{initialQuery}"</p>
                <p className="no-results-suggestion">Try adjusting your search term or checking for spelling errors.</p>
              </div>
            ) : null}
          </>
        )}
      </div>
      
      {/* Add the CardPreview component */}
      <CardPreview card={previewCard} position={previewPosition} />
    </div>
  );
};

export default SearchPage; 