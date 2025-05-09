import React from 'react';
import { Card as CardType } from '../../utils/ScryfallAPI';
import { useNavigate } from 'react-router-dom';

interface CardProps {
  card: CardType;
}

const Card: React.FC<CardProps> = ({ card }) => {
  const navigate = useNavigate();

  // Get the correct image URL from either card.image_uris or card_faces[0].image_uris
  const getCardImageUrl = (card: CardType, size = 'normal'): string => {
    if (card.image_uris) {
      return card.image_uris[size as keyof typeof card.image_uris] || '';
    } else if (card.card_faces && card.card_faces[0] && card.card_faces[0].image_uris) {
      return card.card_faces[0].image_uris[size as keyof (typeof card.card_faces)[0]['image_uris']] || '';
    }
    return '';
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Save card info to localStorage for the card page
    localStorage.setItem('currentCard', JSON.stringify(card));
    localStorage.setItem('currentSetName', card.set_name || '');
    
    // Navigate to the card in all sets
    navigate(`/card/${card.id}?set=${card.set}`);
  };

  const imageUrl = getCardImageUrl(card);

  return (
    <div 
      className="card" 
      onClick={handleCardClick}
      title={`${card.name} (Click to view in All Sets)`}
    >
      <div className="card-image-container">
        <img
          className="card-image"
          src={imageUrl}
          alt={card.name}
          loading="lazy"
        />
      </div>
      <div className="card-info">
        <div className="card-name">{card.name}</div>
        <div className="card-type">{card.type_line}</div>
        <div className="card-rarity">{card.rarity}</div>
        <div className="card-set">{card.set_name}</div>
        {card.released_at && (
          <div className="card-date">
            Released: {new Date(card.released_at).toLocaleDateString()}
          </div>
        )}
      </div>
    </div>
  );
};

export default Card; 