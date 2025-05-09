import React from 'react';
import { useNavigate } from 'react-router-dom';
import './RandomCard.css';
import { useRandomCard } from '../../context/RandomCardContext';

// Type definitions for local use only
interface Card {
  id: string;
  name: string;
  type_line: string;
  rarity: string;
  set: string;
  set_name: string;
  colors?: string[];
  image_uris?: {
    normal?: string;
    png?: string;
  };
  oracle_text?: string;
  object?: string;
  error?: boolean;
  details?: string;
}

const RandomCard: React.FC = () => {
  // Use the context instead of local state
  const {
    currentCard: cardDisplayArea,
    setCurrentCard: setCardDisplayArea,
    previouslyViewedCards,
    setPreviouslyViewedCards,
    selectedFilters,
    setSelectedFilters,
    loading,
    setLoading,
    filtersVisible,
    setFiltersVisible
  } = useRandomCard();
  
  const navigate = useNavigate();

  // Function to navigate to card page
  const navigateToCardPage = (card: Card) => {
    if (!card.error && card.id) {
      // Navigate to the card page using the card ID
      // We no longer need to indicate "fromRandom" as we've updated the breadcrumb behavior
      navigate(`/card/${card.id}?set=${card.set}`);
    }
  };

  // Function to toggle a filter
  const toggleFilter = (filterType: 'rarity' | 'color' | 'type', filterValue: string) => {
    setSelectedFilters(prevFilters => {
      const newFilters = { ...prevFilters };
      
      // For rarity and type, only allow one selection at a time
      if (filterType === 'rarity' || filterType === 'type') {
        // If already selected, deselect it
        if (newFilters[filterType].includes(filterValue)) {
          newFilters[filterType] = [];
        } else {
          // Otherwise select only this one
          newFilters[filterType] = [filterValue];
        }
      } 
      // For colors, allow multiple selections
      else {
        // Toggle selection
        if (newFilters[filterType].includes(filterValue)) {
          // Remove from selected filters
          const index = newFilters[filterType].indexOf(filterValue);
          if (index > -1) {
            newFilters[filterType] = [
              ...newFilters[filterType].slice(0, index),
              ...newFilters[filterType].slice(index + 1)
            ];
          }
        } else {
          // Add to selected filters
          newFilters[filterType] = [...newFilters[filterType], filterValue];
        }
      }
      
      return newFilters;
    });
  };

  // Function to fetch a random card
  const getRandomCard = async () => {
    // Build query from selected filters
    const apiBaseUrl = 'https://api.scryfall.com/cards/random';
    let searchQuery = '';
    
    // Add rarity filter - single selection
    if (selectedFilters.rarity.length > 0) {
      searchQuery += `rarity:${selectedFilters.rarity[0]}`;
    }
    
    // Add type filter - single selection
    if (selectedFilters.type.length > 0) {
      if (searchQuery) searchQuery += ' ';
      searchQuery += `type:${selectedFilters.type[0]}`;
    }
    
    // Add color filters - multiple selection
    if (selectedFilters.color.length > 0) {
      if (searchQuery) searchQuery += ' ';
      
      // Special handling for 'Colorless' selection
      if (selectedFilters.color.includes('C')) {
        // If Colorless is selected, we want cards with no colors
        const otherColors = selectedFilters.color.filter(c => c !== 'C');
        
        if (otherColors.length > 0) {
          // This is an edge case - colorless plus colors doesn't make sense
          // We'll interpret it as an OR condition
          searchQuery += `(color=c OR color:${otherColors.join('')})`;
        } else {
          // Just show colorless cards
          searchQuery += 'color=c';
        }
      } 
      // Normal color filtering - match exact colors
      else {
        // Use Scryfall's identity matching to only show cards with exactly these colors
        searchQuery += `color=${selectedFilters.color.join('')}`;
      }
    }
    
    searchQuery = searchQuery.trim();
    console.log("Search query:", searchQuery); // Debug log
    const apiUrl = `${apiBaseUrl}${searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : ''}`;
    console.log("API URL:", apiUrl); // Debug log

    // Set loading state
    setLoading(true);
    
    // Fetch data from Scryfall
    try {
      const response = await fetch(apiUrl);
      const randomCard = await response.json();

      if (randomCard.object === 'error') {
        console.error("Scryfall API Error:", randomCard.details);
      } else {
        if (!previouslyViewedCards.length || previouslyViewedCards[previouslyViewedCards.length - 1].id !== randomCard.id) {
          setPreviouslyViewedCards(prev => [...prev, randomCard]);
        }
      }
      
      setCardDisplayArea(randomCard);
    } catch (error) {
      console.error("Error fetching card data:", error);
      setCardDisplayArea({ 
        id: 'error', 
        name: 'Error', 
        type_line: 'Error fetching card data', 
        rarity: 'common', 
        set: 'error', 
        set_name: 'Error', 
        error: true,
        details: 'Failed to fetch card data'
      });
    } finally {
      setLoading(false);
    }
  };

  // Render filter pill
  const renderFilterPill = (filterType: 'rarity' | 'color' | 'type', filterValue: string, label: string) => {
    const isSelected = selectedFilters[filterType].includes(filterValue);
    return (
      <button 
        className={`filter-pill ${isSelected ? 'selected' : ''}`}
        data-filter={filterType}
        data-value={filterValue}
        onClick={() => toggleFilter(filterType, filterValue)}
      >
        {label}
      </button>
    );
  };

  // Render card display area
  const renderCardDisplay = () => {
    if (!cardDisplayArea) {
      return (
        <div id="card-placeholder">Select filters and click "Get Random Card"</div>
      );
    }

    if (cardDisplayArea.error || cardDisplayArea.object === 'error') {
      const errorMessage = cardDisplayArea?.details || 'Failed to fetch card data or no card matched filters.';
      return (
        <div id="card-placeholder" className="has-card">
          <div className="card-details-grid">
            <div className="card-image">
              <div style={{width:'100%', height:'100%', background: '#111', border: '1px solid #555', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#777'}}>
                Error
              </div>
            </div>
            <div className="card-info-column">
              <h3>Error</h3>
              <p className="type-line">{errorMessage}</p>
            </div>
          </div>
        </div>
      );
    }

    // Get image URL
    const imageUrl = cardDisplayArea.image_uris?.normal || cardDisplayArea.image_uris?.png || 'img_placeholder.png';
    // Format colors
    const colorDisplay = cardDisplayArea.colors?.length ? cardDisplayArea.colors.join(', ') : 'Colorless';
    // Format oracle text - split by line breaks to handle them properly
    const oracleTextLines = cardDisplayArea.oracle_text ? cardDisplayArea.oracle_text.split('\n') : [];
    // Format rarity
    const rarityDisplay = cardDisplayArea.rarity.charAt(0).toUpperCase() + cardDisplayArea.rarity.slice(1);
    
    // Check if this is a plane card
    const typeText = (cardDisplayArea.type_line || '').toLowerCase();
    const isPlaneCard = 
      (typeText.includes('plane ') || typeText.startsWith('plane') || typeText.includes(' plane')) && 
      !typeText.includes('planeswalker');

    return (
      <div id="card-placeholder" className={`${loading ? 'loading' : ''} has-card ${isPlaneCard ? 'plane-card' : ''}`}>
        <div className="card-details-grid">
          <div 
            className="card-image" 
            onClick={() => navigateToCardPage(cardDisplayArea)}
          >
            {imageUrl !== 'img_placeholder.png' ? 
              <img src={imageUrl} alt={cardDisplayArea.name} style={{backgroundColor: '#000'}} /> : 
              <div style={{width:'100%', height:'100%', background: '#111', border: '1px solid #555', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#777'}}>No Image</div>
            }
          </div>

          <div className="card-info-column">
            <h3>{cardDisplayArea.name}</h3>
            <p className="type-line">{cardDisplayArea.type_line}</p>
            <p className="metadata-line"><strong>{rarityDisplay}</strong> - {cardDisplayArea.set_name} ({cardDisplayArea.set.toUpperCase()})</p>
            <p className="metadata-line">Color(s): {colorDisplay}</p>
            {oracleTextLines.length > 0 && (
              <div className="oracle-text">
                {oracleTextLines.map((line, index) => (
                  <React.Fragment key={index}>
                    {line}
                    {index < oracleTextLines.length - 1 && <br />}
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render loading state
  const renderLoading = () => {
    if (!loading) return null;

    return (
      <div id="card-placeholder" className="loading has-card">
        <div className="card-details-grid">
          <div className="card-image">
            <div style={{width:'100%', height:'100%', background: '#111', border: '1px solid #555', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#777'}}>
              Loading...
            </div>
          </div>
          <div className="card-info-column">
            <h3 style={{color:'#777'}}>Loading card...</h3>
            <p className="type-line" style={{color:'#777'}}>Please wait...</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="page-controls">
        <button id="get-random-card" onClick={getRandomCard}>Get Random Card</button>
        <button 
          id="filters-toggle" 
          className={filtersVisible ? 'active' : ''}
          onClick={() => setFiltersVisible(!filtersVisible)}
        >
          Filters
        </button>
      </div>

      {/* All filters container */}
      <div id="all-filters-container" className={`all-filters-container ${!filtersVisible ? 'hidden' : ''}`}>
        {/* Basic filter pills */}
        <div className="filter-bar">
          <div className="filter-group">
            <div className="filter-label">Rarity:</div>
            <div className="filter-pills rarity-pills">
              {renderFilterPill('rarity', 'common', 'Common')}
              {renderFilterPill('rarity', 'uncommon', 'Uncommon')}
              {renderFilterPill('rarity', 'rare', 'Rare')}
              {renderFilterPill('rarity', 'mythic', 'Mythic')}
            </div>
          </div>
          
          <div className="filter-group">
            <div className="filter-label">Color:</div>
            <div className="filter-pills color-pills">
              {renderFilterPill('color', 'W', 'W')}
              {renderFilterPill('color', 'U', 'U')}
              {renderFilterPill('color', 'B', 'B')}
              {renderFilterPill('color', 'R', 'R')}
              {renderFilterPill('color', 'G', 'G')}
              {renderFilterPill('color', 'C', 'C')}
            </div>
          </div>
          
          <div className="filter-group">
            <div className="filter-label">Type:</div>
            <div className="filter-pills type-pills">
              {renderFilterPill('type', 'creature', 'Creature')}
              {renderFilterPill('type', 'instant', 'Instant')}
              {renderFilterPill('type', 'sorcery', 'Sorcery')}
              {renderFilterPill('type', 'enchantment', 'Enchantment')}
              {renderFilterPill('type', 'artifact', 'Artifact')}
              {renderFilterPill('type', 'planeswalker', 'Planeswalker')}
              {renderFilterPill('type', 'land', 'Land')}
              {renderFilterPill('type', 'plane', 'Plane')}
            </div>
          </div>
        </div>
        <div className="custom-divider"></div>
      </div>

      <main>
        <section id="card-display-area">
          {loading ? renderLoading() : renderCardDisplay()}
        </section>
        <div className="custom-divider"></div>
        <section id="previously-viewed">
          <h2>Previously Viewed Cards</h2>
          <div className="card-list">
            {previouslyViewedCards.slice(-5).reverse().map((card, index) => (
              <div 
                key={`${card.id}-${index}`}
                className="previous-card-item"
                onClick={() => {
                  setCardDisplayArea(card);
                  setLoading(false);
                }}
              >
                <div className="previous-card-metadata">
                  {card.rarity.charAt(0).toUpperCase() + card.rarity.slice(1)} / {card.set.toUpperCase()}
                </div>
                <div className="previous-card-main">
                  {card.name}
                  <span style={{color: '#888', fontSize: '0.9em', marginLeft: '5px'}}> - {card.type_line}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
};

export default RandomCard; 