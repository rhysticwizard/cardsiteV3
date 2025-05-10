import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faEdit, faArrowRight, faPlus, faBug, faCrown, faFire, faPalette, faUser } from '@fortawesome/free-solid-svg-icons';
import { useDeckContext } from '../../context/DeckContext';
import './Decks.css';

// Mock deck data for the different sections
const STANDARD_DECKS = [
  {
    id: 'mock_std_1',
    name: 'Mono-Red Aggro',
    type: 'Standard',
    imageUrl: 'https://cards.scryfall.io/art_crop/front/7/0/70e0b5b1-13e0-4a6a-9683-f1853e9d9f4a.jpg',
    popularity: 2541
  },
  {
    id: 'mock_std_2',
    name: 'Azorius Control',
    type: 'Standard',
    imageUrl: 'https://cards.scryfall.io/art_crop/front/5/5/55127a25-dc64-4f26-ae50-ed7247c22ae6.jpg',
    popularity: 2212
  },
  {
    id: 'mock_std_3',
    name: 'Simic Ramp',
    type: 'Standard',
    imageUrl: 'https://cards.scryfall.io/art_crop/front/8/8/88a4d621-67f4-4e35-8a1d-25957faebf57.jpg',
    popularity: 1876
  },
  {
    id: 'mock_std_4',
    name: 'Rakdos Midrange',
    type: 'Standard',
    imageUrl: 'https://cards.scryfall.io/art_crop/front/9/1/91f1063b-fee4-41c9-ad04-1ca98e8e6949.jpg',
    popularity: 1650
  },
  {
    id: 'mock_std_5',
    name: 'Gruul Werewolves',
    type: 'Standard',
    imageUrl: 'https://cards.scryfall.io/art_crop/front/3/0/30a76030-98a7-401a-85a4-7cf0830e67b5.jpg',
    popularity: 1542
  },
  {
    id: 'mock_std_6',
    name: 'Esper Control',
    type: 'Standard',
    imageUrl: 'https://cards.scryfall.io/art_crop/front/e/e/eee17ac5-8e73-42a0-b8eb-cfa4dfa03362.jpg',
    popularity: 1435
  },
  {
    id: 'mock_std_7',
    name: 'Jund Sacrifice',
    type: 'Standard',
    imageUrl: 'https://cards.scryfall.io/art_crop/front/5/6/56fb4035-197b-4d28-9bf7-bb62c304067e.jpg',
    popularity: 1320
  },
  {
    id: 'mock_std_8',
    name: 'Mono-White Aggro',
    type: 'Standard',
    imageUrl: 'https://cards.scryfall.io/art_crop/front/9/a/9a52c677-7031-4fa2-bd3f-5b5433ca43b9.jpg',
    popularity: 1190
  }
];

const COMMANDER_DECKS = [
  {
    id: 'mock_cmd_1',
    name: 'Atraxa, Praetors\' Voice',
    type: 'Commander',
    imageUrl: 'https://cards.scryfall.io/art_crop/front/d/0/d0d33d52-3d28-4635-b985-51e126289259.jpg',
    popularity: 4521
  },
  {
    id: 'mock_cmd_2',
    name: 'Prosper, Tome-Bound',
    type: 'Commander',
    imageUrl: 'https://cards.scryfall.io/art_crop/front/d/7/d743336e-d5c7-4053-a23d-92ec7581f74e.jpg',
    popularity: 3987
  },
  {
    id: 'mock_cmd_3',
    name: 'Meren of Clan Nel Toth',
    type: 'Commander',
    imageUrl: 'https://cards.scryfall.io/art_crop/front/1/7/17d6703c-ad79-457b-a1b5-c2284e363085.jpg',
    popularity: 3654
  },
  {
    id: 'mock_cmd_4',
    name: 'Yuriko, the Tiger\'s Shadow',
    type: 'Commander',
    imageUrl: 'https://cards.scryfall.io/art_crop/front/3/b/3bd81ae6-e628-447a-a36b-597e63ede295.jpg',
    popularity: 3320
  }
];

const THEME_DECKS = [
  {
    id: 'mock_theme_1',
    name: 'Zombie Tribal',
    type: 'Tribal',
    imageUrl: 'https://cards.scryfall.io/art_crop/front/9/8/98c85699-2daf-4e87-a3be-465d02bd64bb.jpg',
    popularity: 2854
  },
  {
    id: 'mock_theme_2',
    name: 'Dragon Hoard',
    type: 'Tribal',
    imageUrl: 'https://cards.scryfall.io/art_crop/front/4/6/46530839-8d61-45fb-81c1-50b2ceb57cf2.jpg',
    popularity: 2732
  },
  {
    id: 'mock_theme_3',
    name: 'Enchantress',
    type: 'Theme',
    imageUrl: 'https://cards.scryfall.io/art_crop/front/e/7/e7c5f681-0145-45e9-b943-ca9784cfdea0.jpg',
    popularity: 2421
  },
  {
    id: 'mock_theme_4',
    name: 'Group Hug',
    type: 'Theme',
    imageUrl: 'https://cards.scryfall.io/art_crop/front/f/2/f29ba16f-c8fb-42fe-aabf-87089cb214a7.jpg',
    popularity: 2187
  }
];

