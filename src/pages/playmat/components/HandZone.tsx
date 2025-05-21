import React, { useState, useRef, useEffect } from 'react';
import type { HandCard } from '../index';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

interface HandZoneProps {
  cards: HandCard[];
  onCardPlay: (cardId: string) => void;
  onCardMouseEnter?: (card: HandCard, event: React.MouseEvent) => void;
  onCardMouseLeave?: () => void;
  onReturnToHand?: (cardId: string) => void;
}

// Create a draggable hand card component
const HandCardComponent: React.FC<{
  card: HandCard;
  index: number;
  position: {
    x: number;
    y: number;
    rotation: number;
    scale: number;
  };
  isHovered: boolean;
  zIndex: number;
  onClick: () => void;
  onMouseEnter: (e: React.MouseEvent) => void;
  onMouseLeave: () => void;
}> = ({ 
  card, 
  index, 
  position, 
  isHovered, 
  zIndex, 
  onClick, 
  onMouseEnter, 
  onMouseLeave 
}) => {
  // Set up draggable
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `hand-${card.id}`,
    data: {
      type: 'hand-card',
      card
    }
  });

  // Apply DND transforms and original transforms
  const baseTransform = `translate(-50%, 0) scale(${position.scale}) rotate(${position.rotation}deg)`;
  const style = {
    left: `${position.x}px`,
    top: `${position.y}px`,
    transform: CSS.Translate.toString(transform) ? 
      `${baseTransform} ${CSS.Translate.toString(transform)}` : 
      baseTransform,
    zIndex: isDragging ? 1000 : zIndex, // Ensure dragged card is on top
    position: 'absolute' as const,
    transition: isDragging ? 'none' : 'all 0.2s ease-out',
    opacity: isDragging ? 0 : 1, // Make completely invisible when dragging
    width: `${120 * position.scale}px`,
    height: `${168 * position.scale}px`,
    cursor: isDragging ? 'grabbing' : 'grab',
    visibility: isDragging ? 'hidden' as const : 'visible' as const // Hide the element completely
  };

  return (
    <div 
      ref={setNodeRef}
      className={`hand-card ${isHovered ? 'hovered' : ''}`}
      style={style}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      {...listeners}
      {...attributes}
    >
      {card.image_uris?.normal ? (
        <img 
          src={card.image_uris.normal} 
          alt={card.name} 
          className="hand-card-image"
          draggable={false} // Prevent image itself from being draggable
        />
      ) : card.card_faces && card.card_faces[0]?.image_uris?.normal ? (
        <img 
          src={card.card_faces[0].image_uris.normal} 
          alt={card.name}
          className="hand-card-image"
          draggable={false} // Prevent image itself from being draggable
        />
      ) : (
        <div className="card-placeholder">
          <p>{card.name}</p>
        </div>
      )}
    </div>
  );
};

