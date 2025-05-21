import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight, faLock, faSave } from '@fortawesome/free-solid-svg-icons';
import { useDeckContext, Deck, DeckCard } from '../../context/DeckContext';
import './DeckDetails.css';

// Color identity icons - simple letter-based icons instead of SVGs
const WhiteIcon = () => (
  <div className="color-icon white-icon">
    <div className="mana-letter">W</div>
  </div>
);

const BlueIcon = () => (
  <div className="color-icon blue-icon">
    <div className="mana-letter">U</div>
  </div>
);

const BlackIcon = () => (
  <div className="color-icon black-icon">
    <div className="mana-letter">B</div>
  </div>
);

const RedIcon = () => (
  <div className="color-icon red-icon">
    <div className="mana-letter">R</div>
  </div>
);

const GreenIcon = () => (
  <div className="color-icon green-icon">
    <div className="mana-letter">G</div>
  </div>
);

const MultiIcon = () => (
  <div className="color-icon multi-icon">
    <div className="mana-letter">M</div>
  </div>
);

const ColorlessIcon = () => (
  <div className="color-icon colorless-icon">
    <div className="mana-letter">C</div>
  </div>
);

const LandIcon = () => (
  <div className="color-icon land-icon">
    <div className="mana-letter">L</div>
  </div>
);

