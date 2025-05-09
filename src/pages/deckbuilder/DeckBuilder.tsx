import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, faTimes, faSpinner, faChevronLeft, faChevronRight, 
  faTrash, faSave, faRedo, faPlus, faMinus, faFileImport 
} from '@fortawesome/free-solid-svg-icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ScryfallAPI, { Card } from '../../utils/ScryfallAPI';
import '../../App.css';
import '../search/SearchPage.css';
import './DeckBuilder.css';
import { useDeckContext, DeckCard as ContextDeckCard, Deck } from '../../context/DeckContext';
// Import only the dnd-kit components we'll use
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

// Interface for deck cards with count
interface DeckCard extends Card {
  count: number;
  column?: number; // Add column tracking
  stackPosition?: number; // Add stack position tracking
}

// Interface for column information
interface ColumnInfo {
  title: string;
}

// Save deck dialog props
interface SaveDeckDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, description: string) => void;
  defaultDeckName?: string;
}

// Types for drag items
type DragItemType = {
  id: UniqueIdentifier;
  type: 'card' | 'deck-card';
  cardData: Card | DeckCard;
  columnId?: number;
};

// Save deck dialog component
const SaveDeckDialog: React.FC<SaveDeckDialogProps> = ({ 
  isOpen, 
  onClose, 
  onSave,
  defaultDeckName = ''
}) => {
  const [deckName, setDeckName] = useState(defaultDeckName);
  const [deckDescription, setDeckDescription] = useState('');
  const [error, setError] = useState('');

  // Update deckName when defaultDeckName changes
  useEffect(() => {
    if (defaultDeckName) {
      setDeckName(defaultDeckName);
    }
  }, [defaultDeckName]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deckName.trim()) {
      setError('Deck name is required');
      return;
    }
    onSave(deckName, deckDescription);
    setDeckName('');
    setDeckDescription('');
    setError('');
  };

  return (
    <div className="save-deck-dialog-overlay">
      <div className="save-deck-dialog">
        <h2>Save Deck</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="deck-name">Deck Name</label>
            <input
              id="deck-name"
              type="text"
              value={deckName}
              onChange={(e) => setDeckName(e.target.value)}
              placeholder="Enter a name for your deck"
              required
            />
            {error && <div className="error-message">{error}</div>}
          </div>
          <div className="form-group">
            <label htmlFor="deck-description">Description (optional)</label>
            <textarea
              id="deck-description"
              value={deckDescription}
              onChange={(e) => setDeckDescription(e.target.value)}
              placeholder="Enter a description for your deck"
              rows={4}
            />
          </div>
          <div className="dialog-buttons">
            <button type="button" className="cancel-button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="save-button">
              Save Deck
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Draggable Card component for search results
const DraggableSearchCard: React.FC<{
  card: Card;
  onClick: () => void;
  isSelected: boolean;
  onMouseEnter: (card: Card, event: React.MouseEvent) => void;
  onMouseLeave: () => void;
  onDragStart: () => void;
}> = ({ card, onClick, isSelected, onMouseEnter, onMouseLeave, onDragStart }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `search-${card.id}`,
    data: {
      type: 'card',
      card
    }
  });

  // When dragging starts, isDragging becomes true
  useEffect(() => {
    if (isDragging) {
      onDragStart();
    }
  }, [isDragging, onDragStart]);

  const style = {
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0 : 1,
    cursor: isDragging ? 'grabbing' : 'grab'
  };

  return (
    <div 
      ref={setNodeRef}
      className={`card-item ${isSelected ? 'card-selected' : ''}`}
      onClick={onClick}
      style={style}
      data-card-id={card.id}
      onMouseEnter={(e) => onMouseEnter(card, e)}
      onMouseLeave={onMouseLeave}
      {...listeners}
      {...attributes}
    >
      {card.image_uris?.normal ? (
        <img 
          src={card.image_uris.normal} 
          alt={card.name} 
          className="card-image"
          loading="lazy"
          draggable={false}
        />
      ) : card.card_faces && card.card_faces[0]?.image_uris?.normal ? (
        <img 
          src={card.card_faces[0].image_uris.normal} 
          alt={card.name} 
          className="card-image"
          loading="lazy"
          draggable={false}
        />
      ) : (
        <div className="card-placeholder">
          <p>{card.name}</p>
        </div>
      )}
      <h3 className="card-name">{card.name}</h3>
    </div>
  );
};