const HandZone: React.FC<HandZoneProps> = ({ 
  cards, 
  onCardPlay, 
  onCardMouseEnter,
  onCardMouseLeave,
  onReturnToHand
}) => {
  // State to track the currently hovered card
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Setup the hand zone as a droppable area
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: 'hand-zone',
    data: {
      type: 'hand-zone'
    }
  });
  
  // Use refs for both dropping and container size measurements
  const setRefs = (element: HTMLDivElement | null) => {
    containerRef.current = element;
    setDroppableRef(element);
  };
  
  console.log("HandZone rendered with", cards.length, "cards");
  
  // Set up measurement of container size
  useEffect(() => {
    console.log("Container ref set:", containerRef.current ? "yes" : "no");
    if (containerRef.current) {
      console.log("Container dimensions:", 
                 containerRef.current.clientWidth, 
                 "x", 
                 containerRef.current.clientHeight);
    }
  }, [cards.length]);
  
  // Calculate positions of cards in the hand
  const calculateCardPositions = () => {
    const cardCount = cards.length;
    if (cardCount === 0) return [];
    
    console.log("Calculating positions for", cardCount, "cards");
    
    // Card dimensions - base values
    const baseCardWidth = 120;
    const baseCardHeight = 168; // 5:7 aspect ratio
    
    // Get container dimensions
    const containerWidth = containerRef.current?.clientWidth || window.innerWidth;
    const containerHeight = containerRef.current?.clientHeight || 280;
    
    console.log("Using container dimensions:", containerWidth, "x", containerHeight);
    
    // Calculate available width, accounting for margins
    const availableWidth = containerWidth - 80; // 40px margin on each side
    
    // Adaptive card sizing and spacing based on number of cards
    let cardWidth = baseCardWidth;
    let cardHeight = baseCardHeight;
    let overlappingFactor = 0.7; // How much cards overlap (lower = more overlap)
    
    // Determine if we need to scale down cards and increase overlap for larger hands
    const thresholds = [
      { count: 7, scale: 1.0, overlap: 0.7 },
      { count: 10, scale: 0.95, overlap: 0.6 },
      { count: 15, scale: 0.9, overlap: 0.5 },
      { count: 20, scale: 0.85, overlap: 0.4 },
      { count: 25, scale: 0.8, overlap: 0.35 },
      { count: 30, scale: 0.75, overlap: 0.3 },
      { count: 35, scale: 0.7, overlap: 0.25 },
      { count: 40, scale: 0.65, overlap: 0.2 }
    ];
    
    // Find the appropriate threshold
    const threshold = thresholds.find(t => cardCount <= t.count) || thresholds[thresholds.length - 1];
    
    // Apply scaling and overlap based on hand size
    cardWidth = baseCardWidth * threshold.scale;
    cardHeight = baseCardHeight * threshold.scale;
    overlappingFactor = threshold.overlap;
    
    console.log(`Using scale: ${threshold.scale}, overlap: ${threshold.overlap} for ${cardCount} cards`);
    
    // Calculate horizontal spacing between card centers
    // More cards = more overlap to fit within the available width
    const effectiveCardWidth = cardWidth * overlappingFactor;
    let baseSpacing = effectiveCardWidth;
    
    // Calculate minimum spacing needed to fit all cards within available width
    const minSpacingNeeded = availableWidth / (cardCount - 1);
    if (baseSpacing > minSpacingNeeded) {
      baseSpacing = minSpacingNeeded;
    }
    
    // Calculate total width needed
    const totalWidth = baseSpacing * (cardCount - 1);
    
    // Start x position to center the entire hand (center of first card)
    const startX = (containerWidth - totalWidth) / 2;
    
    console.log("Start X position:", startX, "Total width:", totalWidth, "Available width:", availableWidth);
    
    // Calculate positions for each card
    return cards.map((card, index) => {
      // Calculate horizontal position
      const x = startX + (index * baseSpacing);
      
      // Calculate vertical position with arc effect (cards in middle are higher)
      const middleIndex = (cardCount - 1) / 2;
      const distanceFromMiddle = Math.abs(index - middleIndex);
      
      // Adjust maximum lift based on card count
      const maxLift = Math.min(40 * threshold.scale, 40); // Scale lift with card size
      
      // Quadratic function for smoother arc: y = a * x^2
      const scaleFactor = maxLift / Math.pow(Math.max(middleIndex, 1), 2);
      const lift = maxLift - (scaleFactor * Math.pow(distanceFromMiddle, 2));
      
      // Final y position (bottom of container minus card height minus lift)
      const y = containerHeight - cardHeight - 20 - lift;
      
      // Calculate rotation for fan effect
      // Cards on left rotate counterclockwise, cards on right rotate clockwise
      // Scale rotation based on number of cards
      const maxRotation = Math.min(15, 15 * threshold.scale); // Less rotation with more cards
      const rotation = maxRotation * (index - middleIndex) / Math.max(middleIndex, 1);
      
      // Check if this card is currently hovered
      const isHovered = card.id === hoveredCardId;
      
      return {
        card,
        x,
        y,
        rotation,
        isHovered,
        scale: threshold.scale, // Pass the scale factor for rendering
        position: {
          x,
          y,
          rotation,
          scale: threshold.scale
        }
      };
    });
  };
  
  // Handle window resize to recalculate positions
  useEffect(() => {
    const handleResize = () => {
      // Force a re-render to recalculate positions
      setHoveredCardId(prev => prev);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const cardPositions = calculateCardPositions();
  
  // Calculate z-index based on card position
  // Cards in the middle should appear above cards at the edges
  const getZIndex = (index: number, isHovered: boolean) => {
    if (isHovered) return 100;
    
    // For cards that aren't hovered, cards closer to the middle have higher z-index
    const middleIndex = Math.floor(cards.length / 2);
    const distanceFromMiddle = Math.abs(index - middleIndex);
    return 50 - distanceFromMiddle;
  };
  
  // Handle mouse enter on a card with preview functionality
  const handleMouseEnter = (e: React.MouseEvent, card: HandCard) => {
    setHoveredCardId(card.id);
    
    // Call parent component's mouse enter handler if provided
    if (onCardMouseEnter) {
      // Use the current target element for accurate positioning
      onCardMouseEnter(card, e as React.MouseEvent<HTMLDivElement>);
    }
  };
  
  // Handle mouse leave on a card with preview functionality
  const handleMouseLeave = () => {
    setHoveredCardId(null);
    
    // Call parent component's mouse leave handler if provided
    if (onCardMouseLeave) {
      onCardMouseLeave();
    }
  };
  
  return (
    <div 
      ref={setRefs} 
      className={`hand-zone ${isOver ? 'hand-zone-drop-active' : ''}`}
    >
      {cards.length === 0 && (
        <div className="hand-empty-message">Your hand is empty. Click the deck to draw a card.</div>
      )}
      {cardPositions.map(({ card, position, isHovered }, index) => (
        <HandCardComponent
          key={card.id}
          card={card}
          index={index}
          position={position}
          isHovered={isHovered}
          zIndex={getZIndex(index, isHovered)}
          onClick={() => onCardPlay(card.id)}
          onMouseEnter={(e) => handleMouseEnter(e, card)}
          onMouseLeave={handleMouseLeave}
        />
      ))}
    </div>
  );
};

export default HandZone; 