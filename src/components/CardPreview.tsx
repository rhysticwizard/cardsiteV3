import React from 'react';
import { Card } from '../utils/ScryfallAPI'; // Import the Card type from ScryfallAPI
import './CardPreview.css';

interface CardPreviewProps {
  card: Card | null;
  position: { x: number; y: number } | null;
}

const CardPreview: React.FC<CardPreviewProps> = ({ card, position }) => {
  // Make sure we have both a card and valid position
  if (!card || !position || 
      position.x === undefined || position.y === undefined || 
      isNaN(position.x) || isNaN(position.y)) {
    return null;
  }
  
  // Get the image URL from the card data
  const imageUrl = card.image_uris?.normal 
    ? card.image_uris.normal 
    : card.card_faces && card.card_faces[0]?.image_uris?.normal 
      ? card.card_faces[0].image_uris.normal 
      : '';
      
  if (!imageUrl) return null;
  
  // Check if preview should be positioned on the left side
  // Determine this by checking if the x position is in the right third of the screen
  const isLeftPositioned = position.x > (window.innerWidth * 2/3);
  
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

export default CardPreview; 