const DecksPage: React.FC = () => {
  const { decks, deleteDeck } = useDeckContext();
  const navigate = useNavigate();
  const [expandedDeckId, setExpandedDeckId] = useState<string | null>(null);

  // Format date from timestamp
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Handle delete deck with confirmation
  const handleDeleteDeck = (deckId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this deck?')) {
      deleteDeck(deckId);
    }
  };

  // Count cards by type
  const getCardTypeCount = (deckId: string) => {
    const deck = decks.find(d => d.id === deckId);
    if (!deck) return {};

    const counts: Record<string, number> = {
      creatures: 0,
      spells: 0,
      artifacts: 0,
      enchantments: 0,
      lands: 0,
      other: 0
    };

    deck.cards.forEach(card => {
      const typeLine = card.type_line?.toLowerCase() || '';
      const count = card.count || 1;

      if (typeLine.includes('creature')) {
        counts.creatures += count;
      } else if (typeLine.includes('instant') || typeLine.includes('sorcery')) {
        counts.spells += count;
      } else if (typeLine.includes('artifact')) {
        counts.artifacts += count;
      } else if (typeLine.includes('enchantment')) {
        counts.enchantments += count;
      } else if (typeLine.includes('land')) {
        counts.lands += count;
      } else {
        counts.other += count;
      }
    });

    return counts;
  };

  // Toggle deck details expansion
  const toggleDeckExpansion = (deckId: string) => {
    setExpandedDeckId(expandedDeckId === deckId ? null : deckId);
  };

  // Get a sample card image from the deck to display
  const getSampleCardImage = (deckId: string) => {
    const deck = decks.find(d => d.id === deckId);
    if (!deck || deck.cards.length === 0) return null;

    // Find a card with an image, preferring non-land cards with high-quality art
    const nonLandCards = deck.cards.filter(
      card => card.type_line && !card.type_line.toLowerCase().includes('land')
    );
    
    // Prefer cards with art crop images if available - perfect for the 2.3:1.8 ratio
    const cardWithImage = (nonLandCards.length > 0 ? nonLandCards : deck.cards).find(
      card => card.image_uris?.art_crop || card.image_uris?.normal || 
             (card.card_faces && card.card_faces[0]?.image_uris?.art_crop) ||
             (card.card_faces && card.card_faces[0]?.image_uris?.normal)
    );

    if (!cardWithImage) return null;

    // Prefer art_crop for cleaner card art display - ideal for our custom ratio
    return cardWithImage.image_uris?.art_crop || 
           cardWithImage.image_uris?.normal || 
           (cardWithImage.card_faces && cardWithImage.card_faces[0]?.image_uris?.art_crop) ||
           (cardWithImage.card_faces && cardWithImage.card_faces[0]?.image_uris?.normal);
  };

  // Get total card count in a deck
  const getTotalCardCount = (deckId: string) => {
    const deck = decks.find(d => d.id === deckId);
    if (!deck) return 0;
    return deck.cards.reduce((total, card) => total + (card.count || 1), 0);
  };

  const clearLocalStorage = () => {
    // Only clear deck-builder related items, not all localStorage
    localStorage.removeItem('deckbuilder_cards');
    localStorage.removeItem('deckbuilder_title');
    localStorage.removeItem('deckbuilder_column_titles');
    localStorage.removeItem('deckbuilder_search_results');
    localStorage.removeItem('deckbuilder_search_query');
  };

  const handleEditDeck = (deckId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/deckbuilder?deck=${deckId}`);
  };

  // Debug function to check localStorage contents
  const debugLocalStorage = () => {
    try {
      console.log("--- DEBUG LOCALSTORAGE START ---");
      
      // Check all localStorage keys
      console.log("All localStorage keys:", Object.keys(localStorage));
      
      // Check saved decks
      const savedDecks = localStorage.getItem('savedDecks');
      console.log("Raw savedDecks:", savedDecks ? `${savedDecks.substring(0, 100)}... (${savedDecks.length} chars)` : 'null');
      
      if (savedDecks) {
        try {
          const parsed = JSON.parse(savedDecks);
          console.log("Parsed savedDecks structure:", 
            typeof parsed, 
            Array.isArray(parsed) ? `Array[${parsed.length}]` : 
            parsed && typeof parsed === 'object' ? 
              ('version' in parsed ? `Object with version ${parsed.version}` : 'Object without version') : 
              'Other');
          
          if (parsed && typeof parsed === 'object' && 'decks' in parsed) {
            console.log("Decks array length:", Array.isArray(parsed.decks) ? parsed.decks.length : 'Not an array');
            if (Array.isArray(parsed.decks) && parsed.decks.length > 0) {
              console.log("First deck ID:", parsed.decks[0].id);
            }
          }
        } catch (e) {
          console.error("Error parsing savedDecks:", e);
        }
      }
      
      // Check backup
      const backupDecks = localStorage.getItem('savedDecks_backup');
      console.log("Raw savedDecks_backup:", backupDecks ? `${backupDecks.substring(0, 100)}... (${backupDecks.length} chars)` : 'null');
      
      // Check context decks
      console.log("Current decks in context:", decks.length, 
        decks.length > 0 ? `First ID: ${decks[0].id}` : '');
      
      console.log("--- DEBUG LOCALSTORAGE END ---");
    } catch (e) {
      console.error("Debug error:", e);
    }
  };

  // Render a mock deck card
  const renderMockDeck = (deck: any, showPopularity = false) => {
    return (
      <div 
        key={deck.id} 
        className="deck-card"
        onClick={() => navigate(`/deckbuilder`)} // No actual deck to edit, just go to builder
      >
        <div className="deck-image-container">
          {deck.imageUrl ? (
            <div 
              className="deck-image" 
              style={{ backgroundImage: `url(${deck.imageUrl})` }}
            />
          ) : (
            <div className="deck-image-placeholder">
              <span>{deck.name.charAt(0)}</span>
            </div>
          )}
        </div>
        
        <div className="deck-info-container">
          <h3 className="deck-name">{deck.name}</h3>
          <div className="deck-meta">
            <div className="deck-type">{deck.type}</div>
            {showPopularity && (
              <div className="deck-popularity">
                {deck.popularity.toLocaleString()} players
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render a user deck card (with action buttons)
  const renderUserDeck = (deck: any) => {
    const sampleCardImage = getSampleCardImage(deck.id);
    
    return (
      <div 
        key={deck.id} 
        className="deck-card"
        onClick={() => navigate(`/deckbuilder?deck=${deck.id}`)}
      >
        <div className="deck-image-container">
          {sampleCardImage ? (
            <div 
              className="deck-image" 
              style={{ backgroundImage: `url(${sampleCardImage})` }}
            />
          ) : (
            <div className="deck-image-placeholder">
              <span>{deck.name.charAt(0)}</span>
            </div>
          )}
        </div>
        
        <div className="deck-info-container">
          <h3 className="deck-name">{deck.name}</h3>
          <div className="deck-meta">
            <div className="deck-type">MTG</div>
          </div>
        </div>
        
        <div className="deck-action-buttons">
          <button 
            className="edit-deck-btn" 
            onClick={(e) => handleEditDeck(deck.id, e)}
          >
            <FontAwesomeIcon icon={faEdit} />
          </button>
          <button 
            className="playtest-deck-btn"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/playmat/${deck.id}`);
            }}
          >
            <FontAwesomeIcon icon={faBug} />
          </button>
          <button 
            className="delete-deck-btn" 
            onClick={(e) => handleDeleteDeck(deck.id, e)}
          >
            <FontAwesomeIcon icon={faTrash} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="decks-page-container">
      {/* Page Header */}
      <div className="page-header">
        <div className="header-buttons">
          <Link to="/deckbuilder" className="create-deck-button" onClick={clearLocalStorage}>
            <FontAwesomeIcon icon={faPlus} />
            Create New Deck
          </Link>
        </div>
      </div>

      {/* Your Decks Section */}
      {decks.length > 0 && (
        <div className="deck-section">
          <div className="decks-header section-header">
            <h2>
              <FontAwesomeIcon icon={faUser} className="section-icon" />
              Your Decks
            </h2>
            <Link to="/decks/user" className="view-more-link">
              View all
              <FontAwesomeIcon icon={faArrowRight} />
            </Link>
          </div>
          <div className="decks-grid">
            {decks.map(deck => renderUserDeck(deck))}
          </div>
        </div>
      )}

      {/* Top Standard Decks Section */}
      <div className="deck-section">
        <div className="decks-header section-header">
          <h2>
            <FontAwesomeIcon icon={faCrown} className="section-icon" />
            Top 8 Standard Decks
          </h2>
          <Link to="/decks/standard" className="view-more-link">
            View more
            <FontAwesomeIcon icon={faArrowRight} />
          </Link>
        </div>
        <div className="decks-grid">
          {STANDARD_DECKS.map(deck => renderMockDeck(deck, true))}
        </div>
      </div>

      {/* Trending Commander Decks Section */}
      <div className="deck-section">
        <div className="decks-header section-header">
          <h2>
            <FontAwesomeIcon icon={faFire} className="section-icon" />
            Trending Commander Decks
          </h2>
          <Link to="/decks/commander" className="view-more-link">
            View more
            <FontAwesomeIcon icon={faArrowRight} />
          </Link>
        </div>
        <div className="decks-grid">
          {COMMANDER_DECKS.map(deck => renderMockDeck(deck, true))}
        </div>
      </div>

      {/* Popular Theme Decks Section */}
      <div className="deck-section">
        <div className="decks-header section-header">
          <h2>
            <FontAwesomeIcon icon={faPalette} className="section-icon" />
            Popular Theme Decks
          </h2>
          <Link to="/decks/themes" className="view-more-link">
            View more
            <FontAwesomeIcon icon={faArrowRight} />
          </Link>
        </div>
        <div className="decks-grid">
          {THEME_DECKS.map(deck => renderMockDeck(deck, true))}
        </div>
      </div>
    </div>
  );
};

export default DecksPage; 