import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, faTimes, faSpinner, faChevronLeft, faChevronRight, 
  faTrash, faSave, faRedo, faPlus, faMinus, faFileImport, faBug, faInfoCircle, faCaretDown, faCaretRight 
} from '@fortawesome/free-solid-svg-icons';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
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
import { v4 as uuidv4 } from 'uuid';

// Interface for deck cards with count
interface DeckCard extends Card {
  count: number;
  column?: number; // Add column tracking
  stackPosition?: number; // Add stack position tracking
  columnOption?: string; // Track column option (startsInDeck, startsInHand, etc.)
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
    top: `${index * 65 + 45}px`, // Increased offset from 30px to 45px
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

// New TreeItem component
interface TreeItemProps {
  label: string;
  level: number;
  // Future props: isExpanded, hasChildren, onToggleExpand, isSelected, onSelect
  // For now, keeping it simple
}

const TreeItem: React.FC<TreeItemProps> = ({ label, level }) => {
  const itemStyle: React.CSSProperties = {
    paddingLeft: `${level * 20}px`, // Indentation based on level
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    paddingTop: '5px',
    paddingBottom: '5px',
  };

  // Placeholder for expand icon (can be faCaretRight or faCaretDown later)
  // For now, just a simple bullet or space if level > 0
  const iconPlaceholder = level > 0 ? (
    <FontAwesomeIcon icon={faCaretRight} style={{ marginRight: '8px' }} />
  ) : null; // Root items might not have an icon or a different one

  return (
    <div style={itemStyle} className="tree-item">
      {iconPlaceholder}
      <span>{label}</span>
    </div>
  );
};

// Define the props for TreeItem if it's used across components or keep it local
interface TreeItemProps {
  label: string;
  level: number;
  onClick?: () => void;
}

// Update the DroppableColumn component props
interface DroppableColumnProps {
  columnId: number;
  cards: DeckCard[];
  removeCardFromDeck: (cardId: string) => void;
  selectedCardId: string | null;
  onCardClick: (cardId: string) => void;
  onCardMouseEnter: (card: Card, event: React.MouseEvent) => void;
  onCardMouseLeave: () => void;
  onCardDragStart: () => void;
  onIncrementCard: (cardId: string) => void;
  onDecrementCard: (cardId: string) => void;
  columnTitle: string;
  isEditing: boolean;
  onStartRename: () => void;
  onSaveTitle: (newTitle: string) => void;
}

// Define structure for menu items
interface MenuItem {
  id: string;
  label: string;
  level: number;
  children?: MenuItem[];
  isSelectable?: boolean;
  defaultSelected?: boolean; // For initial selection
}

// Update the DroppableColumn component
const DroppableColumn: React.FC<DroppableColumnProps> = ({
  columnId,
  cards, // This prop contains the cards for this specific column
  removeCardFromDeck,
  selectedCardId,
  onCardClick,
  onCardMouseEnter,
  onCardMouseLeave,
  onCardDragStart,
  onIncrementCard,
  onDecrementCard,
  columnTitle,
  isEditing,
  onStartRename,
  onSaveTitle
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${columnId}`,
    data: { type: 'column', columnId }
  });

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [editableTitle, setEditableTitle] = useState(columnTitle);
  const inputRef = useRef<HTMLInputElement>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Initialize selectedOption based on the cards prop
  const [selectedOption, setSelectedOption] = useState<string>(() => {
    if (cards && cards.length > 0 && cards[0].columnOption) {
      return cards[0].columnOption;
    }
    return 'startsInDeck'; // Default if no cards or no option set
  });

  // Effect to update selectedOption if cards prop changes and has a different option
  useEffect(() => {
    if (cards && cards.length > 0 && cards[0].columnOption) {
      if (cards[0].columnOption !== selectedOption) {
        setSelectedOption(cards[0].columnOption);
      }
    } else {
      // If no cards, or cards have no option, default to 'startsInDeck'
      // Only update if it's not already the default to prevent infinite loops
      if (selectedOption !== 'startsInDeck') {
        setSelectedOption('startsInDeck');
      }
    }
  }, [cards, selectedOption]); // Rerun when cards or selectedOption changes

  const menuStructure: MenuItem[] = [
    { id: 'rename', label: 'Rename', level: 0, isSelectable: false },
    {
      id: 'columnOptions', label: 'Column Options', level: 0, isSelectable: false,
      children: [
        { id: 'startsInDeck', label: 'Starts in Deck', level: 1, isSelectable: true, defaultSelected: true },
        { id: 'startsInExtra', label: 'Starts in Extra', level: 1, isSelectable: true },
        { id: 'startsInHand', label: 'Starts in Hand', level: 1, isSelectable: true },
        {
          id: 'startsInPlay', label: 'Starts in Play', level: 1, isSelectable: false, // Changed ID and Label
          children: [
            { id: 'playFaceup', label: 'Faceup', level: 2, isSelectable: true },
            { id: 'playFacedown', label: 'Facedown', level: 2, isSelectable: true },
          ]
        },
        { id: 'sideboard', label: 'Sideboard', level: 1, isSelectable: true },
      ]
    }
  ];

  useEffect(() => {
    if (isEditing) {
      setEditableTitle(columnTitle);
      setIsDropdownOpen(false);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isEditing, columnTitle]);

  const toggleDropdown = () => {
    if (!isEditing) {
      setIsDropdownOpen(!isDropdownOpen);
      if (isDropdownOpen) { // If closing, reset expanded items for next open
        setExpandedItems(new Set());
      }
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
        setExpandedItems(new Set());
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => setEditableTitle(event.target.value);
  const handleTitleSave = () => {
    if (editableTitle.trim() === "") setEditableTitle(columnTitle);
    else onSaveTitle(editableTitle.trim());
  };
  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') { handleTitleSave(); event.currentTarget.blur(); }
    else if (event.key === 'Escape') { setEditableTitle(columnTitle); onSaveTitle(columnTitle); event.currentTarget.blur(); }
  };

  // Enhanced TreeItem props and component
  interface EnhancedTreeItemProps {
    item: MenuItem;
    isExpanded: boolean;
    isSelected: boolean;
    onItemClick: (item: MenuItem) => void;
  }

  const EnhancedTreeItem: React.FC<EnhancedTreeItemProps> = ({ item, isExpanded, isSelected, onItemClick }) => (
    <div 
      style={{ paddingLeft: item.level * 20 + 'px' }} 
      onClick={() => onItemClick(item)} 
      className={`tree-item ${isSelected && item.isSelectable ? 'selected' : ''}`}
    >
      {item.children && (
        <FontAwesomeIcon icon={isExpanded ? faCaretDown : faCaretRight} className="caret-icon-tree" />
      )}
      <span style={{ marginLeft: item.children ? '5px' : '20px' }}>{item.label}</span>
      {isSelected && item.isSelectable && <span className="checkmark">✓</span>}
    </div>
  );
  
  const handleMenuItemClick = (item: MenuItem) => {
    if (item.id === 'rename') {
      onStartRename();
      setIsDropdownOpen(false);
      setExpandedItems(new Set());
      return;
    }

    if (item.children) {
      setExpandedItems(prev => {
        const next = new Set(prev);
        if (next.has(item.id)) next.delete(item.id);
        else next.add(item.id);
        return next;
      });
    } else if (item.isSelectable) {
      setSelectedOption(item.id);
      console.log(`${item.label} selected for column ${columnId + 1}`);
      
      // Update columnOption for all cards in this column
      cards.forEach(card => {
        card.columnOption = item.id;
      });
      
      // Potentially close dropdown or parent levels after selection
      // setIsDropdownOpen(false); 
      // setExpandedItems(new Set());
    }
  };

  const renderMenuItems = (items: MenuItem[]): React.JSX.Element[] => { // Explicitly using React.JSX.Element
    let elements: React.JSX.Element[] = []; // Explicitly using React.JSX.Element
    for (const item of items) {
      elements.push(
        <EnhancedTreeItem
          key={item.id}
          item={item}
          isExpanded={expandedItems.has(item.id)}
          isSelected={selectedOption === item.id}
          onItemClick={handleMenuItemClick}
        />
      );
      if (item.children && expandedItems.has(item.id)) {
        elements = elements.concat(renderMenuItems(item.children));
      }
    }
    return elements;
  };

  return (
    <div
      ref={setNodeRef}
      className={`deck-column ${cards.length === 0 ? 'empty-column' : ''}`}
      data-column-id={columnId}
      data-over={isOver ? 'true' : 'false'}
    >
      <div className="column-title-wrapper" ref={dropdownRef}>
        <div className="column-title-container">
          <button className="column-title-button" onClick={toggleDropdown} disabled={isEditing}>
            {isEditing ? (
              <input
                ref={inputRef}
                type="text"
                value={editableTitle}
                onChange={handleTitleChange}
                onBlur={handleTitleSave}
                onKeyDown={handleInputKeyDown}
                className="column-title-input"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span>{columnTitle}</span>
            )}
            {!isEditing && <FontAwesomeIcon icon={faCaretDown} className={`caret-icon ${isDropdownOpen ? 'open' : ''}`} />}
          </button>
          {isDropdownOpen && !isEditing && (
            <div className="column-dropdown-tree">
              {renderMenuItems(menuStructure)}
            </div>
          )}
        </div>
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
      <div 
        className="column-spacer" 
        style={{ 
          height: `${(cards.length > 0 ? 
            (cards.length - 1) * 65 + 170 + 45 // Increased offset from 30 to 45
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
  const { addDeck, getDeck, decks, updateDeck } = useDeckContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const { deckId: paramDeckId } = useParams<{ deckId?: string }>();
  const navigate = useNavigate();

  const initialQuery = searchParams.get('q') || '';
  const shouldShowSaveDialog = searchParams.get('save') === 'true'; // Re-added this line

  // Existing States
  const [searchResults, setSearchResults] = useState<Card[]>([]);
  const [deckCards, setDeckCards] = useState<DeckCard[]>([]);
  const [deckTitle, setDeckTitle] = useState<string>('Untitled Deck');
  const [currentDeckId, setCurrentDeckId] = useState<string | null>(paramDeckId || null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>(localStorage.getItem('deckbuilder_search_query') || initialQuery || '');
  const [activeDragItem, setActiveDragItem] = useState<any>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [showSaveDeckDialog, setShowSaveDeckDialog] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // States for column titles and editing (added previously)
  const initialColumnTitles = ['Creatures', 'Spells', 'Artifacts', 'Enchantments', 'Lands', 'Sideboard'];
  const [columnTitles, setColumnTitles] = useState<string[]>(() => {
    const savedTitles = localStorage.getItem('deckbuilder_column_titles');
    return savedTitles ? JSON.parse(savedTitles) : initialColumnTitles;
  });
  const [editingColumnId, setEditingColumnId] = useState<number | null>(null);

  // Re-adding missing state variables based on linter errors
  const [currentPage, setCurrentPage] = useState(0);
  const cardsPerPage = 5; // Assuming a default value, can be adjusted
  const totalPages = Math.ceil(searchResults.length / cardsPerPage);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const deckAreaRef = useRef<HTMLDivElement>(null); // Found this in the full file, seems to be used
  const lastSearchRef = useRef<string>(''); // Found this in the full file

  const [suggestions, setSuggestions] = useState<Card[]>([]); // From full file
  const [showSuggestions, setShowSuggestions] = useState(false); // From full file
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false); // From full file
  const [hasSearched, setHasSearched] = useState(!!searchQuery); // From full file, initialize based on searchQuery

  const [isEditingDeck, setIsEditingDeck] = useState<boolean>(false); // From full file
  const [editingDeckId, setEditingDeckId] = useState<string | null>(null); // From full file
  const [isSaveOperation, setIsSaveOperation] = useState(false); // From full file
  const [isSaving, setIsSaving] = useState(false); // From full file

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
  
  // Perform search when initialQuery is available (this useEffect should now work)
  useEffect(() => {
    if (initialQuery && !isLoading) { // Uses the defined initialQuery
      // To avoid an immediate search if searchQuery is already set from localStorage
      // and is different from initialQuery, we might want to set searchQuery state here first.
      // For now, let's assume if initialQuery exists, it dictates the first search.
      setSearchQuery(initialQuery); // Explicitly set searchQuery to trigger search via its own useEffect or handleSearch directly
      handleSearch(); // Pass initialQuery to handleSearch if it should take a query
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery, isLoading]); // Dependency array includes initialQuery
  
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
    
    // Calculate counts by card type
    let creatureCount = 0;
    let landCount = 0;
    let nonCreatureCount = 0;
    
    deckCards.forEach(card => {
      const typeLine = card.type_line?.toLowerCase() || '';
      const count = card.count || 1;
      
      if (typeLine.includes('land')) {
        landCount += count;
      } else if (typeLine.includes('creature')) {
        creatureCount += count;
      } else {
        nonCreatureCount += count;
      }
    });
    
    return { 
      totalCards,
      creatureCount,
      nonCreatureCount,
      landCount
    };
  };

  // Group cards by column for rendering
  const groupCardsByColumn = () => {
    const grouped: Record<number, DeckCard[]> = {};
    // Initialize for a fixed number of columns, e.g., 6
    for (let i = 0; i < 6; i++) { // Assuming 6 columns
      grouped[i] = [];
    }
    deckCards.forEach(card => {
      const col = card.column === undefined ? 0 : card.column; // Default to column 0 if undefined
      if (!grouped[col]) {
        grouped[col] = [];
      }
      grouped[col].push(card);
    });
    return grouped;
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

    if (paramDeckId) { // Corrected to use paramDeckId
      // Check if this ID exists in our saved decks
      const existingDeck = getDeck(paramDeckId); // Corrected to use paramDeckId

      if (existingDeck) {
        console.log(`Loading existing deck: ${existingDeck.name} (${paramDeckId})`); // Corrected

        // Clear any existing localStorage to prevent interference
        localStorage.removeItem('deckbuilder_cards');
        localStorage.removeItem('deckbuilder_title');
        localStorage.removeItem('deckbuilder_search_results');
        localStorage.removeItem('deckbuilder_search_query');
        localStorage.removeItem('deckbuilder_id');

        // Set deck data
        setDeckTitle(existingDeck.name);
        setDeckCards(existingDeck.cards);

        // Mark as editing
        setIsEditingDeck(true);
        setEditingDeckId(paramDeckId); // Corrected
        console.log(`Editing saved deck with ID: ${paramDeckId}`); // Corrected
      } else {
        console.log(`Using new deck ID: ${paramDeckId}`); // Corrected

        // Set up a new unsaved deck with the provided ID
        setDeckTitle('Untitled Deck');
        setDeckCards([]);
        console.log(`Created unsaved deck with ID: ${paramDeckId}`); // Corrected

        // Store the ID in localStorage immediately
        localStorage.setItem('deckbuilder_id', paramDeckId); // Corrected
      }
    } else {
      // No deck ID provided, but this should rarely happen with our new flow
      console.log('No deck ID provided - redirecting to create-deck');
      navigate('/create-deck');
    }
  }, [paramDeckId, getDeck, navigate]); // Corrected dependency to paramDeckId

  // Add localStorage persistence for deck state
  useEffect(() => {
    // When deck ID is provided, we're editing an existing deck - don't load from localStorage
    if (paramDeckId) { // Corrected
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

        // We no longer load search results and query to avoid remembering previous searches

        console.log('Loaded saved deckbuilder state from localStorage');
      } catch (error) {
        console.error('Error loading saved deckbuilder state:', error);
      }
    };

    loadSavedState();
  }, [paramDeckId]); // Corrected dependency

  // Save deck cards whenever they change
  useEffect(() => {
    // Skip localStorage updates during save operations to prevent clearing search state
    if (isSaveOperation) {
      return;
    }

    if (deckCards.length > 0) {
      localStorage.setItem('deckbuilder_cards', JSON.stringify(deckCards));
    }
    
    // Also save the current deck ID so we can retrieve unsaved deck data
    if (editingDeckId) {
      localStorage.setItem('deckbuilder_id', editingDeckId);
    }
  }, [deckCards, isSaveOperation, editingDeckId]);

  // Save deck title whenever it changes
  useEffect(() => {
    // Skip localStorage updates during save operations
    if (isSaveOperation) {
      return;
    }

    localStorage.setItem('deckbuilder_title', deckTitle);
  }, [deckTitle, isSaveOperation]);

  // Add a function to clear saved state
  const clearSavedState = () => {
    localStorage.removeItem('deckbuilder_cards');
    localStorage.removeItem('deckbuilder_title');
    localStorage.removeItem('deckbuilder_column_titles');
    localStorage.removeItem('deckbuilder_search_results');
    localStorage.removeItem('deckbuilder_search_query');
    localStorage.removeItem('deckbuilder_id');
    
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
    if (!event || !event.currentTarget) return;
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    const targetElement = event.currentTarget;
    hoverTimerRef.current = setTimeout(() => {
      const column = targetElement.closest('.deck-column');
      if (!column) return;
      const columnId = parseInt(column.getAttribute('data-column-id') || '0');
      const isRightmostColumn = columnId >= 3;
      const titleContainer = column.querySelector('.column-title-container');
      if (titleContainer) {
        const titleRect = titleContainer.getBoundingClientRect();
        let previewPosX;
        if (isRightmostColumn) {
          previewPosX = titleRect.left - 20 - 300;
        } else {
          previewPosX = titleRect.right + 20;
        }
        const previewPosY = titleRect.top;
        setPreviewCard(card);
        setPreviewPosition({ x: previewPosX, y: previewPosY }); // ENSURE THIS USES x AND y
      } else {
        const columnRect = column.getBoundingClientRect();
        setPreviewCard(card);
        setPreviewPosition({
          x: columnRect.right + 20, // ENSURE THIS USES x AND y
          y: columnRect.top + 100
        });
      }
    }, 500);
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
    // Check if we are editing an existing deck or creating a new one
    // const currentDeckId = editingDeckId || uuidv4(); // This line is part of the unused deckToSave
    
    // Create a new deck object // This object is not strictly necessary as deckData serves a similar purpose
    // const deckToSave: Deck = { // Removing deckToSave
    //   id: currentDeckId,
    //   name: name,
    //   description: description,
    //   cards: deckCards,
    // };

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
      };
      
      // Save current search state to restore it after update
      const currentSearchQuery = searchQuery;
      const currentSearchResults = searchResults;
      const currentHasSearched = hasSearched;
      
      let savedDeckId = '';
      
      if (isEditingDeck && editingDeckId) {
        // Update existing deck
        const existingDeck = getDeck(editingDeckId);
        
        if (existingDeck) {
          // Combine existing deck data with updates
          const updatedDeck: Deck = {
            ...existingDeck,
            ...deckData,
            id: editingDeckId,
            updatedAt: Date.now(),
          };
          
          updateDeck(updatedDeck);
          savedDeckId = editingDeckId;
          alert('Deck updated successfully!');
        } else {
          console.error(`Could not find deck with ID ${editingDeckId} for updating`);
          
          // If we have an ID but the deck doesn't exist yet, create a new one with the provided ID
          const newDeck = addDeck({
            ...deckData,
            ...(editingDeckId ? { id: editingDeckId } : {}),
            isPublic: false
          });
          savedDeckId = newDeck.id;
          alert('Deck saved successfully!');
        }
      } else {
        // New deck with ID we've been using
        const newDeck = addDeck({
          ...deckData,
          ...(editingDeckId ? { id: editingDeckId } : {}),
          isPublic: false
        });
        savedDeckId = newDeck.id;
        alert('Deck saved successfully! You can view it in the Decks page.');
      }
      
      // Close the dialog
      setShowSaveDeckDialog(false);
      
      // Mark that we're editing the saved deck now
      setIsEditingDeck(true);
      setEditingDeckId(savedDeckId);
      
      // For deck updates, restore search state to prevent clearing search results
      if (currentHasSearched && currentSearchResults.length > 0) {
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

  // Add state for deck details dialog
  const [showDeckDetailsDialog, setShowDeckDetailsDialog] = useState(false);

  // Show save dialog if save=true is present in the URL
  useEffect(() => {
    if (shouldShowSaveDialog && !isEditingDeck) {
      setShowSaveDeckDialog(true);
    }
  }, [shouldShowSaveDialog, isEditingDeck]);

  useEffect(() => {
    // Save column titles to localStorage
    localStorage.setItem('deckbuilder_column_titles', JSON.stringify(columnTitles));
  }, [columnTitles]);

  const handleStartRenameColumn = (columnId: number) => {
    setEditingColumnId(columnId);
  };

  const handleSaveColumnTitle = (columnId: number, newTitle: string) => {
    setColumnTitles(prevTitles => {
      const updatedTitles = [...prevTitles];
      updatedTitles[columnId] = newTitle;
      return updatedTitles;
    });
    setEditingColumnId(null); // Exit editing mode
    setHasUnsavedChanges(true);
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
                  <>
                    {/* Add Playtest button */}
                    <button 
                      className="playtest-deck-button"
                      onClick={() => {
                        if (isEditingDeck && editingDeckId) {
                          navigate(`/playmat/${editingDeckId}`);
                        } else {
                          // Save the deck first if it hasn't been saved
                          if (!isEditingDeck) {
                            setShowSaveDeckDialog(true);
                          }
                        }
                      }}
                      title="Playtest this deck"
                    >
                      <FontAwesomeIcon icon={faBug} />
                      Playtest
                    </button>

                    {/* Add Details button */}
                    <button 
                      className="details-deck-button"
                      onClick={() => {
                        if (editingDeckId) {
                          navigate(`/deck-details/${editingDeckId}`);
                        } else {
                          // If deck hasn't been saved yet, show dialog to save first
                          alert("Please save your deck first to view detailed information.");
                          setShowSaveDeckDialog(true);
                        }
                      }}
                      title="View deck details"
                    >
                      <FontAwesomeIcon icon={faInfoCircle} />
                      Details
                    </button>
                    
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
                  </>
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
                    cards={cardsInColumn}
                    // Pass title and editing props
                    columnTitle={columnTitles[column] || `Column ${column + 1}`}
                    isEditing={editingColumnId === column}
                    onStartRename={() => handleStartRenameColumn(column)}
                    onSaveTitle={(newTitle) => handleSaveColumnTitle(column, newTitle)}
                    // Other props
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

      {/* Deck Details Dialog */}
      <DeckDetailsDialog
        isOpen={showDeckDetailsDialog}
        onClose={() => setShowDeckDetailsDialog(false)}
        deckTitle={deckTitle}
        deckStats={getDeckStats()}
        deckCards={deckCards}
      />
    </div>
  );
};

// Add DeckDetailsDialog component
interface DeckDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  deckTitle: string;
  deckStats: {
    totalCards: number;
    creatureCount: number;
    nonCreatureCount: number;
    landCount: number;
  };
  deckCards: DeckCard[];
}

const DeckDetailsDialog: React.FC<DeckDetailsDialogProps> = ({ 
  isOpen, 
  onClose, 
  deckTitle,
  deckStats,
  deckCards
}) => {
  if (!isOpen) return null;

  // Function to count cards in each column
  const getColumnCounts = () => {
    const columnCounts: Record<number, number> = {};
    
    deckCards.forEach(card => {
      const column = card.column !== undefined ? card.column : 0;
      columnCounts[column] = (columnCounts[column] || 0) + card.count;
    });
    
    return columnCounts;
  };

  const columnCounts = getColumnCounts();

  return (
    <div className="save-deck-dialog-overlay">
      <div className="deck-details-dialog">
        <h2>Deck Details: {deckTitle}</h2>
        
        <div className="deck-details-stats">
          <div className="stats-section">
            <h3>Card Counts</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">Total Cards:</span>
                <span className="stat-value">{deckStats.totalCards}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Creatures:</span>
                <span className="stat-value">{deckStats.creatureCount}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Non-Creatures:</span>
                <span className="stat-value">{deckStats.nonCreatureCount}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Lands:</span>
                <span className="stat-value">{deckStats.landCount}</span>
              </div>
            </div>
          </div>
          
          <div className="stats-section">
            <h3>Column Distribution</h3>
            <div className="stats-grid">
              {Object.keys(columnCounts).map(columnKey => {
                const columnIndex = parseInt(columnKey);
                return (
                  <div className="stat-item" key={`column-${columnIndex}`}>
                    <span className="stat-label">{`Column ${columnIndex + 1}`}:</span>
                    <span className="stat-value">{columnCounts[columnIndex] || 0}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        <div className="dialog-buttons">
          <button type="button" className="close-button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
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