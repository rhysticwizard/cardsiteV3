import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faTimes, faSpinner, faSlidersH, faRandom } from '@fortawesome/free-solid-svg-icons';
import { useSearchParams, useNavigate } from 'react-router-dom';
import ScryfallAPI, { Card } from '../utils/ScryfallAPI';
// import './SearchBar.css';

interface SearchBarProps {
  onSearch?: (results: Card[] | null) => void;
  initialQuery?: string;
  onClearNavigateTo?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, initialQuery = '', onClearNavigateTo }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [hasSearched, setHasSearched] = useState(!!initialQuery);
  const [suggestions, setSuggestions] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [allowSuggestions, setAllowSuggestions] = useState(true);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const lastSearchRef = useRef<string>(''); 

  useEffect(() => {
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

  useEffect(() => {
    if (initialQuery && !isLoading) {
      handleSearch();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  useEffect(() => {
    const getSuggestions = async () => {
      if (!searchQuery.trim() || searchQuery.length < 2 || !allowSuggestions) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }
      
      setIsFetchingSuggestions(true);
      
      try {
        const autocompleteUrl = `${ScryfallAPI.baseUrl}/cards/autocomplete?q=${encodeURIComponent(searchQuery.trim())}`;
        const autocompleteResponse = await fetch(autocompleteUrl);
        
        if (autocompleteResponse.ok) {
          const data = await autocompleteResponse.json();
          if (data.data && data.data.length > 0) {
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
    
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 2 && allowSuggestions) {
        getSuggestions();
      } else if (!allowSuggestions) {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchQuery, allowSuggestions]);
  
  const handleSearch = useCallback(async (queryOverride?: string) => {
    const trimmedQuery = (queryOverride ?? searchQuery).trim();
    if (!trimmedQuery) return;
    
    if (trimmedQuery === lastSearchRef.current && onSearch) {
      return;
    }
    
    const currentQueryParam = searchParams.get('q');
    if (currentQueryParam !== trimmedQuery) {
      setSearchParams({ q: trimmedQuery });
    }
    
    if (isLoading) return;
    
    setIsLoading(true);
    setShowSuggestions(false);
    setAllowSuggestions(false);
    setHasSearched(true); 
    
    if (onSearch) {
      onSearch(null);
    }
    
    try {
      const response = await ScryfallAPI.searchCards(trimmedQuery);
      
      if (onSearch) {
        onSearch(response.data || []);
      } else {
        localStorage.setItem('searchResults', JSON.stringify(response.data || []));
        navigate(`/search?q=${encodeURIComponent(trimmedQuery)}`);
      }
      lastSearchRef.current = trimmedQuery; 
    } catch (error) {
      console.error('Error searching cards:', error);
      if (onSearch) {
        onSearch([]);
      }
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, searchParams, setSearchParams, isLoading, onSearch, navigate]);
  
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const currentInputValue = e.target.value;
    setSearchQuery(currentInputValue);
    setAllowSuggestions(true);

    if (currentInputValue.trim() === '') {
      setShowSuggestions(false);
    }
  };
  
  const handleSuggestionSelect = (card: Card) => {
    setSearchQuery(card.name);
    setShowSuggestions(false);
    setAllowSuggestions(false);
    handleSearch(card.name);
    
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    } else if (e.key === 'ArrowDown' && showSuggestions && suggestions.length > 0) {
      const suggestionItems = suggestionsRef.current?.querySelectorAll('.suggestion-item');
      if (suggestionItems && suggestionItems.length > 0) {
        (suggestionItems[0] as HTMLElement).focus();
      }
    }
  };

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
  
  const handleInputFocus = () => {
    if (allowSuggestions && searchQuery.trim() && suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };
  
  return (
    <div className="search-container">
      <div className="search-controls-container"> 
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
            aria-controls="suggestions-list"
            aria-expanded={showSuggestions && suggestions.length > 0}
            role="textbox"
          />
          {!isLoading && (hasSearched || searchQuery.trim() !== '') && (
            <FontAwesomeIcon 
              icon={faTimes} 
              className="search-icon clear-icon" 
              onClick={() => {
                setSearchQuery('');
                setSuggestions([]);
                setShowSuggestions(false);
                if (onSearch) {
                  onSearch([]);
                }
                setHasSearched(false); 
                if (searchInputRef.current) {
                  searchInputRef.current.focus();
                }
                setSearchParams(prev => {
                  const newParams = new URLSearchParams(prev);
                  newParams.delete('q');
                  return newParams;
                }, { replace: true });
                
                if (onClearNavigateTo) {
                  navigate(onClearNavigateTo);
                }
              }}
              style={{ cursor: 'pointer',  position: 'absolute', right: '30px', top: '50%', transform: 'translateY(-50%)' }}
            />
          )}
          {/* Shuffle Icon */}
          {!isLoading && (
            <FontAwesomeIcon
              icon={faRandom}
              className="search-icon shuffle-icon"
              onClick={() => {
                navigate('/random-card'); // Navigate to /random-card page
              }}
              style={{ cursor: 'pointer', position: 'absolute', right: '110px', top: '50%', transform: 'translateY(-50%)' }}
              title="Shuffle"
            />
          )}
          {/* Advanced Search Icon */}
          {!isLoading && (
            <FontAwesomeIcon
              icon={faSlidersH}
              className="search-icon advanced-search-icon"
              onClick={() => {
                navigate('/advanced-search'); // Navigate to /advanced-search page
              }}
              style={{ cursor: 'pointer', position: 'absolute', right: '70px', top: '50%', transform: 'translateY(-50%)' }}
              title="Advanced Search"
            />
          )}
          {isLoading && (
            <FontAwesomeIcon icon={faSpinner} spin className="search-icon loading-icon" style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)' }}/>
          )}
          {!isLoading && !hasSearched && searchQuery.trim() === '' && (
             <FontAwesomeIcon icon={faSearch} className="search-icon" style={{ position: 'absolute', right: '30px', top: '50%', transform: 'translateY(-50%)' }} />
          )}
        </div>
      </div>
      {showSuggestions && suggestions.length > 0 && (
        <div ref={suggestionsRef} className="suggestions-dropdown" id="suggestions-list" role="listbox">
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
  );
};

export default SearchBar; 