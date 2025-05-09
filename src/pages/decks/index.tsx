import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faEdit, faArrowRight, faPlus } from '@fortawesome/free-solid-svg-icons';
import { useDeckContext } from '../../context/DeckContext';
import './Decks.css';

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

  return (
    <div className="decks-page-container">
      <div className="decks-header">
        <h1>Your Decks</h1>
        <Link to="/deckbuilder" className="create-deck-button" onClick={clearLocalStorage}>
          <FontAwesomeIcon icon={faPlus} />
          Create New Deck
        </Link>
      </div>

      {decks.length === 0 ? (
        <div className="no-decks-message">
          <p>You don't have any saved decks yet.</p>
          <Link to="/deckbuilder" className="start-building-link" onClick={clearLocalStorage}>
            Start building your first deck
            <FontAwesomeIcon icon={faArrowRight} />
          </Link>
        </div>
      ) : (
        <div className="decks-grid">
          {decks.map(deck => {
            const cardCounts = getCardTypeCount(deck.id);
            const totalCards = getTotalCardCount(deck.id);
            const sampleCardImage = getSampleCardImage(deck.id);
            const isExpanded = expandedDeckId === deck.id;
            
            return (
              <div 
                key={deck.id} 
                className={`deck-card ${isExpanded ? 'expanded' : ''}`}
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
                    className="delete-deck-btn" 
                    onClick={(e) => handleDeleteDeck(deck.id, e)}
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DecksPage; 