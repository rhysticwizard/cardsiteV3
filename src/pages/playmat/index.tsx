import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './Playmat.css';
import { useDeckContext } from '../../context/DeckContext';
import { Card } from '../../utils/ScryfallAPI';
import HandZone from './components/HandZone';
// Import dnd-kit components
import { 
  DndContext, 
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  UniqueIdentifier,
  useDraggable,
  useDroppable
} from '@dnd-kit/core';
import {
  sortableKeyboardCoordinates
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Interface for cards on the battlefield
interface BattlefieldCard extends Card {
  id: string;
  tapped: boolean;
  facedown: boolean;
  counters: number;
  position: {
    x: number;
    y: number;
  };
  stackedCards: BattlefieldCard[]; // Array of cards stacked underneath this card
}

// Interface for hand card
export interface HandCard extends Card {
  id: string;
}

// Interface for the library and graveyard
interface ZoneCard extends Card {
  id: string;
}

// BattlefieldDroppable component
interface BattlefieldDroppableProps {
  battlefieldCards: BattlefieldCard[];
  recentlyDropped: Set<string>;
  tapCard: (cardId: string) => void;
  addCounter: (cardId: string) => void;
  removeCounter: (cardId: string) => void;
  sendToGraveyard: (cardId: string) => void;
  sendToExile: (cardId: string) => void;
  flipCard: (cardId: string) => void;
  handleCardMouseEnter: (card: Card, event: React.MouseEvent) => void;
  handleCardMouseLeave: () => void;
  handleContextMenu: (e: React.MouseEvent, cardId: string, isStack: boolean) => void;
  clearContextMenu: () => void;
}

const BattlefieldDroppable: React.FC<BattlefieldDroppableProps> = ({
  battlefieldCards,
  recentlyDropped,
  tapCard,
  addCounter,
  removeCounter,
  sendToGraveyard,
  sendToExile,
  flipCard,
  handleCardMouseEnter,
  handleCardMouseLeave,
  handleContextMenu,
  clearContextMenu
}) => {
  // Set up the droppable area
  const { setNodeRef, isOver } = useDroppable({
    id: 'battlefield',
    data: {
      type: 'battlefield'
    }
  });

  return (
    <div 
      ref={setNodeRef} 
      className={`playmat-battlefield ${isOver ? 'drop-active' : ''}`}
      onClick={clearContextMenu}
    >
      {battlefieldCards.map(card => (
        <BattlefieldCard
          key={card.id}
          card={card}
          isRecentlyDropped={recentlyDropped.has(card.id)}
          onTap={tapCard}
          onAddCounter={addCounter}
          onRemoveCounter={removeCounter}
          onSendToGraveyard={sendToGraveyard}
          onSendToExile={sendToExile}
          onFlipCard={flipCard}
          onMouseEnter={handleCardMouseEnter}
          onMouseLeave={handleCardMouseLeave}
          onContextMenu={handleContextMenu}
        />
      ))}
    </div>
  );
};

// BattlefieldCard component
interface BattlefieldCardProps {
  card: BattlefieldCard;
  isRecentlyDropped: boolean;
  onTap: (cardId: string) => void;
  onAddCounter: (cardId: string) => void;
  onRemoveCounter: (cardId: string) => void;
  onSendToGraveyard: (cardId: string) => void;
  onSendToExile: (cardId: string) => void;
  onFlipCard: (cardId: string) => void;
  onMouseEnter: (card: Card, event: React.MouseEvent) => void;
  onMouseLeave: () => void;
  onContextMenu: (e: React.MouseEvent, cardId: string, isStack: boolean) => void;
}

const BattlefieldCard: React.FC<BattlefieldCardProps> = ({
  card,
  isRecentlyDropped,
  onTap,
  onAddCounter,
  onRemoveCounter,
  onSendToGraveyard,
  onSendToExile,
  onFlipCard,
  onMouseEnter,
  onMouseLeave,
  onContextMenu
}) => {
  // Set up draggable
  const { attributes, listeners, setNodeRef: setDraggableNodeRef, transform, isDragging } = useDraggable({
    id: `battlefield-${card.id}`,
    data: {
      type: 'battlefield-card',
      card,
      width: 120, // Add width for drag overlay
      height: 168 // Add height for drag overlay
    }
  });
  
  // Also make the card a drop target for stacking
  const { setNodeRef: setDroppableNodeRef } = useDroppable({
    id: `battlefield-${card.id}`,
    data: {
      type: 'battlefield-card-target',
      cardId: card.id
    }
  });
  
  // Combine the refs
  const setNodeRef = (node: HTMLElement | null) => {
    setDraggableNodeRef(node);
    setDroppableNodeRef(node);
  };

  // Create styles for the card
  const style = {
    transform: CSS.Transform.toString(transform),
    position: 'absolute' as const,
    top: `${card.position.y}px`,
    left: `${card.position.x}px`,
    opacity: isDragging ? 0 : 1, // Make completely invisible when dragging
    cursor: isDragging ? 'grabbing' : 'grab',
    visibility: isDragging ? 'hidden' as const : 'visible' as const // Hide the element completely
  };

  return (
    <div 
      ref={setNodeRef}
      className={`battlefield-card ${card.tapped ? 'tapped' : ''} ${card.facedown ? 'facedown' : ''} ${
        isRecentlyDropped ? 'just-dropped' : ''
      }`}
      style={style}
      onMouseEnter={(e) => onMouseEnter(card, e)}
      onMouseLeave={onMouseLeave}
      onContextMenu={(e) => onContextMenu(e, card.id, card.stackedCards.length > 0)}
      data-has-stack={card.stackedCards.length > 0 ? "true" : "false"}
      {...listeners}
      {...attributes}
    >
      {!card.facedown ? (
        // Show card front when not face down
        card.image_uris?.normal ? (
          <img 
            src={card.image_uris.normal} 
            alt={card.name} 
            onDoubleClick={() => onTap(card.id)}
            draggable={false}
          />
        ) : card.card_faces && card.card_faces[0]?.image_uris?.normal ? (
          <img 
            src={card.card_faces[0].image_uris.normal} 
            alt={card.name} 
            onDoubleClick={() => onTap(card.id)}
            draggable={false}
          />
        ) : (
          <div className="card-placeholder">
            <p>{card.name}</p>
          </div>
        )
      ) : (
        // Show card back when face down
        <div className="card-back">
          <div className="card-back-inner"></div>
        </div>
      )}
      
      {/* Display counters if present */}
      {card.counters > 0 && (
        <div className="card-counters">
          {card.counters}
        </div>
      )}
      
      {/* Display stack count if cards are stacked */}
      {card.stackedCards.length > 0 && (
        <div className="card-stack-count">
          {card.stackedCards.length + 1}
        </div>
      )}
      
      <div className="card-actions">
        <button onClick={() => onAddCounter(card.id)}>+</button>
        <button onClick={() => onRemoveCounter(card.id)}>-</button>
        <button onClick={() => onTap(card.id)}>Tap</button>
        {card.facedown && <button onClick={() => onFlipCard(card.id)}>Flip</button>}
        <button onClick={() => onSendToGraveyard(card.id)}>GY</button>
        <button onClick={() => onSendToExile(card.id)}>Exile</button>
      </div>
    </div>
  );
};

const Playmat: React.FC = () => {
  // Get the deck ID from the URL
  const { deckId } = useParams<{ deckId: string }>();
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
  
  // Track recently placed cards for animation
  const [recentlyDropped, setRecentlyDropped] = useState<Set<string>>(new Set());
  
  // Add state for card preview
  const [previewCard, setPreviewCard] = useState<Card | null>(null);
  const [previewPosition, setPreviewPosition] = useState<{ x: number; y: number } | null>(null);
  // Reference for tracking hover timer
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Add state for drag and drop
  type DragItemType = {
    id: UniqueIdentifier;
    type: 'hand-card' | 'battlefield-card';
    cardData: HandCard | BattlefieldCard;
    width: number;
    height: number;
  };
  const [activeDragItem, setActiveDragItem] = useState<DragItemType | null>(null);
  
  // Set up dnd sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px of movement required before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // First add a state for the context menu
  const [contextMenu, setContextMenu] = useState<{
    show: boolean;
    x: number; 
    y: number;
    cardId: string | null;
    isStack: boolean;
  }>({
    show: false,
    x: 0, 
    y: 0,
    cardId: null,
    isStack: false
  });
  
  // Function to log battlefield card stacks for debugging
  useEffect(() => {
    // Log stack information whenever the battlefield cards change
    if (battlefieldCards.length > 0) {
      const stackedCards = battlefieldCards.filter(card => card.stackedCards.length > 0);
      if (stackedCards.length > 0) {
        console.log("===== CURRENT STACKS ======");
        stackedCards.forEach(card => {
          console.log(`Stack with ${card.name} contains ${card.stackedCards.length + 1} cards:`);
          console.log(`- Top card: ${card.name}`);
          card.stackedCards.forEach((stacked, index) => {
            console.log(`- Card ${index + 1}: ${stacked.name}`);
          });
        });
        console.log("========================");
      }
    }
  }, [battlefieldCards]);
  
  // Load the deck when component mounts
  useEffect(() => {
    if (!deckId) return;
    
    console.log("Loading deck with ID:", deckId);
    const deck = getDeck(deckId);
    console.log("Retrieved deck:", deck ? `${deck.name} with ${deck.cards.length} cards` : "No deck found");
    
    if (!deck) return;
    
    // Initialize cards, separating those that start in hand or in play
    const handStartCards: HandCard[] = [];
    const battlefieldStartCards: BattlefieldCard[] = [];
    const libraryCards: ZoneCard[] = [];
    
    deck.cards.forEach((card, index) => {
      const newCard = {
        ...card,
        id: `${card.id}_${index}`, // Ensure unique IDs for duplicates
      };
      
      // Skip sideboard cards entirely
      if (card.columnOption === 'sideboard') {
        return; // Skip this card
      }
      
      // Check if this card should start in hand
      if (card.columnOption === 'startsInHand') {
        handStartCards.push(newCard);
      } 
      // Check if this card should start in play face-up
      else if (card.columnOption === 'playFaceup') {
        // Add to battlefield with random position and face-up
        battlefieldStartCards.push({
          ...newCard,
          tapped: false,
          facedown: false,
          counters: 0,
          position: {
            x: 50 + Math.random() * 200, // Random position in battlefield
            y: 50 + Math.random() * 200,
          },
          stackedCards: [],
        });
      }
      // Check if this card should start in play face-down
      else if (card.columnOption === 'playFacedown') {
        // Add to battlefield with random position and face-down
        battlefieldStartCards.push({
          ...newCard,
          tapped: false,
          facedown: true, // Face-down instead of tapped
          counters: 0,
          position: {
            x: 50 + Math.random() * 200, // Random position in battlefield
            y: 50 + Math.random() * 200,
          },
          stackedCards: [],
        });
      } else {
        libraryCards.push(newCard);
      }
    });
    
    console.log("Setting library cards:", libraryCards.length);
    console.log("Setting hand cards:", handStartCards.length);
    console.log("Setting battlefield cards:", battlefieldStartCards.length);
    
    // Shuffle the deck immediately by setting a pre-shuffled library
    const shuffled = [...libraryCards];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    console.log("Setting pre-shuffled library with", shuffled.length, "cards");
    setLibraryCards(shuffled);
    
    // Set hand cards if any should start in hand
    if (handStartCards.length > 0) {
      setHandCards(handStartCards);
    }
    
    // Set battlefield cards if any should start in play
    if (battlefieldStartCards.length > 0) {
      setBattlefieldCards(battlefieldStartCards);
    }
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
      const newCard: BattlefieldCard = {
        ...card,
        tapped: false,
        facedown: false,
        counters: 0,
        position: {
          x: 50 + Math.random() * 200, // Random position in battlefield
          y: 50 + Math.random() * 200,
        },
        stackedCards: [],
      };
      console.log("Adding card to battlefield:", newCard.name);
      return [...prev, newCard];
    });
    
    // Add to recently dropped set for animation
    setRecentlyDropped(prev => {
      const newSet = new Set(prev);
      newSet.add(card.id);
      setTimeout(() => {
        setRecentlyDropped(current => {
          const updated = new Set(current);
          updated.delete(card.id);
          return updated;
        });
      }, 500);
      return newSet;
    });
  };
  
  // Tap card function
  const tapCard = (cardId: string) => {
    setBattlefieldCards(prev => 
      prev.map(card => 
        card.id === cardId 
          ? { 
              ...card, 
              tapped: !card.tapped,
              // Also update the tapped state for all stacked cards
              stackedCards: card.stackedCards.map(stackedCard => ({
                ...stackedCard,
                tapped: !card.tapped
              }))
            } 
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
  
  // Send to graveyard function
  const sendToGraveyard = (cardId: string) => {
    // Find the card in the battlefield
    const cardIndex = battlefieldCards.findIndex(card => card.id === cardId);
    if (cardIndex === -1) return;
    
    const card = battlefieldCards[cardIndex];
    
    // Add the card to the graveyard
    setGraveyardCards(prev => [...prev, card]);
    
    // Also add any stacked cards to the graveyard
    if (card.stackedCards.length > 0) {
      setGraveyardCards(prev => [...prev, ...card.stackedCards]);
    }
    
    // Remove the card from the battlefield
    setBattlefieldCards(prev => prev.filter((_, index) => index !== cardIndex));
  };
  
  // Send to exile function
  const sendToExile = (cardId: string) => {
    // Find the card in the battlefield
    const cardIndex = battlefieldCards.findIndex(card => card.id === cardId);
    if (cardIndex === -1) return;
    
    const card = battlefieldCards[cardIndex];
    
    // Add the card to exile
    setExileCards(prev => [...prev, card]);
    
    // Also add any stacked cards to exile
    if (card.stackedCards.length > 0) {
      setExileCards(prev => [...prev, ...card.stackedCards]);
    }
    
    // Remove the card from the battlefield
    setBattlefieldCards(prev => prev.filter((_, index) => index !== cardIndex));
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
  
  // Function to restart the game
  const restartGame = () => {
    // Get the deck and reset the game state
    if (!deckId) return;
    
    const deck = getDeck(deckId);
    if (!deck) return;
    
    // Initialize cards, separating those that start in hand or in play
    const handStartCards: HandCard[] = [];
    const battlefieldStartCards: BattlefieldCard[] = [];
    const libraryCards: ZoneCard[] = [];
    
    deck.cards.forEach((card, index) => {
      const newCard = {
        ...card,
        id: `${card.id}_${index}`, // Ensure unique IDs for duplicates
      };
      
      // Skip sideboard cards entirely
      if (card.columnOption === 'sideboard') {
        return; // Skip this card
      }
      
      // Check if this card should start in hand
      if (card.columnOption === 'startsInHand') {
        handStartCards.push(newCard);
      } 
      // Check if this card should start in play face-up
      else if (card.columnOption === 'playFaceup') {
        // Add to battlefield with random position and face-up
        battlefieldStartCards.push({
          ...newCard,
          tapped: false,
          facedown: false,
          counters: 0,
          position: {
            x: 50 + Math.random() * 200, // Random position in battlefield
            y: 50 + Math.random() * 200,
          },
          stackedCards: [],
        });
      }
      // Check if this card should start in play face-down
      else if (card.columnOption === 'playFacedown') {
        // Add to battlefield with random position and face-down
        battlefieldStartCards.push({
          ...newCard,
          tapped: false,
          facedown: true, // Face-down instead of tapped
          counters: 0,
          position: {
            x: 50 + Math.random() * 200, // Random position in battlefield
            y: 50 + Math.random() * 200,
          },
          stackedCards: [],
        });
      } else {
        libraryCards.push(newCard);
      }
    });
    
    // Reset all game state
    setLibraryCards(libraryCards);
    setGraveyardCards([]);
    setExileCards([]);
    setCommandCards([]);
    setTurn(1);
    setLife(40);
    
    // Set hand cards if any should start in hand
    setHandCards(handStartCards);
    
    // Set battlefield cards if any should start in play
    if (battlefieldStartCards.length > 0) {
      setBattlefieldCards(battlefieldStartCards);
    } else {
      setBattlefieldCards([]);
    }
    
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
      facedown: false,
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
      stackedCards: [],
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
  
  // Function to cancel any pending card preview
  const cancelCardPreview = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    setPreviewCard(null);
    setPreviewPosition(null);
  };
  
  // Handle drag start event
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const activeId = active.id as string;
    let type: 'hand-card' | 'battlefield-card' | null = null;
    let cardData: HandCard | BattlefieldCard | undefined = undefined;
    let width = 0;
    let height = 0;

    if (active.rect.current.initial) {
      width = active.rect.current.initial.width;
      height = active.rect.current.initial.height;
    }

    if (activeId.startsWith('hand-')) {
      type = 'hand-card';
      const cardId = activeId.replace('hand-', '');
      cardData = handCards.find(card => card.id === cardId);
    } else if (activeId.startsWith('battlefield-')) {
      type = 'battlefield-card';
      const cardId = activeId.replace('battlefield-', '');
      cardData = battlefieldCards.find(card => card.id === cardId);
    }

    if (type && cardData) {
      setActiveDragItem({
        id: active.id,
        type,
        cardData,
        width,
        height,
      });
    }
    
    // Cancel any ongoing preview when dragging starts
    cancelCardPreview();
  };

  // Handle drag end event
  const handleDragEnd = (event: DragEndEvent) => {
    // Get active and over elements
    const { active, over } = event;
    
    // Return if one is missing
    if (!active || !over || !activeDragItem) {
      // Reset active drag item
      setActiveDragItem(null);
      return;
    }
    
    // Get the relevant IDs
    const activeId = active.id as string;
    const overId = over.id as string;
    
    console.log(`Drag ended: ${activeId} over ${overId}`);
    console.log("Active data:", active.data.current);
    console.log("Over data:", over.data.current);
    
    // Handle stacking cards on the battlefield (card dropped on another card)
    if ((activeDragItem.type === 'battlefield-card' || activeDragItem.type === 'hand-card') && 
        overId.toString().startsWith('battlefield-')) {
      
      // Extract the IDs
      const dropTargetId = overId.toString().replace('battlefield-', '');
      const draggedCardId = activeId.toString().replace(/^(battlefield-|hand-)/, '');
      
      console.log(`Stacking: ${draggedCardId} onto ${dropTargetId}`);
      
      // Don't stack a card on itself
      if (draggedCardId === dropTargetId) {
        console.log("Can't stack a card on itself - updating position only");
        // Just update position if it's a battlefield card
        if (activeDragItem.type === 'battlefield-card') {
          updateCardPosition(activeId, event);
        }
        setActiveDragItem(null);
        return;
      }
      
      // Get the target card to stack onto
      const targetCardIndex = battlefieldCards.findIndex(card => card.id === dropTargetId);
      if (targetCardIndex === -1) {
        console.log("Target card not found in battlefield");
        setActiveDragItem(null);
        return;
      }

      if (activeDragItem.type === 'hand-card') {
        console.log("Stacking from hand to battlefield");
        // Handle stacking from hand to battlefield
        const handCardIndex = handCards.findIndex(card => card.id === draggedCardId);
        if (handCardIndex === -1) {
          console.log("Hand card not found");
          setActiveDragItem(null);
          return;
        }
        
        const handCard = handCards[handCardIndex];
        
        // Remove from hand
        setHandCards(prev => prev.filter((_, index) => index !== handCardIndex));
        
        // Add to stack on battlefield
        setBattlefieldCards(prev => {
          const newCards = [...prev];
          const targetCard = { ...newCards[targetCardIndex] };
          
          // Create battlefield version of the hand card
          const cardToStack: BattlefieldCard = {
            ...handCard,
            tapped: targetCard.tapped, // Inherit tapped state
            facedown: false,
            counters: 0,
            position: { ...targetCard.position }, // Same position as target
            stackedCards: [], // Empty stack for the new card
          };
          
          // Add the card to the target's stack
          targetCard.stackedCards = [...targetCard.stackedCards, cardToStack];
          newCards[targetCardIndex] = targetCard;
          
          console.log(`Added ${handCard.name} to stack. Stack now has ${targetCard.stackedCards.length + 1} cards`);
          return newCards;
        });
      } else if (activeDragItem.type === 'battlefield-card') {
        console.log("Stacking from battlefield to battlefield");
        // Handle stacking from battlefield to battlefield
        const draggedCardIndex = battlefieldCards.findIndex(card => card.id === draggedCardId);
        if (draggedCardIndex === -1) {
          console.log("Dragged card not found in battlefield");
          setActiveDragItem(null);
          return;
        }
        
        // Prevent stacking if card already has cards stacked on it
        const draggedCard = battlefieldCards[draggedCardIndex];
        if (draggedCard.stackedCards.length > 0) {
          console.log("Can't stack a card that has cards stacked on it");
          // Flash animation or message could be added here
          setActiveDragItem(null);
          return;
        }
        
        // Remove from battlefield and add to stack
        setBattlefieldCards(prev => {
          const newCards = [...prev];
          
          // Skip if we're trying to stack onto ourselves or if indices are invalid
          if (draggedCardIndex === targetCardIndex || targetCardIndex >= newCards.length || draggedCardIndex >= newCards.length) {
            console.log("Invalid stack operation - indices problem");
            return prev;
          }
          
          // Get the cards
          const cardToMove = { ...newCards[draggedCardIndex] };
          const targetCard = { ...newCards[targetCardIndex] };
          
          // Add the dragged card to the target's stack
          targetCard.stackedCards = [...targetCard.stackedCards, cardToMove];
          
          // Update the target card
          newCards[targetCardIndex] = targetCard;
          
          console.log(`Added ${cardToMove.name} to stack. Stack now has ${targetCard.stackedCards.length + 1} cards`);
          
          // Remove the original card
          return newCards.filter((_, index) => index !== draggedCardIndex);
        });
      }
      
      // Reset active drag item
      setActiveDragItem(null);
      return;
    }
    
    // Handle card play from hand to battlefield
    if (activeDragItem.type === 'hand-card' && overId === 'battlefield') {
      // Extract the card ID from the activeId
      const cardId = activeId.replace('hand-', '');
      
      // Get the battlefield element and mouse position
      const battlefieldElement = document.querySelector('.playmat-battlefield');
      if (battlefieldElement) {
        const rect = battlefieldElement.getBoundingClientRect();
        // Use the mouse pointer position for more accurate placement
        if (event.active.rect.current.translated) {
          const dropX = event.active.rect.current.translated.left - rect.left + (activeDragItem.width / 2);
          const dropY = event.active.rect.current.translated.top - rect.top + (activeDragItem.height / 2);
          
          // PlayCard function but with custom position
          const cardIndex = handCards.findIndex(card => card.id === cardId);
          if (cardIndex === -1) return;
          
          const card = handCards[cardIndex];
          
          // Remove from hand
          setHandCards(prev => {
            const newHand = prev.filter((_, index) => index !== cardIndex);
            return newHand;
          });
          
          // Add to battlefield with the exact drop position
          let addedCard: BattlefieldCard | null = null;
          setBattlefieldCards(prev => {
            const cardToBattlefield: BattlefieldCard = {
              ...card,
              tapped: false,
              facedown: false,
              counters: 0,
              position: {
                x: Math.max(0, dropX),
                y: Math.max(0, dropY),
              },
              stackedCards: [],
            };
            addedCard = cardToBattlefield;
            return [...prev, cardToBattlefield];
          });
          
          // Add to recently dropped set for animation
          if (addedCard) {
            const cardForAnimation: BattlefieldCard = addedCard;
            setRecentlyDropped(prev => {
              const newSet = new Set(prev);
              newSet.add(cardForAnimation.id);
              setTimeout(() => {
                setRecentlyDropped(current => {
                  const updated = new Set(current);
                  updated.delete(cardForAnimation.id);
                  return updated;
                });
              }, 500);
              return newSet;
            });
          }
        } else {
          // Fallback if translated position is not available
          playCard(cardId);
        }
      } else {
        // Fallback to standard playCard if we can't get the position
        playCard(cardId);
      }
    }
    
    // Handle moving battlefield cards
    if (activeDragItem.type === 'battlefield-card' && overId === 'battlefield') {
      updateCardPosition(activeId, event);
    }
    
    // Handle drop to hand zone
    if (activeDragItem.type === 'battlefield-card' && overId === 'hand-zone') {
      // Extract the card ID from the activeId
      const cardId = activeId.replace('battlefield-', '');
      returnToHand(cardId);
    }
    
    // Reset active drag item
    setActiveDragItem(null);
  };
  
  // Helper function to update card position
  const updateCardPosition = (activeId: string, event: DragEndEvent) => {
    const battlefieldElement = document.querySelector('.playmat-battlefield');
    if (battlefieldElement && event.active.rect.current.translated && activeDragItem) {
      const rect = battlefieldElement.getBoundingClientRect();
      // Make sure translated is not null
      const translated = event.active.rect.current.translated;
      // Use the center of the dragged card for positioning
      const dropX = translated.left - rect.left + (activeDragItem.width / 2);
      const dropY = translated.top - rect.top + (activeDragItem.height / 2);
      
      // Update the card's position
      const cardId = activeId.replace('battlefield-', '');
      setBattlefieldCards(prev => 
        prev.map(card => 
          card.id === cardId 
            ? { 
                ...card, 
                position: { 
                  x: Math.max(0, dropX),
                  y: Math.max(0, dropY)
                } 
              }
            : card
        )
      );
    }
  };
  
  // Render drag overlay content
  const renderDragOverlay = () => {
    if (!activeDragItem) return null;

    const card = activeDragItem.cardData;
    const isBattlefieldCard = activeDragItem.type === 'battlefield-card';
    const isFacedown = isBattlefieldCard && (card as BattlefieldCard).facedown;

    return (
      <div className="dnd-overlay" style={{ 
        width: '120px', 
        height: '168px',  // Maintain 5:7 ratio
        overflow: 'hidden'
      }}>
        {isFacedown ? (
          // Render card back for facedown battlefield cards
          <div className="card-back" style={{ width: '100%', height: '100%' }}>
            <div className="card-back-inner"></div>
          </div>
        ) : card.image_uris?.normal ? (
          <img 
            src={card.image_uris.normal} 
            alt={card.name} 
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
        ) : card.card_faces && card.card_faces[0]?.image_uris?.normal ? (
          <img 
            src={card.card_faces[0].image_uris.normal} 
            alt={card.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            background: '#222',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '5px',
            textAlign: 'center',
            fontSize: '10px',
          }}>
            {card.name}
          </div>
        )}
      </div>
    );
  };
  
  // Function to handle mouse enter on card
  const handleCardMouseEnter = (card: Card, event: React.MouseEvent) => {
    // Clear any existing timer
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    
    // Get the card element from the event
    const cardElement = event.currentTarget as HTMLElement;
    
    // Set a timer to show the preview after 500ms
    hoverTimerRef.current = setTimeout(() => {
      if (cardElement) {
        // Get the center position of the card for anchoring
        const rect = cardElement.getBoundingClientRect();
        const cardCenterX = rect.left + (rect.width / 2);
        const cardCenterY = rect.top + (rect.height / 2);
        
        // Show the preview anchored to the card
        setPreviewCard(card);
        setPreviewPosition({ x: cardCenterX, y: cardCenterY });
      }
    }, 500); // 500ms = half a second delay
  };
  
  // Function to handle mouse leave on card
  const handleCardMouseLeave = () => {
    cancelCardPreview();
  };
  
  // Function to return a card from battlefield to hand
  const returnToHand = (cardId: string) => {
    console.log("Returning card to hand with ID:", cardId);
    // Find the card in the battlefield
    const cardIndex = battlefieldCards.findIndex(card => card.id === cardId);
    
    if (cardIndex === -1) {
      console.error("Card not found in battlefield:", cardId);
      return;
    }
    
    // Get the card
    const card = battlefieldCards[cardIndex];
    
    // Create a hand card version
    const handCard: HandCard = {
      ...card,
      id: card.id
    };
    
    // Remove from battlefield
    setBattlefieldCards(prev => {
      return prev.filter((_, index) => index !== cardIndex);
    });
    
    // Add to hand
    setHandCards(prev => [...prev, handCard]);
  };
  
  // Add a flip card function
  const flipCard = (cardId: string) => {
    setBattlefieldCards(prev => 
      prev.map(card => 
        card.id === cardId 
          ? { ...card, facedown: !card.facedown } 
          : card
      )
    );
  };

  // Add a function to handle unstacking a card
  const unstackTopCard = (cardId: string) => {
    // Find the card with the stack
    const cardIndex = battlefieldCards.findIndex(card => card.id === cardId);
    if (cardIndex === -1 || !battlefieldCards[cardIndex].stackedCards.length) return;
    
    setBattlefieldCards(prev => {
      const newCards = [...prev];
      const stackCard = { ...newCards[cardIndex] };
      
      // Get the top card from the stack (last item in array)
      const topCard = stackCard.stackedCards[stackCard.stackedCards.length - 1];
      
      // Remove it from the stack
      stackCard.stackedCards = stackCard.stackedCards.slice(0, -1);
      newCards[cardIndex] = stackCard;
      
      // Position the unstacked card slightly offset from the original stack
      const unstackedCard: BattlefieldCard = {
        ...topCard,
        position: {
          x: stackCard.position.x + 30,
          y: stackCard.position.y + 30
        }
      };
      
      // Add the unstacked card to the battlefield
      return [...newCards, unstackedCard];
    });
    
    // Hide context menu
    setContextMenu({ show: false, x: 0, y: 0, cardId: null, isStack: false });
  };

  // Add a context menu handler to BattlefieldDroppable
  const handleContextMenu = (e: React.MouseEvent, cardId: string, isStack: boolean) => {
    e.preventDefault();
    setContextMenu({
      show: true,
      x: e.clientX,
      y: e.clientY,
      cardId,
      isStack
    });
  };
  
  return (
    <div className="playmat-container">
      <div className="playmat-top-bar">
        <div className="playmat-name">
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
      
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <BattlefieldDroppable
          battlefieldCards={battlefieldCards}
          recentlyDropped={recentlyDropped}
          tapCard={tapCard}
          addCounter={addCounter}
          removeCounter={removeCounter}
          sendToGraveyard={sendToGraveyard}
          sendToExile={sendToExile}
          flipCard={flipCard}
          handleCardMouseEnter={handleCardMouseEnter}
          handleCardMouseLeave={handleCardMouseLeave}
          handleContextMenu={handleContextMenu}
          clearContextMenu={() => setContextMenu({ show: false, x: 0, y: 0, cardId: null, isStack: false })}
        />
        
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
        
        {/* Hand zone - update with new draggable prop */}
        <HandZone 
          cards={handCards} 
          onCardPlay={playCard} 
          onCardMouseEnter={handleCardMouseEnter}
          onCardMouseLeave={handleCardMouseLeave}
          onReturnToHand={returnToHand}
        />
        
        {/* Render drag overlay */}
        <DragOverlay>
          {activeDragItem && renderDragOverlay()}
        </DragOverlay>
      </DndContext>
      
      {/* Card context menu */}
      {contextMenu.show && contextMenu.cardId && (
        <div 
          className="card-context-menu" 
          style={{ 
            position: 'fixed', 
            top: `${contextMenu.y}px`, 
            left: `${contextMenu.x}px` 
          }}
        >
          <div className="card-context-menu-item" onClick={() => {
            if (contextMenu.cardId) tapCard(contextMenu.cardId);
            setContextMenu({ show: false, x: 0, y: 0, cardId: null, isStack: false });
          }}>
            Tap/Untap
          </div>
          <div className="card-context-menu-item" onClick={() => {
            if (contextMenu.cardId) addCounter(contextMenu.cardId);
            setContextMenu({ show: false, x: 0, y: 0, cardId: null, isStack: false });
          }}>
            Add Counter
          </div>
          <div className="card-context-menu-item" onClick={() => {
            if (contextMenu.cardId) removeCounter(contextMenu.cardId);
            setContextMenu({ show: false, x: 0, y: 0, cardId: null, isStack: false });
          }}>
            Remove Counter
          </div>
          <div className="card-context-menu-item" onClick={() => {
            if (contextMenu.cardId) flipCard(contextMenu.cardId);
            setContextMenu({ show: false, x: 0, y: 0, cardId: null, isStack: false });
          }}>
            Flip Card
          </div>
          {contextMenu.isStack && (
            <div className="card-context-menu-item" onClick={() => {
              if (contextMenu.cardId) unstackTopCard(contextMenu.cardId);
            }}>
              Unstack Top Card
            </div>
          )}
          <div className="card-context-menu-item" onClick={() => {
            if (contextMenu.cardId) sendToGraveyard(contextMenu.cardId);
            setContextMenu({ show: false, x: 0, y: 0, cardId: null, isStack: false });
          }}>
            Send to Graveyard
          </div>
          <div className="card-context-menu-item" onClick={() => {
            if (contextMenu.cardId) sendToExile(contextMenu.cardId);
            setContextMenu({ show: false, x: 0, y: 0, cardId: null, isStack: false });
          }}>
            Send to Exile
          </div>
        </div>
      )}
      
      {/* Card Preview */}
      <CardPreview card={previewCard} position={previewPosition} />
    </div>
  );
};

// Card Preview Component
const CardPreview: React.FC<{
  card: Card | null;
  position: { x: number; y: number } | null;
}> = ({ card, position }) => {
  // Make sure we have both a card and valid position
  if (!card || !position || 
      position.x === undefined || position.y === undefined || 
      isNaN(position.x) || isNaN(position.y)) {
    return null;
  }
  
  const imageUrl = card.image_uris?.normal 
    ? card.image_uris.normal 
    : card.card_faces && card.card_faces[0]?.image_uris?.normal 
      ? card.card_faces[0].image_uris.normal 
      : '';
      
  if (!imageUrl) return null;
  
  // Calculate final position to avoid layout shifts
  const cardWidth = 240; // Set a fixed width to match CSS
  const cardHeight = 340; // Approximate height based on card ratio (5:7)
  const mtgCardWidth = 120; // Approximate width of a card in the hand
  
  // Determine which half of the screen the cursor is on
  const screenHalfWidth = window.innerWidth / 2;
  const isOnLeftHalf = position.x < screenHalfWidth;
  
  // Position preview directly to the right or left of the card
  let adjustedX;
  if (isOnLeftHalf) {
    // Card is on left half, anchor preview to right edge of card
    adjustedX = position.x + (mtgCardWidth / 2) + 10; // Card width/2 + margin
  } else {
    // Card is on right half, anchor preview to left edge of card
    adjustedX = position.x - (mtgCardWidth / 2) - cardWidth - 10; // Card width/2 - preview width - margin
  }
  
  // Adjust Y position to center vertically with the card
  let adjustedY = position.y - (cardHeight / 2);
  
  // Ensure preview stays within screen boundaries vertically
  if (adjustedY < 10) {
    adjustedY = 10; // Top margin
  } else if (adjustedY + cardHeight > window.innerHeight - 10) {
    adjustedY = window.innerHeight - cardHeight - 10; // Bottom margin
  }
  
  // Ensure preview stays within screen boundaries horizontally
  if (adjustedX < 10) {
    adjustedX = 10; // Left margin
  } else if (adjustedX + cardWidth > window.innerWidth - 10) {
    adjustedX = window.innerWidth - cardWidth - 10; // Right margin
  }
  
  return (
    <div 
      className={`card-preview ${isOnLeftHalf ? 'preview-right' : 'preview-left'}`}
      style={{ 
        left: `${adjustedX}px`, 
        top: `${adjustedY}px`,
      }}
    >
      <img 
        src={imageUrl} 
        alt={card.name} 
        className="card-preview-image"
        loading="eager"
      />
    </div>
  );
};

export default Playmat; 