import React, { useState, useRef, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import './Playmat.css';
import { useDeckContext } from '../../context/DeckContext';
import { Card } from '../../utils/ScryfallAPI';
import HandZone from './components/HandZone';

// Interface for cards on the battlefield
interface BattlefieldCard extends Card {
  id: string;
  tapped: boolean;
  counters: number;
  position: {
    x: number;
    y: number;
  };
}

// Interface for hand card
export interface HandCard extends Card {
  id: string;
}

// Interface for the library and graveyard
interface ZoneCard extends Card {
  id: string;
}

const Playmat: React.FC = () => {
  // Get the deck ID from the URL
  const { deckId } = useParams<{ deckId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { getDeck, decks } = useDeckContext();
  const [turn, setTurn] = useState<number>(1);
  const [life, setLife] = useState<number>(40); // Default to 40 for commander
  
  // Game state
  const [handCards, setHandCards] = useState<HandCard[]>([]);
  const [libraryCards, setLibraryCards] = useState<ZoneCard[]>([]);
  const [battlefieldCards, setBattlefieldCards] = useState<BattlefieldCard[]>([]);
  const [graveyardCards, setGraveyardCards] = useState<ZoneCard[]>([]);
  const [exileCards, setExileCards] = useState<ZoneCard[]>([]);
  const [commandCards, setCommandCards] = useState<ZoneCard[]>([]);
  
  // Refs for dragging
  const draggingRef = useRef<{
    cardId: string | null;
    startX: number;
    startY: number;
    originalX: number;
    originalY: number;
  }>({
    cardId: null,
    startX: 0,
    startY: 0,
    originalX: 0,
    originalY: 0,
  });
  
  // Load the deck when component mounts
  useEffect(() => {
    if (!deckId) return;
    
    console.log("Loading deck with ID:", deckId);
    const deck = getDeck(deckId);
    console.log("Retrieved deck:", deck ? `${deck.name} with ${deck.cards.length} cards` : "No deck found");
    
    if (!deck) return;
    
    // Initialize the library with all cards from the deck
    const library = deck.cards.map((card, index) => ({
      ...card,
      id: `${card.id}_${index}`, // Ensure unique IDs for duplicates
    }));
    
    console.log("Setting library cards:", library.length);
    
    // Shuffle the deck immediately by setting a pre-shuffled library
    const shuffled = [...library];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    console.log("Setting pre-shuffled library with", shuffled.length, "cards");
    setLibraryCards(shuffled);
  }, [deckId, getDeck]);
  
  // Function to draw a card
  const drawCard = () => {
    console.log("Draw card called, library has", libraryCards.length, "cards");
    if (libraryCards.length === 0) {
      console.log("Library is empty, cannot draw");
      return;
    }
    
    // Take the top card from the library
    const [topCard, ...remainingLibrary] = libraryCards;
    console.log("Drawing card:", topCard.name);
    
    // Add to hand
    setHandCards(prev => {
      console.log("Adding card to hand, current hand size:", prev.length);
      return [...prev, topCard];
    });
    
    // Update library
    setLibraryCards(remainingLibrary);
  };
  
  // Function to shuffle the library
  const shuffleLibrary = () => {
    console.log("Shuffling library with", libraryCards.length, "cards");
    setLibraryCards(prev => {
      const shuffled = [...prev];
      // Fisher-Yates shuffle algorithm
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      console.log("Library shuffled, now has", shuffled.length, "cards");
      return shuffled;
    });
  };
  
  // Function to play a card from hand to battlefield
  const playCard = (cardId: string) => {
    console.log("Attempting to play card with ID:", cardId);
    const cardIndex = handCards.findIndex(card => card.id === cardId);
    
    if (cardIndex === -1) {
      console.error("Card not found in hand:", cardId);
      return;
    }
    
    // Get the card
    const card = handCards[cardIndex];
    console.log("Playing card from hand to battlefield:", card.name);
    
    // Remove from hand
    setHandCards(prev => {
      const newHand = prev.filter((_, index) => index !== cardIndex);
      console.log("New hand size after playing card:", newHand.length);
      return newHand;
    });
    
    // Add to battlefield
    setBattlefieldCards(prev => {
      const newCard = {
        ...card,
        tapped: false,
        counters: 0,
        position: {
          x: 50 + Math.random() * 200, // Random position in battlefield
          y: 50 + Math.random() * 200,
        },
      };
      console.log("Adding card to battlefield:", newCard.name);
      return [...prev, newCard];
    });
  };
  
  // Function to handle card tap
  const tapCard = (cardId: string) => {
    setBattlefieldCards(prev => 
      prev.map(card => 
        card.id === cardId 
          ? { ...card, tapped: !card.tapped } 
          : card
      )
    );
  };
  
  // Function to add a counter to a card
  const addCounter = (cardId: string) => {
    setBattlefieldCards(prev => 
      prev.map(card => 
        card.id === cardId 
          ? { ...card, counters: card.counters + 1 } 
          : card
      )
    );
  };
  
  // Function to remove a counter from a card
  const removeCounter = (cardId: string) => {
    setBattlefieldCards(prev => 
      prev.map(card => 
        card.id === cardId && card.counters > 0
          ? { ...card, counters: card.counters - 1 } 
          : card
      )
    );
  };
  
  // Function to send a card to the graveyard
  const sendToGraveyard = (cardId: string) => {
    // Find the card in the battlefield
    const cardIndex = battlefieldCards.findIndex(card => card.id === cardId);
    if (cardIndex === -1) return;
    
    const card = battlefieldCards[cardIndex];
    
    // Remove from battlefield
    setBattlefieldCards(prev => prev.filter((_, index) => index !== cardIndex));
    
    // Add to graveyard
    setGraveyardCards(prev => [card, ...prev]);
  };
  
  // Function to send a card to exile
  const sendToExile = (cardId: string) => {
    // Find the card in the battlefield
    const cardIndex = battlefieldCards.findIndex(card => card.id === cardId);
    if (cardIndex === -1) return;
    
    const card = battlefieldCards[cardIndex];
    
    // Remove from battlefield
    setBattlefieldCards(prev => prev.filter((_, index) => index !== cardIndex));
    
    // Add to exile
    setExileCards(prev => [card, ...prev]);
  };
  
  // Function to handle the next turn
  const nextTurn = () => {
    setTurn(prev => prev + 1);
    drawCard(); // Automatically draw a card for the new turn
    
    // Untap all cards
    setBattlefieldCards(prev => 
      prev.map(card => ({ ...card, tapped: false }))
    );
  };
  
  // Handle mouse down on a card (start dragging)
  const handleMouseDown = (e: React.MouseEvent, cardId: string) => {
    const card = battlefieldCards.find(c => c.id === cardId);
    if (!card) return;
    
    draggingRef.current = {
      cardId,
      startX: e.clientX,
      startY: e.clientY,
      originalX: card.position.x,
      originalY: card.position.y,
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  
  // Handle mouse move during dragging
  const handleMouseMove = (e: MouseEvent) => {
    if (!draggingRef.current.cardId) return;
    
    const dx = e.clientX - draggingRef.current.startX;
    const dy = e.clientY - draggingRef.current.startY;
    
    setBattlefieldCards(prev => 
      prev.map(card => 
        card.id === draggingRef.current.cardId 
          ? { 
              ...card, 
              position: {
                x: draggingRef.current.originalX + dx,
                y: draggingRef.current.originalY + dy,
              } 
            } 
          : card
      )
    );
  };
  
  // Handle mouse up after dragging
  const handleMouseUp = () => {
    draggingRef.current.cardId = null;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };
  
  // Function to restart the game
  const restartGame = () => {
    // Get the deck and reset the game state
    if (!deckId) return;
    
    const deck = getDeck(deckId);
    if (!deck) return;
    
    // Initialize the library with all cards from the deck
    const library = deck.cards.map((card, index) => ({
      ...card,
      id: `${card.id}_${index}`, // Ensure unique IDs for duplicates
    }));
    
    // Reset all game state
    setLibraryCards(library);
    setHandCards([]);
    setBattlefieldCards([]);
    setGraveyardCards([]);
    setExileCards([]);
    setCommandCards([]);
    setTurn(1);
    setLife(40);
    
    // Shuffle the library
    shuffleLibrary();
  };
  
  // Function to add a token card to the battlefield
  const addToken = () => {
    // Simplified token for demonstration
    const tokenCard: BattlefieldCard = {
      id: `token_${Date.now()}`,
      name: "Token Creature",
      type_line: "Token Creature",
      tapped: false,
      counters: 0,
      position: {
        x: 100 + Math.random() * 100,
        y: 100 + Math.random() * 100,
      },
      image_uris: {
        small: "https://via.placeholder.com/146x204?text=Token",
        normal: "https://via.placeholder.com/488x680?text=Token",
      },
      power: "1",
      toughness: "1",
    } as BattlefieldCard;
    
    setBattlefieldCards(prev => [...prev, tokenCard]);
  };

  // Get a sample card image from the deck to display
  const getSampleCardImage = (deckId: string) => {
    const deck = getDeck(deckId);
    if (!deck || deck.cards.length === 0) return null;

    // Find a card with an image, preferring non-land cards with high-quality art
    const nonLandCards = deck.cards.filter(
      card => card.type_line && !card.type_line.toLowerCase().includes('land')
    );
    
    // Prefer cards with art crop images if available
    const cardWithImage = (nonLandCards.length > 0 ? nonLandCards : deck.cards).find(
      card => card.image_uris?.art_crop || card.image_uris?.normal || 
             (card.card_faces && card.card_faces[0]?.image_uris?.art_crop) ||
             (card.card_faces && card.card_faces[0]?.image_uris?.normal)
    );

    if (!cardWithImage) return null;

    // Prefer art_crop for cleaner card art display
    return cardWithImage.image_uris?.art_crop || 
           cardWithImage.image_uris?.normal || 
           (cardWithImage.card_faces && cardWithImage.card_faces[0]?.image_uris?.art_crop) ||
           (cardWithImage.card_faces && cardWithImage.card_faces[0]?.image_uris?.normal);
  };
  
  // Welcome screen component when no deck ID is provided
  const WelcomeScreen = () => {
    return (
      <div className="playmat-welcome">
        <div className="playmat-welcome-header">
          <h1>Playmat</h1>
          <p>Select a deck to playtest or create a new one</p>
        </div>
        
        <div className="playmat-decks-grid">
          {decks.length > 0 ? (
            decks.map(deck => (
              <div 
                key={deck.id}
                className="playmat-deck-card"
                onClick={() => navigate(`/playmat/${deck.id}`)}
              >
                <div className="playmat-deck-image">
                  {getSampleCardImage(deck.id) ? (
                    <div className="playmat-deck-bg" style={{ backgroundImage: `url(${getSampleCardImage(deck.id)})` }}></div>
                  ) : (
                    <div className="playmat-deck-placeholder">{deck.name.charAt(0)}</div>
                  )}
                </div>
                <div className="playmat-deck-info">
                  <h3>{deck.name}</h3>
                  <p>{deck.cards.reduce((total, card) => total + (card.count || 1), 0)} cards</p>
                </div>
              </div>
            ))
          ) : (
            <div className="playmat-no-decks">
              <p>You don't have any decks yet. Create one to start playtesting!</p>
              <button onClick={() => navigate('/deckbuilder')}>Create Deck</button>
            </div>
          )}
        </div>
      </div>
    );
  };
  
  // If no deck ID is provided, show the welcome screen
  if (!deckId) {
    return <WelcomeScreen />;
  }
  
  return (
    <div className="playmat-container">
      <div className="playmat-top-bar">
        <div className="playmat-name">
          <span>MOXFIELD</span>
          <button className="btn-dropdown">— {turn}</button>
          <button className="btn-dropdown">Counters</button>
          <button className="btn-dropdown">Turn {turn}</button>
        </div>
        <div className="playmat-controls">
          <button className="btn-control btn-player">Player</button>
          <button className="btn-control btn-sleeves">Sleeves</button>
          <button className="btn-control btn-restart" onClick={restartGame}>Restart</button>
          <button className="btn-control btn-token" onClick={addToken}>Add Token</button>
          <button className="btn-control btn-shuffle" onClick={shuffleLibrary}>Shuffle</button>
          <button className="btn-control btn-view-library">View Library</button>
          <button className="btn-control btn-draw" onClick={drawCard}>Draw</button>
          <button className="btn-control btn-next-turn" onClick={nextTurn}>Next Turn</button>
        </div>
      </div>
      
      <div className="playmat-battlefield">
        {battlefieldCards.map(card => (
          <div 
            key={card.id}
            className={`battlefield-card ${card.tapped ? 'tapped' : ''}`}
            style={{
              transform: `translate(${card.position.x}px, ${card.position.y}px)`,
            }}
            onMouseDown={(e) => handleMouseDown(e, card.id)}
          >
            {card.image_uris?.normal ? (
              <img 
                src={card.image_uris.normal} 
                alt={card.name} 
                onDoubleClick={() => tapCard(card.id)}
              />
            ) : card.card_faces && card.card_faces[0]?.image_uris?.normal ? (
              <img 
                src={card.card_faces[0].image_uris.normal} 
                alt={card.name} 
                onDoubleClick={() => tapCard(card.id)}
              />
            ) : (
              <div className="card-placeholder">
                <p>{card.name}</p>
              </div>
            )}
            
            {card.counters > 0 && (
              <div className="card-counters">{card.counters}</div>
            )}
            
            <div className="card-actions">
              <button onClick={() => addCounter(card.id)}>+</button>
              <button onClick={() => removeCounter(card.id)}>-</button>
              <button onClick={() => tapCard(card.id)}>Tap</button>
              <button onClick={() => sendToGraveyard(card.id)}>GY</button>
              <button onClick={() => sendToExile(card.id)}>Exile</button>
            </div>
          </div>
        ))}
        
        {/* Library/Deck in bottom right */}
        {libraryCards.length > 0 && (
          <div 
            className="playmat-deck"
            onClick={drawCard}
            title={`Library (${libraryCards.length} cards) - Click to draw a card`}
          >
            <div className="deck-count">{libraryCards.length}</div>
            <div className="deck-tooltip">Click to draw</div>
          </div>
        )}
        
        {/* Hand zone */}
        <HandZone cards={handCards} onCardPlay={playCard} />
      </div>
    </div>
  );
};

export default Playmat; 