const DeckDetails: React.FC = () => {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();
  const { getDeck, getUnsavedDeck, updateDeck } = useDeckContext();
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [deck, setDeck] = useState<Deck | null>(null);
  const [isUnsaved, setIsUnsaved] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [titleValue, setTitleValue] = useState('');
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (deckId) {
      console.log(`DeckDetails: Looking for deck with ID: ${deckId}`);
      
      // Try to get the deck from saved decks first
      const savedDeck = getDeck(deckId);
      
      if (savedDeck) {
        console.log(`DeckDetails: Found saved deck: ${savedDeck.name}`);
        setDeck(savedDeck);
        setTitleValue(savedDeck.name);
        setIsPublic(savedDeck.isPublic);
        setIsUnsaved(false);
        setLoading(false);
      } else {
        console.log(`DeckDetails: No saved deck found, trying to get unsaved deck`);
        
        // Try to get it from unsaved decks
        const unsavedDeck = getUnsavedDeck(deckId);
        if (unsavedDeck) {
          console.log(`DeckDetails: Found unsaved deck: ${unsavedDeck.name} with ${unsavedDeck.cards.length} cards`);
          setDeck(unsavedDeck);
          setTitleValue(unsavedDeck.name);
          setIsPublic(unsavedDeck.isPublic);
          setIsUnsaved(true);
          setLoading(false);
        } else {
          console.log(`DeckDetails: No deck found with ID: ${deckId}`);
          setNotFound(true);
          setLoading(false);
        }
      }
    }
  }, [deckId, getDeck, getUnsavedDeck]);

  // Focus the title input when component mounts
  useEffect(() => {
    if (titleInputRef.current && !loading && !notFound) {
      titleInputRef.current.focus();
    }
  }, [loading, notFound]);

  const handleSaveClick = () => {
    if (deckId) {
      navigate(`/deckbuilder/${deckId}?save=true`);
    }
  };

  const saveTitleChanges = () => {
    if (!deck || !deckId) return;
    
    const newTitle = titleValue.trim() || 'Untitled Deck';
    
    if (isUnsaved) {
      // For unsaved decks, update localStorage
      localStorage.setItem('deckbuilder_title', newTitle);
      
      // Update local state
      setDeck({
        ...deck,
        name: newTitle
      });
    } else {
      // For saved decks, update through context
      const updatedDeck = {
        ...deck,
        name: newTitle,
        updatedAt: Date.now()
      };
      
      updateDeck(updatedDeck);
      setDeck(updatedDeck);
    }
  };

  // Toggle the public/private status
  const togglePublicStatus = () => {
    if (!deck || !deckId) return;
    
    // Toggle isPublic state (true means public, false means private)
    const newPublicStatus = !isPublic;
    setIsPublic(newPublicStatus);
    
    if (isUnsaved) {
      // For unsaved decks, we'll save this preference in the deck when it's saved
      // Just update the local state for now
      setDeck({
        ...deck,
        isPublic: newPublicStatus
      });
    } else {
      // For saved decks, update through context
      const updatedDeck = {
        ...deck,
        isPublic: newPublicStatus,
        updatedAt: Date.now()
      };
      
      updateDeck(updatedDeck);
      setDeck(updatedDeck);
    }
  };

  // Handle Enter key in title input (save on Enter)
  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur(); // Remove focus, which will trigger onBlur and save
    }
  };

  // Calculate deck stats
  const getDeckStats = () => {
    if (!deck) return { totalCards: 0, creatureCount: 0, nonCreatureCount: 0, landCount: 0 };
    
    const totalCards = deck.cards.reduce((total, card) => total + card.count, 0);
    
    // Calculate counts by card type
    let creatureCount = 0;
    let landCount = 0;
    let nonCreatureCount = 0;
    
    deck.cards.forEach(card => {
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

  // Calculate color distribution
  const getColorDistribution = () => {
    if (!deck) return {
      white: 0,
      blue: 0,
      black: 0,
      red: 0,
      green: 0,
      multi: 0,
      colorless: 0,
      lands: 0,
      whitePercent: 0,
      bluePercent: 0,
      blackPercent: 0,
      redPercent: 0,
      greenPercent: 0
    };

    let white = 0;
    let blue = 0;
    let black = 0;
    let red = 0;
    let green = 0;
    let multi = 0;
    let colorless = 0;
    let lands = 0;

    console.log('Analyzing color distribution for deck:', deck.name);
    console.log('Total cards in deck:', deck.cards.length);

    // Count cards by color identity
    deck.cards.forEach(card => {
      const typeLine = card.type_line?.toLowerCase() || '';
      const count = card.count || 1;
      const cardName = card.name || 'Unknown Card';
      
      console.log(`Processing card: ${cardName}, Type: ${typeLine}, Count: ${count}`);
      
      // Check if it's a land first
      if (typeLine.includes('land')) {
        console.log(`${cardName} is a land`);
        lands += count;
        return;
      }
      
      // Try different methods to determine color
      // 1. Check color_identity (most reliable for Commander)
      const colorIdentity = card.color_identity || [];
      // 2. Check colors (current card colors)
      const colors = card.colors || [];
      // 3. Check mana_cost for color indicators
      const manaCost = card.mana_cost || '';
      
      console.log(`${cardName} - Color Identity: ${JSON.stringify(colorIdentity)}, Colors: ${JSON.stringify(colors)}, Mana Cost: ${manaCost}`);
      
      // Create a unified color set from all available color information
      const allColors = new Set<string>();
      
      // Add colors from color_identity
      colorIdentity.forEach((c: string) => allColors.add(c));
      
      // Add colors from colors array
      colors.forEach((c: string) => allColors.add(c));
      
      // Extract colors from mana cost if available (look for color symbols)
      if (manaCost) {
        if (manaCost.includes('W')) allColors.add('W');
        if (manaCost.includes('U')) allColors.add('U');
        if (manaCost.includes('B')) allColors.add('B');
        if (manaCost.includes('R')) allColors.add('R');
        if (manaCost.includes('G')) allColors.add('G');
      }
      
      // Check card name for color words as a fallback
      const cardNameLower = cardName.toLowerCase();
      if (cardNameLower.includes('white')) allColors.add('W');
      if (cardNameLower.includes('blue')) allColors.add('U');
      if (cardNameLower.includes('black')) allColors.add('B');
      if (cardNameLower.includes('red')) allColors.add('R');
      if (cardNameLower.includes('green')) allColors.add('G');
      
      // Convert Set to Array
      const detectedColors = Array.from(allColors);
      console.log(`${cardName} - Final detected colors: ${JSON.stringify(detectedColors)}`);
      
      // Check if multicolored (more than one color)
      if (detectedColors.length > 1) {
        console.log(`${cardName} is multicolored`);
        multi += count;
      } 
      // Check for single color
      else if (detectedColors.length === 1) {
        const color = detectedColors[0];
        console.log(`${cardName} is ${color}`);
        switch (color) {
          case 'W': white += count; break;
          case 'U': blue += count; break;
          case 'B': black += count; break;
          case 'R': red += count; break;
          case 'G': green += count; break;
          default: colorless += count; break;
        }
      } 
      // Must be colorless (no colors)
      else {
        console.log(`${cardName} is colorless`);
        colorless += count;
      }
    });

    console.log('Color Distribution Summary:');
    console.log(`White: ${white}, Blue: ${blue}, Black: ${black}, Red: ${red}, Green: ${green}`);
    console.log(`Multi: ${multi}, Colorless: ${colorless}, Lands: ${lands}`);

    // Calculate non-land cards for percentages
    const nonLandCards = white + blue + black + red + green + multi + colorless;
    
    // Calculate percentages for each color (excluding lands)
    const whitePercent = nonLandCards > 0 ? Math.round((white / nonLandCards) * 100) : 0;
    const bluePercent = nonLandCards > 0 ? Math.round((blue / nonLandCards) * 100) : 0;
    const blackPercent = nonLandCards > 0 ? Math.round((black / nonLandCards) * 100) : 0;
    const redPercent = nonLandCards > 0 ? Math.round((red / nonLandCards) * 100) : 0;
    const greenPercent = nonLandCards > 0 ? Math.round((green / nonLandCards) * 100) : 0;

    return {
      white,
      blue,
      black,
      red,
      green,
      multi,
      colorless,
      lands,
      whitePercent,
      bluePercent,
      blackPercent,
      redPercent,
      greenPercent
    };
  };

  const stats = getDeckStats();
  const colorStats = getColorDistribution();

  if (loading) {
    return (
      <div className="deck-details-page">
        <div className="loading-container">
          <p>Loading deck details...</p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="deck-details-page">
        <div className="breadcrumb-navigation">
          <Link to="/" className="breadcrumb-link">Decks</Link>
          <FontAwesomeIcon icon={faChevronRight} className="breadcrumb-separator" />
          <span className="breadcrumb-current">Not Found</span>
        </div>
        <div className="not-found-container">
          <h2>Deck Not Found</h2>
          <p>Sorry, the deck you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="deck-details-page">
      <div className="breadcrumb-navigation">
        <Link to="/" className="breadcrumb-link">Decks</Link>
        <FontAwesomeIcon icon={faChevronRight} className="breadcrumb-separator" />
        <Link to={`/deckbuilder/${deckId}`} className="breadcrumb-link">Deck Builder</Link>
        <FontAwesomeIcon icon={faChevronRight} className="breadcrumb-separator" />
        <span className="breadcrumb-current">Details</span>
      </div>

      <div className="deck-details-header">
        <div className="header-left">
          {isUnsaved && (
            <div className="unsaved-badge">
              Unsaved Deck
            </div>
          )}
        </div>
        <div className="deck-actions">
          {isUnsaved && (
            <button className="save-button" onClick={handleSaveClick}>
              <FontAwesomeIcon icon={faSave} /> Save Deck
            </button>
          )}
        </div>
      </div>
      
      <div className="deck-details-content">
        <div className="deck-title-container">
          <input
            ref={titleInputRef}
            type="text"
            className="title-input"
            value={titleValue}
            onChange={(e) => setTitleValue(e.target.value)}
            onKeyDown={handleTitleKeyDown}
            onBlur={saveTitleChanges}
            maxLength={50}
            placeholder="Enter deck title"
          />
        </div>
        
        {deck?.description && (
          <div className="deck-description">
            <p>{deck.description}</p>
          </div>
        )}
        
        <div className="privacy-toggle">
          <div className="privacy-label">
            <FontAwesomeIcon icon={faLock} className="privacy-icon" />
            <span>Private</span>
          </div>
          <div className="toggle-switch" onClick={togglePublicStatus}>
            <div className={`toggle-switch-slider ${!isPublic ? 'active' : ''}`}>
              <div className="toggle-switch-knob"></div>
            </div>
          </div>
        </div>
        
        <div className="color-distribution">
          <h2>Color Distribution</h2>
          <div className="color-stats">
            <div className="color-stat">
              <WhiteIcon />
              <div className="color-stat-values">
                <div className="color-count">{colorStats.white}</div>
                <div className="color-percent">{colorStats.whitePercent}%</div>
              </div>
            </div>
            <div className="color-stat">
              <BlueIcon />
              <div className="color-stat-values">
                <div className="color-count">{colorStats.blue}</div>
                <div className="color-percent">{colorStats.bluePercent}%</div>
              </div>
            </div>
            <div className="color-stat">
              <BlackIcon />
              <div className="color-stat-values">
                <div className="color-count">{colorStats.black}</div>
                <div className="color-percent">{colorStats.blackPercent}%</div>
              </div>
            </div>
            <div className="color-stat">
              <RedIcon />
              <div className="color-stat-values">
                <div className="color-count">{colorStats.red}</div>
                <div className="color-percent">{colorStats.redPercent}%</div>
              </div>
            </div>
            <div className="color-stat">
              <GreenIcon />
              <div className="color-stat-values">
                <div className="color-count">{colorStats.green}</div>
                <div className="color-percent">{colorStats.greenPercent}%</div>
              </div>
            </div>
            <div className="color-stat">
              <MultiIcon />
              <div className="color-stat-values">
                <div className="color-count">{colorStats.multi}</div>
                <div className="color-percent"></div>
              </div>
            </div>
            <div className="color-stat">
              <ColorlessIcon />
              <div className="color-stat-values">
                <div className="color-count">{colorStats.colorless}</div>
                <div className="color-percent"></div>
              </div>
            </div>
            <div className="color-stat">
              <LandIcon />
              <div className="color-stat-values">
                <div className="color-count">{colorStats.lands}</div>
                <div className="color-percent"></div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="deck-stats-container">
          <div className="stats-section">
            <h2>Deck Statistics</h2>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">Total Cards:</span>
                <span className="stat-value">{stats.totalCards}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Creatures:</span>
                <span className="stat-value">{stats.creatureCount}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Non-Creatures:</span>
                <span className="stat-value">{stats.nonCreatureCount}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Lands:</span>
                <span className="stat-value">{stats.landCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeckDetails; 