// Update the DraggableDeckCard component to hide corner quantity when selected
const DraggableDeckCard: React.FC<{
  card: DeckCard;
  index: number;
  removeCardFromDeck: (cardId: string) => void;
  isSelected: boolean;
  onClick: () => void;
  onMouseEnter: (card: Card, event: React.MouseEvent) => void;
  onMouseLeave: () => void;
  onDragStart: () => void;
  onIncrementCard: (cardId: string) => void;
  onDecrementCard: (cardId: string) => void;
}> = ({ 
  card, 
  index, 
  removeCardFromDeck, 
  isSelected, 
  onClick,
  onMouseEnter,
  onMouseLeave,
  onDragStart,
  onIncrementCard,
  onDecrementCard
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: card.id,
    data: {
      type: 'deck-card',
      card
    }
  });

  // When dragging starts, isDragging becomes true
  useEffect(() => {
    if (isDragging) {
      onDragStart();
    }
  }, [isDragging, onDragStart]);

  // Prevent drag operations from affecting the buttons
  const handleQuantityButtonClick = (e: React.MouseEvent, callback: () => void) => {
    e.stopPropagation(); // Prevent triggering card click
    e.preventDefault(); // Prevent drag operation
    
    // Log when button is clicked
    console.log("Quantity button clicked");
    
    // Execute the callback function
    callback();
  };

  const style = {
    zIndex: index + 1,
    position: 'absolute' as const,
    top: `${index * 65 + 30}px`, // Reduced from 80px to 65px for more moderate spacing
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0 : 1 // Completely invisible when dragging
  };

  return (
    <div 
      ref={setNodeRef}
      className={`deck-card-item ${isSelected ? 'card-selected' : ''}`}
      style={style}
      data-card-id={card.id}
      data-dragging={isDragging ? 'true' : 'false'}
      onClick={onClick}
      onMouseEnter={(e) => onMouseEnter(card, e)}
      onMouseLeave={onMouseLeave}
      {...listeners}
      {...attributes}
    >
      <div className="deck-card-image-container">
        {/* Quantity controls - only appears when selected */}
        <div className="card-quantity-controls" onClick={(e) => e.stopPropagation()}>
          <button 
            className="quantity-btn subtract" 
            onClick={(e) => {
              e.stopPropagation(); // Prevent card selection/deselection
              onDecrementCard(card.id);
            }}
            aria-label={`Decrease quantity of ${card.name}`}
          >
            <FontAwesomeIcon icon={faMinus} size="xs" />
          </button>
          <span className="card-quantity">x{card.count}</span>
          <button 
            className="quantity-btn add" 
            onClick={(e) => {
              e.stopPropagation(); // Prevent card selection/deselection
              onIncrementCard(card.id);
            }}
            aria-label={`Increase quantity of ${card.name}`}
          >
            <FontAwesomeIcon icon={faPlus} size="xs" />
          </button>
        </div>

        {/* Card count badge - only show when not selected and count >= 2 */}
        {!isSelected && card.count >= 2 && (
          <div className="deck-card-count">x{card.count}</div>
        )}

        {card.image_uris?.normal ? (
          <img 
            src={card.image_uris.normal} 
            alt={card.name} 
            className="deck-card-image"
            draggable={false}
          />
        ) : card.card_faces && card.card_faces[0]?.image_uris?.normal ? (
          <img 
            src={card.card_faces[0].image_uris.normal} 
            alt={card.name} 
            className="deck-card-image"
            draggable={false}
          />
        ) : (
          <div className="deck-card-placeholder">
            <p>{card.name}</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Update the DroppableColumn component to pass increment/decrement handlers
const DroppableColumn: React.FC<{
  columnId: number;
  title: string;
  cards: DeckCard[];
  onTitleChange: (title: string) => void;
  removeCardFromDeck: (cardId: string) => void;
  selectedCardId: string | null;
  onCardClick: (cardId: string) => void;
  onCardMouseEnter: (card: Card, event: React.MouseEvent) => void;
  onCardMouseLeave: () => void;
  onCardDragStart: () => void;
  onIncrementCard: (cardId: string) => void;
  onDecrementCard: (cardId: string) => void;
}> = ({ 
  columnId, 
  title, 
  cards, 
  onTitleChange, 
  removeCardFromDeck, 
  selectedCardId, 
  onCardClick,
  onCardMouseEnter,
  onCardMouseLeave,
  onCardDragStart,
  onIncrementCard,
  onDecrementCard
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${columnId}`,
    data: {
      type: 'column',
      columnId
    }
  });

  return (
    <div 
      ref={setNodeRef}
      className={`deck-column ${cards.length === 0 ? 'empty-column' : ''}`}
      data-column-id={columnId}
      data-over={isOver ? 'true' : 'false'}
    >
      <div className="column-title-container">
        <input
          type="text"
          className="column-title-input"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder={`Category ${columnId + 1}`}
        />
      </div>
      
      {cards.map((card, index) => (
        <DraggableDeckCard 
          key={`${card.id}-column${columnId}-pos${index}`}
          card={card}
          index={index}
          removeCardFromDeck={removeCardFromDeck}
          isSelected={card.id === selectedCardId}
          onClick={() => onCardClick(card.id)}
          onMouseEnter={onCardMouseEnter}
          onMouseLeave={onCardMouseLeave}
          onDragStart={onCardDragStart}
          onIncrementCard={onIncrementCard}
          onDecrementCard={onDecrementCard}
        />
      ))}
      
      {/* Add a spacer div to ensure column has proper height */}
      <div 
        className="column-spacer" 
        style={{ 
          height: `${(cards.length > 0 ? 
            // Add extra space for title (30px) plus card spacing
            // Adjust spacing to match the updated card stacking
            (cards.length - 1) * 65 + 170 + 30
            : 170)}px`
        }} 
      />
    </div>
  );
};

// Keep a cache of preloaded images
const imageCache: Record<string, HTMLImageElement> = {};

// Add a new interface for the ImportDeckDialog component
interface ImportDeckDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (cards: string) => void;
}

// Create ImportDeckDialog component
const ImportDeckDialog: React.FC<ImportDeckDialogProps> = ({ 
  isOpen, 
  onClose, 
  onImport
}) => {
  const [importText, setImportText] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const content = fileContent || importText;
    if (!content.trim()) {
      setError('Please enter deck list or upload a file');
      return;
    }
    onImport(content);
    setImportText('');
    setFileContent('');
    setError('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setFileContent(content);
    };
    reader.onerror = () => {
      setError('Error reading file');
    };
    reader.readAsText(file);
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="save-deck-dialog-overlay">
      <div className="save-deck-dialog import-deck-dialog">
        <h2>Import Deck</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="deck-import">Paste deck list or upload a file</label>
            <textarea
              id="deck-import"
              value={fileContent || importText}
              onChange={(e) => {
                setImportText(e.target.value);
                setFileContent('');
              }}
              placeholder="Paste deck list here (1 card per line, format: 'quantity cardname')"
              rows={10}
            />
            {error && <div className="error-message">{error}</div>}
          </div>
          <div className="form-group">
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              accept=".txt"
              style={{ display: 'none' }}
            />
            <button 
              type="button" 
              className="browse-button" 
              onClick={handleBrowseClick}
            >
              Browse...
            </button>
            <span className="file-info">
              {fileContent ? 'File loaded successfully' : 'No file selected'}
            </span>
          </div>
          <div className="dialog-buttons">
            <button type="button" className="cancel-button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="import-button">
              Import Deck
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const DeckBuilder: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const deckIdParam = searchParams.get('deck');
  const navigate = useNavigate();
  const { addDeck, getDeck, updateDeck } = useDeckContext();
  
  // State to track if we're editing an existing deck
  const [isEditingDeck, setIsEditingDeck] = useState<boolean>(false);
  const [editingDeckId, setEditingDeckId] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [hasSearched, setHasSearched] = useState(!!initialQuery);
  const [suggestions, setSuggestions] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const [searchResults, setSearchResults] = useState<Card[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const lastSearchRef = useRef<string>('');
  const deckAreaRef = useRef<HTMLDivElement>(null);
  
  // Add state for selected card
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  
  // State for save deck dialog
  const [showSaveDeckDialog, setShowSaveDeckDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaveOperation, setIsSaveOperation] = useState(false);
  
  // State for deck cards
  const [deckCards, setDeckCards] = useState<DeckCard[]>([]);
  
  // Add state for deck title
  const [deckTitle, setDeckTitle] = useState<string>('Untitled Deck');
  
  // State for column titles
  const [columnTitles, setColumnTitles] = useState<Record<number, string>>({
    0: "Creatures",
    1: "Spells",
    2: "Artifacts",
    3: "Enchantments",
    4: "Lands",
    5: "Sideboard"
  });
  
  // State for active drag
  const [activeDragItem, setActiveDragItem] = useState<DragItemType | null>(null);
  
  // State for carousel pagination
  const [currentPage, setCurrentPage] = useState(0);
  const cardsPerPage = 5;
  
  // Calculate total pages
  const totalPages = Math.ceil(searchResults.length / cardsPerPage);

  // Set up sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px needed to activate drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Function to navigate between pages
  const goToPage = (page: number) => {
    if (page >= 0 && page < totalPages) {
      setCurrentPage(page);
    }
  };

  // Get current page's cards
  const getCurrentPageCards = () => {
    const startIndex = currentPage * cardsPerPage;
    return searchResults.slice(startIndex, startIndex + cardsPerPage);
  };
  
  // Reset currentPage when new search results come in
  useEffect(() => {
    setCurrentPage(0);
  }, [searchResults]);

  // State to track preloaded images
  const [preloadedImages, setPreloadedImages] = useState<Record<string, boolean>>({});

  // Preload card images when search results change
  useEffect(() => {
    const preloadImages = async () => {
      // Only process new cards that aren't in the cache
      const cardsToPreload = searchResults.filter(card => {
        const imageUrl = getCardImageUrl(card);
        return imageUrl && !preloadedImages[imageUrl];
      });

      if (cardsToPreload.length === 0) return;

      const newPreloadedImages = { ...preloadedImages };

      for (const card of cardsToPreload) {
        const imageUrl = getCardImageUrl(card);
        if (!imageUrl) continue;

        // Create a new image and add to cache
        const img = new Image();
        img.src = imageUrl;
        
        imageCache[imageUrl] = img;
        newPreloadedImages[imageUrl] = true;

        // Ensure image loads
        await new Promise(resolve => {
          if (img.complete) {
            resolve(null);
          } else {
            img.onload = () => resolve(null);
            img.onerror = () => resolve(null); // Continue even if error
          }
        });
      }

      setPreloadedImages(newPreloadedImages);
    };

    preloadImages();
  }, [searchResults, preloadedImages]);

  // Helper function to get the best available image URL for a card
  const getCardImageUrl = (card: Card): string => {
    if (card.image_uris?.small) {
      return card.image_uris.small;
    } else if (card.card_faces && card.card_faces[0]?.image_uris?.small) {
      return card.card_faces[0].image_uris.small;
    }
    return '';
  };

  // Add a function to cancel the preview
  const cancelCardPreview = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    setPreviewCard(null);
    setPreviewPosition(null);
  };

  // Handle drag start event - update to cancel the preview
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const activeId = active.id as string;
    
    // Cancel any pending or active preview
    cancelCardPreview();
    
    // Deselect any selected card when starting to drag
    setSelectedCardId(null);
    
    // Get the card data from the event
    if (activeId.startsWith('search-')) {
      // It's a search card
      const originalId = activeId.replace('search-', '');
      const cardData = searchResults.find(card => card.id === originalId);
      
      if (cardData) {
        setActiveDragItem({
          id: activeId,
          type: 'card',
          cardData
        });
      }
    } else {
      // It's a deck card
      const card = deckCards.find(card => card.id === activeId);
      
      if (card) {
        setActiveDragItem({
          id: activeId,
          type: 'deck-card',
          cardData: card,
          columnId: card.column
        });
      }
    }
  };

  // Handle drag over event
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    
    if (!over) return;
    
    // Store the target column ID in the active drag item
    if (over.id.toString().startsWith('column-')) {
      const columnId = parseInt(over.id.toString().replace('column-', ''));
      
      if (activeDragItem && activeDragItem.columnId !== columnId) {
        setActiveDragItem({
          ...activeDragItem,
          columnId: columnId
        });
      }
    }
  };

  // Handle drag end event
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!activeDragItem || !over) {
      setActiveDragItem(null);
      return;
    }
    
    // Check if dropping into a column
    if (over.id.toString().startsWith('column-')) {
      const targetColumnId = parseInt(over.id.toString().replace('column-', ''));
      
      // Handle search card being added to deck
      if (activeDragItem.type === 'card') {
        const searchCard = activeDragItem.cardData as Card;
        addCardToDeck(searchCard, targetColumnId);
      }
      // Handle deck card being moved
      else if (activeDragItem.type === 'deck-card') {
        const draggedCard = activeDragItem.cardData as DeckCard;
        const sourceColumn = draggedCard.column ?? 0;
        
        // If dropping on a different column, move the card
        if (sourceColumn !== targetColumnId) {
          moveCardToColumn(draggedCard.id, sourceColumn, targetColumnId);
        }
      }
    }
    
    setActiveDragItem(null);
  };

  // Add card to deck
  const addCardToDeck = (card: Card, targetColumn?: number): void => {
    setDeckCards(prevCards => {
      // Check if the card is already in the deck
      const existingCardIndex = prevCards.findIndex(c => c.id === card.id);
      
      if (existingCardIndex >= 0) {
        // Increment count if card already exists
        const updatedCards = [...prevCards];
        updatedCards[existingCardIndex] = {
          ...updatedCards[existingCardIndex],
          count: updatedCards[existingCardIndex].count + 1
        };
        return updatedCards;
      } else {
        // Find existing columns and their card counts
        const columnCounts: Record<number, number> = {};
        const maxColumns = 6; // 6 columns
        
        // Count cards in each column
        prevCards.forEach(c => {
          if (c.column !== undefined) {
            columnCounts[c.column] = (columnCounts[c.column] || 0) + 1;
          }
        });
        
        // Use targetColumn if provided, otherwise find the column with the lowest count
        let column = targetColumn;
        if (column === undefined) {
          column = 0;
          for (let i = 0; i < maxColumns; i++) {
            if (!columnCounts[i] || (columnCounts[column] || 0) > (columnCounts[i] || 0)) {
              column = i;
            }
          }
        }
        
        // Get the stack position (number of cards already in this column)
        const stackPosition = columnCounts[column] || 0;
        
        // Add new card to deck with column and stack position
        return [...prevCards, { ...card, count: 1, column, stackPosition }];
      }
    });
  };
  
  // Move card to a different column
  const moveCardToColumn = (cardId: string, sourceColumn: number, targetColumn: number) => {
    setDeckCards(prevCards => {
      // Find the card
      const cardIndex = prevCards.findIndex(c => c.id === cardId);
      if (cardIndex === -1) return prevCards;
      
      const card = prevCards[cardIndex];
      const cardStackPosition = card.stackPosition || 0;
      
      // Get target column card count for new position
      const targetColumnCards = prevCards.filter(c => c.column === targetColumn);
      const newPosition = targetColumnCards.length;
      
      // Create updated card with new column
      const updatedCard = {
        ...card,
        column: targetColumn,
        stackPosition: newPosition
      };
      
      // Remove card from old position
      const cardsWithoutMoved = prevCards.filter(c => c.id !== cardId);
      
      // Update positions of cards in source column
      const finalCards = cardsWithoutMoved.map(c => {
        if (c.column === sourceColumn && 
            c.stackPosition !== undefined && 
            c.stackPosition > cardStackPosition) {
          return {
            ...c,
            stackPosition: c.stackPosition - 1
          };
        }
        return c;
      });
      
      // Add the updated card
      finalCards.push(updatedCard);
      
      return finalCards;
    });
  };
  
  // Remove card from deck
  const removeCardFromDeck = (cardId: string) => {
    console.log("Remove card from deck:", cardId);
    setDeckCards(prevCards => {
      const existingCardIndex = prevCards.findIndex(c => c.id === cardId);
      
      if (existingCardIndex >= 0) {
        const card = prevCards[existingCardIndex];
        console.log("Found card, current count:", card.count);
        
        if (card.count > 1) {
          // Decrement count if more than one
          console.log("Decrementing count (it's > 1)");
          const updatedCards = [...prevCards];
          updatedCards[existingCardIndex] = {
            ...card,
            count: card.count - 1
          };
          return updatedCards;
        } else {
          // Remove card and update stack positions
          console.log("Removing card (count is 1)");
          const column = card.column;
          const removedStackPosition = card.stackPosition;
          
          // Filter out the removed card and update stack positions for cards in the same column
          return prevCards
            .filter(c => c.id !== cardId)
            .map(c => {
              // If card is in the same column and has a higher stack position,
              // decrement its stack position
              if (c.column === column && c.stackPosition !== undefined && 
                  removedStackPosition !== undefined && c.stackPosition > removedStackPosition) {
                return { ...c, stackPosition: c.stackPosition - 1 };
              }
              return c;
            });
        }
      }
      
      console.log("Card not found in deck");
      return prevCards;
    });
  };

  // Initialize click outside handler for suggestions
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
  
  // Add event listener to clear card selection when clicking outside cards
  useEffect(() => {
    const handleClearCardSelection = (event: MouseEvent) => {
      // Get the clicked element and check if it's a card or inside a card
      const target = event.target as HTMLElement;
      const isCardClick = 
        target.closest('.deck-card-item') || 
        target.closest('.card-item') ||
        // Don't clear when clicking card controls like the remove button
        target.closest('.deck-card-remove');
        
      if (!isCardClick) {
        setSelectedCardId(null);
      }
    };
    
    document.addEventListener('mousedown', handleClearCardSelection);
    return () => {
      document.removeEventListener('mousedown', handleClearCardSelection);
    };
  }, []);
  
  // Perform search when initialQuery is available
  useEffect(() => {
    if (initialQuery && !isLoading) {
      handleSearch();
    }
  }, [initialQuery]);
  
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
    
    // Prevent searching if already loading
    if (isLoading) return;
    
    setIsLoading(true);
    setShowSuggestions(false);
    setHasSearched(true);
    
    try {
      // Use Scryfall API search
      const response = await ScryfallAPI.searchCards(trimmedQuery);
      
      if (response.data && response.data.length > 0) {
        setSearchResults(response.data);
        lastSearchRef.current = trimmedQuery;
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
  
  // Handle clear search
  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSuggestions(false);
    setHasSearched(false);
    lastSearchRef.current = '';
    
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };
  
  // Handle Enter key press
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
  
  // Calculate deck stats
  const getDeckStats = () => {
    const totalCards = deckCards.reduce((total, card) => total + card.count, 0);
    return { totalCards };
  };

  // Group cards by column for rendering
  const groupCardsByColumn = () => {
    const columnsMap: Record<number, DeckCard[]> = {};
    const maxColumns = 6; // Match the number of columns in CSS
    
    // Initialize all columns (even empty ones)
    for (let i = 0; i < maxColumns; i++) {
      columnsMap[i] = [];
    }
    
    // Group cards by their column
    deckCards.forEach(card => {
      const column = card.column !== undefined ? card.column : 0;
      if (column < maxColumns) {
        columnsMap[column].push(card);
      } else {
        // If a card somehow has a column outside our range, put it in column 0
        columnsMap[0].push(card);
      }
    });
    
    // Sort cards in each column by stack position
    Object.keys(columnsMap).forEach(columnKey => {
      const column = parseInt(columnKey);
      columnsMap[column].sort((a, b) => {
        const posA = a.stackPosition !== undefined ? a.stackPosition : 0;
        const posB = b.stackPosition !== undefined ? b.stackPosition : 0;
        return posA - posB;
      });
    });
    
    return columnsMap;
  };

  // Handle column title change
  const handleColumnTitleChange = (columnIndex: number, title: string) => {
    setColumnTitles(prev => ({
      ...prev,
      [columnIndex]: title
    }));
  };

  // Load deck if deck ID is provided in URL, otherwise start fresh
  useEffect(() => {
    // Clear search-related state regardless of whether we're editing or creating new
    setSearchQuery('');
    setSearchResults([]);
    setHasSearched(false);
    lastSearchRef.current = '';
    setShowSuggestions(false);
    setSuggestions([]);
    
    if (deckIdParam) {
      const existingDeck = getDeck(deckIdParam);
      
      if (existingDeck) {
        console.log(`Loading existing deck: ${existingDeck.name} (${deckIdParam})`);
        
        // Clear any existing localStorage to prevent interference
        localStorage.removeItem('deckbuilder_cards');
        localStorage.removeItem('deckbuilder_title');
        localStorage.removeItem('deckbuilder_column_titles');
        localStorage.removeItem('deckbuilder_search_results');
        localStorage.removeItem('deckbuilder_search_query');
        
        // Set deck data
        setDeckTitle(existingDeck.name);
        setDeckCards(existingDeck.cards);
        
        // Set column titles if they exist
        if (existingDeck.columnTitles && Object.keys(existingDeck.columnTitles).length > 0) {
          setColumnTitles(existingDeck.columnTitles);
        }
        
        // Mark as editing
        setIsEditingDeck(true);
        setEditingDeckId(deckIdParam);
      } else {
        console.error(`Deck with ID ${deckIdParam} not found`);
        // Maybe show an error or redirect
      }
    } else {
      // No deck ID provided, starting fresh (Create New Deck case)
      console.log('Creating a new deck - clearing any saved state');
      
      // Clear localStorage saved state for deck builder
      localStorage.removeItem('deckbuilder_cards');
      localStorage.removeItem('deckbuilder_title');
      localStorage.removeItem('deckbuilder_column_titles');
      localStorage.removeItem('deckbuilder_search_results');
      localStorage.removeItem('deckbuilder_search_query');
      
      // Reset state to defaults
      setDeckTitle('Untitled Deck');
      setDeckCards([]);
      setColumnTitles({
        0: "Creatures",
        1: "Spells",
        2: "Artifacts",
        3: "Enchantments",
        4: "Lands",
        5: "Sideboard"
      });
      
      // Ensure we're not in edit mode
      setIsEditingDeck(false);
      setEditingDeckId(null);
    }
  }, [deckIdParam, getDeck]);

  // Add localStorage persistence for deck state
  useEffect(() => {
    // When deck ID is provided, we're editing an existing deck - don't load from localStorage
    if (deckIdParam) {
      console.log("Skipping localStorage load since we're editing an existing deck");
      return;
    }
    
    // Only load saved state when NOT editing a specific deck
    // This only applies to in-progress decks that aren't saved yet
    
    // Load saved state when component mounts
    const loadSavedState = () => {
      try {
        // Load deck cards
        const savedDeckCards = localStorage.getItem('deckbuilder_cards');
        if (savedDeckCards) {
          setDeckCards(JSON.parse(savedDeckCards));
        }
        
        // Load deck title
        const savedDeckTitle = localStorage.getItem('deckbuilder_title');
        if (savedDeckTitle) {
          setDeckTitle(savedDeckTitle);
        }
        
        // Load column titles
        const savedColumnTitles = localStorage.getItem('deckbuilder_column_titles');
        if (savedColumnTitles) {
          setColumnTitles(JSON.parse(savedColumnTitles));
        }
        
        // We no longer load search results and query to avoid remembering previous searches
        
        console.log('Loaded saved deckbuilder state from localStorage');
      } catch (error) {
        console.error('Error loading saved deckbuilder state:', error);
      }
    };
    
    loadSavedState();
  }, [deckIdParam]);

  // Save deck cards whenever they change
  useEffect(() => {
    // Skip localStorage updates during save operations to prevent clearing search state
    if (isSaveOperation) {
      return;
    }

    if (deckCards.length > 0) {
      localStorage.setItem('deckbuilder_cards', JSON.stringify(deckCards));
    }
  }, [deckCards, isSaveOperation]);

  // Save deck title whenever it changes
  useEffect(() => {
    // Skip localStorage updates during save operations
    if (isSaveOperation) {
      return;
    }

    localStorage.setItem('deckbuilder_title', deckTitle);
  }, [deckTitle, isSaveOperation]);

  // Save column titles whenever they change
  useEffect(() => {
    // Skip localStorage updates during save operations
    if (isSaveOperation) {
      return;
    }

    localStorage.setItem('deckbuilder_column_titles', JSON.stringify(columnTitles));
  }, [columnTitles, isSaveOperation]);

  // Add a function to clear saved state
  const clearSavedState = () => {
    localStorage.removeItem('deckbuilder_cards');
    localStorage.removeItem('deckbuilder_title');
    localStorage.removeItem('deckbuilder_column_titles');
    localStorage.removeItem('deckbuilder_search_results');
    localStorage.removeItem('deckbuilder_search_query');
    
    // Reload the page to start fresh
    window.location.reload();
  };

  // Add handler for card selection
  const handleCardSelect = (cardId: string) => {
    console.log("Card selected:", cardId);
    // Toggle selection: if clicking the same card, deselect it
    if (selectedCardId === cardId) {
      setSelectedCardId(null);
    } else {
      setSelectedCardId(cardId);
    }
  };

  // Handle search results card click
  const handleSearchCardClick = (card: Card) => {
    const searchCardId = `search-${card.id}`;
    
    // Toggle selection for search cards too
    if (selectedCardId === searchCardId) {
      setSelectedCardId(null);
    } else {
      // Set as selected card
      setSelectedCardId(searchCardId);
      
      // Also add to deck (this behavior is preserved from the original)
      addCardToDeck(card);
    }
  };

  // Inside the DeckBuilder component, add state for preview and loading indicator
  const [previewCard, setPreviewCard] = useState<Card | null>(null);
  const [previewPosition, setPreviewPosition] = useState<{ x: number; y: number } | null>(null);
  const [showPreviewLoading, setShowPreviewLoading] = useState<boolean>(false);

  // Add a ref for the hover timer
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Add handlers for mouse enter and leave on deck cards with delay
  const handleCardMouseEnter = (card: Card, event: React.MouseEvent) => {
    // Ensure we have a valid event and target
    if (!event || !event.currentTarget) return;
    
    // Clear any existing timer
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    
    // Capture the current target element to avoid null reference later
    const targetElement = event.currentTarget;
    
    // Set a new timer for half a second delay
    hoverTimerRef.current = setTimeout(() => {
      // Get the column element to position preview
      const column = targetElement.closest('.deck-column');
      
      // If no column found, don't show preview
      if (!column) return;
      
      // Get the column index to determine if it's one of the rightmost columns
      const columnId = parseInt(column.getAttribute('data-column-id') || '0');
      const isRightmostColumn = columnId >= 3; // Columns 3, 4, 5 are the three rightmost
      
      // Find the column title container
      const titleContainer = column.querySelector('.column-title-container');
      
      if (titleContainer) {
        const titleRect = titleContainer.getBoundingClientRect();
        
        let previewPosX;
        
        if (isRightmostColumn) {
          // For the rightmost three columns, position to the LEFT of the title
          previewPosX = titleRect.left - 20 - 300; // 20px margin, 300px for card width estimate
        } else {
          // For other columns, position to the RIGHT of the title
          previewPosX = titleRect.right + 20; // 20px margin from title edge
        }
        
        // Vertical position at the same level as the title for alignment
        const previewPosY = titleRect.top;
        
        setPreviewCard(card);
        setPreviewPosition({ x: previewPosX, y: previewPosY });
      } else {
        // Fallback if title container not found
        const columnRect = column.getBoundingClientRect();
        setPreviewCard(card);
        setPreviewPosition({ 
          x: columnRect.right + 20,
          y: columnRect.top + 100
        });
      }
    }, 500); // 500ms = 0.5 second delay
  };

  const handleCardMouseLeave = () => {
    cancelCardPreview();
  };

  // Update the increment function to make it more direct
  const incrementCardCount = (cardId: string): void => {
    console.log("Incrementing card quantity:", cardId);
    
    setDeckCards(prevCards => {
      // Find the card
      const card = prevCards.find(c => c.id === cardId);
      if (!card) {
        console.log("Card not found in deck");
        return prevCards;
      }
      
      console.log("Current count:", card.count, "-> New count:", card.count + 1);
      
      // Create a new array with the updated card
      return prevCards.map(c => 
        c.id === cardId 
          ? { ...c, count: c.count + 1 } 
          : c
      );
    });
  };

  // Update the decrement function similarly
  const decrementCardCount = (cardId: string): void => {
    console.log("Decrementing card quantity:", cardId);
    
    setDeckCards(prevCards => {
      // Find the card
      const card = prevCards.find(c => c.id === cardId);
      if (!card) {
        console.log("Card not found in deck");
        return prevCards;
      }
      
      // If count is 1, remove the card
      if (card.count <= 1) {
        console.log("Removing card from deck (count was 1)");
        const column = card.column;
        const removedStackPosition = card.stackPosition;
        
        // Filter out the removed card and update positions
        return prevCards
          .filter(c => c.id !== cardId)
          .map(c => {
            if (c.column === column && c.stackPosition !== undefined && 
                removedStackPosition !== undefined && c.stackPosition > removedStackPosition) {
              return { ...c, stackPosition: c.stackPosition - 1 };
            }
            return c;
          });
      } 
      
      // Otherwise just decrement the count
      console.log("Current count:", card.count, "-> New count:", card.count - 1);
      
      return prevCards.map(c =>
        c.id === cardId
          ? { ...c, count: c.count - 1 }
          : c
      );
    });
  };

  // Function to handle saving a deck
  const handleSaveDeck = (name: string, description: string) => {
    setIsSaving(true);
    setIsSaveOperation(true); // Mark that we're in a save operation
    
    try {
      // Use provided name or fall back to the deck title if name is empty
      const finalName = name.trim() || deckTitle.trim() || 'Untitled Deck';
      
      // Create the deck object to save
      const deckData = {
        name: finalName,
        description,
        cards: deckCards as ContextDeckCard[],
        columnTitles
      };
      
      // Save current search state to restore it after update
      const currentSearchQuery = searchQuery;
      const currentSearchResults = searchResults;
      const currentHasSearched = hasSearched;
      
      if (isEditingDeck && editingDeckId) {
        // Update existing deck
        const existingDeck = getDeck(editingDeckId);
        
        if (existingDeck) {
          // Combine existing deck data with updates
          const updatedDeck: Deck = {
            ...existingDeck,
            ...deckData,
            id: editingDeckId,
            updatedAt: Date.now()
          };
          
          updateDeck(updatedDeck);
          alert('Deck updated successfully!');
        } else {
          console.error(`Could not find deck with ID ${editingDeckId} for updating`);
          
          // Fall back to creating a new deck
          addDeck(deckData);
          alert('Could not find the original deck. A new copy has been saved instead.');
        }
      } else {
        // Add new deck
        addDeck(deckData);
        alert('Deck saved successfully! You can view it in the Decks page.');
      }
      
      // Close the dialog
      setShowSaveDeckDialog(false);
      
      // For deck updates, restore search state to prevent clearing search results
      if (isEditingDeck && currentHasSearched && currentSearchResults.length > 0) {
        // Small delay to ensure state updates properly after the save operation
        setTimeout(() => {
          setSearchQuery(currentSearchQuery);
          setSearchResults(currentSearchResults);
          setHasSearched(currentHasSearched);
          lastSearchRef.current = currentSearchQuery;
          setIsSaveOperation(false); // End save operation after state is restored
        }, 10);
      } else {
        setIsSaveOperation(false); // End save operation immediately
      }
    } catch (error) {
      console.error('Error saving deck:', error);
      alert('There was an error saving your deck. Please try again.');
      setIsSaveOperation(false); // End save operation on error
    } finally {
      setIsSaving(false);
    }
  };

  const deckStats = getDeckStats();
  const columnedCards = groupCardsByColumn();

  // Render drag overlay content
  const renderDragOverlay = () => {
    if (!activeDragItem) return null;

    const card = activeDragItem.cardData;
    
    return (
      <div className="dnd-overlay" style={{ 
        width: '200px', 
        height: '280px',  // Maintain 5:7 ratio
        overflow: 'hidden'
      }}>
        {card.image_uris?.normal ? (
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

  // Add state for import deck dialog
  const [showImportDeckDialog, setShowImportDeckDialog] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Function to parse imported deck text
  const parseImportedDeck = async (deckText: string): Promise<Card[]> => {
    // Split by line and filter out empty lines
    const lines = deckText.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    const cardRequests: Promise<Card[]>[] = [];
    const parsedCards: { name: string; count: number }[] = [];
    
    // Parse each line to extract card name and quantity
    for (const line of lines) {
      // Skip comment lines and section headers
      if (line.startsWith('//') || line.startsWith('#')) continue;
      
      // Try to match "X CardName" pattern
      const quantityMatch = line.match(/^(\d+)\s+(.+)$/);
      
      if (quantityMatch) {
        // Quantity specified at beginning of line
        const count = parseInt(quantityMatch[1], 10);
        const cardName = quantityMatch[2].trim();
        parsedCards.push({ name: cardName, count });
      } else {
        // No quantity specified, assume 1
        parsedCards.push({ name: line, count: 1 });
      }
    }
    
    // Create a batch of search promises
    for (const { name } of parsedCards) {
      const searchPromise = ScryfallAPI.searchCards(`!"${name}"`)
        .then(response => response.data)
        .catch(() => [] as Card[]);
      
      cardRequests.push(searchPromise);
    }
    
    // Wait for all card searches to complete
    const cardResults = await Promise.all(cardRequests);
    
    // Combine the search results with quantities
    const importedCards: Card[] = [];
    
    for (let i = 0; i < parsedCards.length; i++) {
      const { name, count } = parsedCards[i];
      const cards = cardResults[i];
      
      if (cards.length > 0) {
        // Add the first card result with the specified count
        for (let j = 0; j < count; j++) {
          importedCards.push(cards[0]);
        }
      } else {
        console.warn(`Could not find card: ${name}`);
      }
    }
    
    return importedCards;
  };
  
  // Function to handle importing a deck
  const handleImportDeck = async (deckText: string) => {
    setIsImporting(true);
    
    try {
      const importedCards = await parseImportedDeck(deckText);
      
      if (importedCards.length === 0) {
        alert('No valid cards found in the imported text.');
        return;
      }
      
      // Group the imported cards by name to count duplicates
      const cardCountMap = new Map<string, { card: Card; count: number }>();
      
      importedCards.forEach(card => {
        const existing = cardCountMap.get(card.name);
        if (existing) {
          existing.count += 1;
        } else {
          cardCountMap.set(card.name, { card, count: 1 });
        }
      });
      
      // Convert to DeckCard format and add to deck
      const newDeckCards = Array.from(cardCountMap.values()).map(({ card, count }) => {
        // Try to infer column based on card type
        let column = 1; // Default to "Spells" column
        
        if (card.type_line) {
          const typeLine = card.type_line.toLowerCase();
          if (typeLine.includes('creature')) {
            column = 0; // "Creatures" column
          } else if (typeLine.includes('artifact')) {
            column = 2; // "Artifacts" column
          } else if (typeLine.includes('enchantment')) {
            column = 3; // "Enchantments" column
          } else if (typeLine.includes('land')) {
            column = 4; // "Lands" column
          }
        }
        
        // Add to deck
        return {
          ...card,
          count,
          column,
          stackPosition: 0
        } as DeckCard;
      });
      
      // Update card positions within columns
      const columnedCards = groupCardsByColumn();
      newDeckCards.forEach(card => {
        if (card.column !== undefined) {
          const cardsInColumn = columnedCards[card.column] || [];
          card.stackPosition = cardsInColumn.length;
        }
      });
      
      // Set the new deck cards
      setDeckCards(prevCards => [...prevCards, ...newDeckCards]);
      setShowImportDeckDialog(false);
      
      // Show success message
      alert(`Successfully imported ${importedCards.length} cards (${newDeckCards.length} unique cards).`);
    } catch (error) {
      console.error('Error importing deck:', error);
      alert('An error occurred while importing the deck. Please try again.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="deck-builder-container">
      <div className="search-container">
        <div className="search-input-wrapper">
          <input
            ref={searchInputRef}
            type="text"
            className="search-input"
            placeholder="Search for cards to add to your deck..."
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
      
      {/* DndContext wraps the entire area to handle dragging between components */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={(event) => {
          handleDragStart(event);
          cancelCardPreview(); // Cancel preview when dragging starts
        }}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
      {/* Search Results with Carousel Navigation */}
      <div className="search-results-carousel">
        {isLoading ? (
          <div className="loading-indicator">
            <FontAwesomeIcon icon={faSpinner} spin size="2x" />
            <p>Loading cards...</p>
          </div>
        ) : (
          <>
            {searchResults.length > 0 ? (
              <div className="carousel-container">
                {/* Left navigation button */}
                <button 
                  className={`carousel-nav-button carousel-prev ${currentPage === 0 ? 'disabled' : ''}`}
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 0}
                  aria-label="Previous cards"
                >
                  <FontAwesomeIcon icon={faChevronLeft} />
                </button>
                
                {/* Cards display */}
                <div className="carousel-cards">
                  {getCurrentPageCards().map(card => (
                    <DraggableSearchCard 
                      key={`search-${card.id}`}
                      card={card}
                      onClick={() => handleSearchCardClick(card)}
                      isSelected={selectedCardId === `search-${card.id}`}
                      onMouseEnter={handleCardMouseEnter}
                      onMouseLeave={handleCardMouseLeave}
                      onDragStart={cancelCardPreview}
                    />
                  ))}
                </div>
                
                {/* Right navigation button */}
                <button 
                  className={`carousel-nav-button carousel-next ${currentPage === totalPages - 1 ? 'disabled' : ''}`}
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages - 1}
                  aria-label="Next cards"
                >
                  <FontAwesomeIcon icon={faChevronRight} />
                </button>
              </div>
            ) : hasSearched && searchQuery ? (
              <div className="no-results">
                <p>No cards found matching "{searchQuery}"</p>
                <p className="no-results-suggestion">Try adjusting your search term or checking for spelling errors.</p>
              </div>
            ) : (
              <p className="search-prompt">Search for cards above to add them to your deck.</p>
            )}
          </>
        )}
      </div>
      
      {/* Deck Building Area */}
      <div 
        className="deck-building-area"
        ref={deckAreaRef}
      >
        <div className="deck-content">
          <div className="deck-header">
            <div className="deck-title">
              <input
                type="text"
                className="deck-title-input"
                value={deckTitle}
                onChange={(e) => setDeckTitle(e.target.value)}
                placeholder="Enter deck title..."
                aria-label="Deck title"
              />
            </div>
            <div className="deck-header-right">
              <div className="deck-count">
                <h3>Deck: {deckCards.length > 0 ? deckStats.totalCards : 0} cards</h3>
              </div>
              <div className="deck-actions">
                {/* Add Import Deck button */}
                <button 
                  className="import-deck-button"
                  onClick={() => setShowImportDeckDialog(true)}
                  title="Import deck from file"
                >
                  <FontAwesomeIcon icon={faFileImport} />
                  Import Deck
                </button>
                
                {deckCards.length > 0 && (
                  <button 
                    className="save-deck-button"
                    onClick={() => {
                      // Preserve search state when clicking save/update
                      const currentSearchState = {
                        query: searchQuery,
                        results: searchResults,
                        hasSearched: hasSearched,
                        lastSearch: lastSearchRef.current
                      };
                      
                      // Trigger save
                      handleSaveDeck(deckTitle, '');
                      
                      // We'll restore the search state in handleSaveDeck
                    }}
                    disabled={isSaving}
                  >
                    <FontAwesomeIcon icon={faSave} />
                    {isSaving ? 'Saving...' : isEditingDeck ? 'Update Deck' : 'Save Deck'}
                  </button>
                )}
                <button 
                  className="reset-state-button"
                  onClick={clearSavedState}
                  title="Reset saved state"
                >
                  <FontAwesomeIcon icon={faRedo} />
                </button>
              </div>
            </div>
          </div>
          
          <div className="deck-cards-container">
              {/* Render columns with droppable areas */}
              {Object.keys(columnedCards).map(columnIndex => {
                const column = parseInt(columnIndex);
                const cardsInColumn = columnedCards[column];
                
                return (
                  <DroppableColumn
                    key={`column-${column}`} 
                    columnId={column}
                    title={columnTitles[column] || `Category ${column + 1}`}
                    cards={cardsInColumn}
                    onTitleChange={(title) => handleColumnTitleChange(column, title)}
                    removeCardFromDeck={removeCardFromDeck}
                    selectedCardId={selectedCardId}
                    onCardClick={handleCardSelect}
                    onCardMouseEnter={handleCardMouseEnter}
                    onCardMouseLeave={handleCardMouseLeave}
                    onCardDragStart={cancelCardPreview}
                    onIncrementCard={incrementCardCount}
                    onDecrementCard={decrementCardCount}
                  />
                );
              })}
          </div>
        </div>
      </div>
        
        {/* Render drag overlay */}
        <DragOverlay>
          {activeDragItem && renderDragOverlay()}
        </DragOverlay>
      </DndContext>
      
      {/* Save Deck Dialog */}
      <SaveDeckDialog
        isOpen={showSaveDeckDialog}
        onClose={() => setShowSaveDeckDialog(false)}
        onSave={handleSaveDeck}
        defaultDeckName={deckTitle}
      />

      {/* Add the card preview */}
      <CardPreview card={previewCard} position={previewPosition} />

      {/* Import Deck Dialog */}
      <ImportDeckDialog
        isOpen={showImportDeckDialog}
        onClose={() => setShowImportDeckDialog(false)}
        onImport={handleImportDeck}
      />
    </div>
  );
};

// Add a new component for card preview
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
  
  // Check if preview is on the left side (for rightmost columns)
  // We can determine this by checking if the x position is relatively small
  const isLeftPositioned = position.x < window.innerWidth / 3;
  
  return (
    <div 
      className={`card-preview ${isLeftPositioned ? 'left-positioned' : ''}`}
      style={{ 
        left: position.x, 
        top: position.y,
      }}
    >
      <img 
        src={imageUrl} 
        alt={card.name} 
        className="card-preview-image" 
        onError={() => console.log("Failed to load preview image")}
      />
    </div>
  );
};

export default DeckBuilder; 