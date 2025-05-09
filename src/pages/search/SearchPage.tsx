import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faTimes, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { useSearchParams, useNavigate } from 'react-router-dom';
import ScryfallAPI, { Card } from '../../utils/ScryfallAPI';
import './SearchPage.css';

const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const navigate = useNavigate();
  
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [hasSearched, setHasSearched] = useState(!!initialQuery); // Track if a search has been performed
  const [suggestions, setSuggestions] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const [searchResults, setSearchResults] = useState<Card[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const lastSearchRef = useRef<string>(''); // Track last successful search query
  
  // Initialize API connection
  useEffect(() => {
    // Add click outside handler to close suggestions
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        searchInputRef.current && 
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Perform search when initialQuery is available
  useEffect(() => {
    if (initialQuery && !isLoading) {
      // Only perform initial search if we have a query and we're not already loading
      handleSearch();
    }
  }, [initialQuery]); // Remove isLoading dependency to prevent loops
  
  // Generate suggestions based on input
  useEffect(() => {
    const getSuggestions = async () => {
      if (!searchQuery.trim() || searchQuery.length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }
      
      setIsFetchingSuggestions(true);
      
      try {
        // Use direct API auto-complete endpoint
        const autocompleteUrl = `${ScryfallAPI.baseUrl}/cards/autocomplete?q=${encodeURIComponent(searchQuery.trim())}`;
        const autocompleteResponse = await fetch(autocompleteUrl);
        
        if (autocompleteResponse.ok) {
          const data = await autocompleteResponse.json();
          if (data.data && data.data.length > 0) {
            // Convert autocomplete data to Card objects with at least an id and name
            const cardSuggestions = data.data.slice(0, 5).map((name: string, index: number) => ({
              id: `suggestion-${index}`,
              name: name
            }));
            
            setSuggestions(cardSuggestions);
            setShowSuggestions(true);
          } else {
            setSuggestions([]);
            setShowSuggestions(false);
          }
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } catch (error) {
        console.error('Error getting suggestions:', error);
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setIsFetchingSuggestions(false);
      }
    };
    
    // Debounce the suggestions request
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        getSuggestions();
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);
  
  // Handle search submission
  const handleSearch = async () => {
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) return;
    
    // Prevent duplicate searches
    if (trimmedQuery === lastSearchRef.current && searchResults.length > 0) {
      return;
    }
    
    // Only update URL if the query has changed
    const currentQueryParam = searchParams.get('q');
    if (currentQueryParam !== trimmedQuery) {
      setSearchParams({ q: trimmedQuery });
    }
    
    // Prevent searching if already loading
    if (isLoading) return;
    
    setIsLoading(true);
    setShowSuggestions(false);
    setHasSearched(true); // Mark that a search has been performed
    
    try {
      // Use Scryfall API search
      const response = await ScryfallAPI.searchCards(trimmedQuery);
      
      if (response.data && response.data.length > 0) {
        setSearchResults(response.data);
        lastSearchRef.current = trimmedQuery; // Update last search reference
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching cards:', error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle search input changes
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (hasSearched && e.target.value.trim() === '') {
      // Clear results if user clears search query after having searched
      setSearchResults([]);
      setHasSearched(false);
    }
  };
  
  // Handle suggestion selection
  const handleSuggestionSelect = (card: Card) => {
    setSearchQuery(card.name);
    setSuggestions([]);
    setShowSuggestions(false);
    
    // Trigger search immediately when suggestion is selected
    setTimeout(() => {
      handleSearch();
    }, 100);
    
    // Focus back on the input
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };
  
  // Handle card selection
  const handleCardSelect = (card: Card) => {
    // Save card info to localStorage for the card page
    localStorage.setItem('currentCard', JSON.stringify(card));
    localStorage.setItem('currentSetName', card.set_name || '');
    
    // Navigate to the card page
    navigate(`/card/${card.id}?set=${card.set}`);
  };
  
  // Handle clear search
  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSearchParams({});
    setShowSuggestions(false);
    setHasSearched(false); // Reset search state
    lastSearchRef.current = ''; // Reset last search reference
    
    // Focus back on the input
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };
  
  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    } else if (e.key === 'ArrowDown' && showSuggestions && suggestions.length > 0) {
      // Focus the first suggestion item when pressing arrow down
      const suggestionItems = suggestionsRef.current?.querySelectorAll('.suggestion-item');
      if (suggestionItems && suggestionItems.length > 0) {
        (suggestionItems[0] as HTMLElement).focus();
      }
    }
  };

  // Handle keyboard navigation in the suggestions dropdown
  const handleSuggestionKeyDown = (e: React.KeyboardEvent<HTMLDivElement>, card: Card, index: number) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const suggestionItems = suggestionsRef.current?.querySelectorAll('.suggestion-item');
      if (suggestionItems && index < suggestionItems.length - 1) {
        (suggestionItems[index + 1] as HTMLElement).focus();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const suggestionItems = suggestionsRef.current?.querySelectorAll('.suggestion-item');
      if (index > 0 && suggestionItems) {
        (suggestionItems[index - 1] as HTMLElement).focus();
      } else if (index === 0) {
        // Focus back to search input if we're at the first suggestion
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSuggestionSelect(card);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setShowSuggestions(false);
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }
  };
  
  // Handle input focus to show suggestions
  const handleInputFocus = () => {
    if (searchQuery.trim() && suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };
  
  return (
    <div className="search-page">
      <div className="search-container">
        <div className="search-input-wrapper">
          <input
            ref={searchInputRef}
            type="text"
            className="search-input"
            placeholder="Search for a Magic card..."
            value={searchQuery}
            onChange={handleSearchInputChange}
            onKeyDown={handleKeyPress}
            onFocus={handleInputFocus}
            aria-label="Search for cards"
            aria-autocomplete="list"
            aria-controls={showSuggestions ? "suggestions-list" : undefined}
            aria-expanded={showSuggestions}
          />
          
          {searchQuery && (
            <button 
              className="clear-search-btn" 
              onClick={handleClearSearch}
              aria-label="Clear search"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          )}
          
          <button 
            className="search-btn" 
            onClick={handleSearch}
            disabled={isLoading || !searchQuery.trim()}
            aria-label="Search"
          >
            {isLoading ? (
              <FontAwesomeIcon icon={faSpinner} spin />
            ) : (
              <FontAwesomeIcon icon={faSearch} />
            )}
          </button>
          
          {/* Suggestions dropdown */}
          {showSuggestions && (
            <div 
              ref={suggestionsRef} 
              className="suggestions-dropdown"
              role="listbox"
              id="suggestions-list"
            >
              {isFetchingSuggestions ? (
                <div className="suggestion-loading">Loading suggestions...</div>
              ) : suggestions.length > 0 ? (
                suggestions.map((card, index) => (
                  <div
                    key={card.id}
                    className="suggestion-item"
                    onClick={() => handleSuggestionSelect(card)}
                    onKeyDown={(e) => handleSuggestionKeyDown(e, card, index)}
                    role="option"
                    tabIndex={0}
                    aria-selected={false}
                  >
                    {card.name}
                  </div>
                ))
              ) : (
                <div className="no-suggestions">No matching cards found</div>
              )}
            </div>
          )}
        </div>
      </div>
      
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
            ) : hasSearched && searchQuery ? (
              <div className="no-results">
                <p>No cards found matching "{searchQuery}"</p>
                <p className="no-results-suggestion">Try adjusting your search term or checking for spelling errors.</p>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
};

export default SearchPage; 