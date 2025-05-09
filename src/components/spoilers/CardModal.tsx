import React, { useState, useEffect, useCallback, ReactElement } from 'react';
import { Card as CardType } from '../../utils/ScryfallAPI';
import ScryfallAPI from '../../utils/ScryfallAPI';
import { Link } from 'react-router-dom';

interface CardModalProps {
  isOpen: boolean;
  card: CardType | null;
  onClose: () => void;
}

const CardModal: React.FC<CardModalProps> = ({ isOpen, card, onClose }) => {
  const [printings, setPrintings] = useState<CardType[]>([]);
  const [loadingPrintings, setLoadingPrintings] = useState<boolean>(false);
  const [showPrintings, setShowPrintings] = useState<boolean>(false);
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null);

  useEffect(() => {
    if (card) {
      setSelectedCard(card);
    }
  }, [card]);

  useEffect(() => {
    // Reset printings state when modal closes
    if (!isOpen) {
      setPrintings([]);
      setShowPrintings(false);
    }
  }, [isOpen]);
  
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);
  
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    } else {
      document.removeEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);
  
  const getCardImageUrl = (card: CardType, size = 'normal'): string => {
    if (card.image_uris) {
      return card.image_uris[size as keyof typeof card.image_uris] || '';
    } else if (card.card_faces && card.card_faces[0] && card.card_faces[0].image_uris) {
      return card.card_faces[0].image_uris[size as keyof (typeof card.card_faces)[0]['image_uris']] || '';
    }
    return '';
  };
  
  const getCardTextHtml = (card: CardType): ReactElement => {
    if (!card.oracle_text) return <></>;
    
    // Replace mana symbols and other formatting
    const formattedText = card.oracle_text
      .split('\n')
      .map((paragraph, index) => <p key={index}>{paragraph}</p>);
    
    return <>{formattedText}</>;
  };
  
  const getCardStatsHtml = (card: CardType): ReactElement => {
    if (!card.power && !card.toughness) return <></>;
    
    return <div><strong>P/T:</strong> {card.power}/{card.toughness}</div>;
  };
  
  const getCardLegalityHtml = (card: CardType): ReactElement => {
    if (!card.legalities) return <></>;
    
    const formats = ['standard', 'pioneer', 'modern', 'legacy', 'commander'];
    const legalityElements = formats.map(format => {
      const isLegal = card.legalities?.[format] === 'legal';
      return (
        <div key={format} className={isLegal ? 'legal' : 'not-legal'}>
          {format.charAt(0).toUpperCase() + format.slice(1)}: {isLegal ? 'Legal' : 'Not Legal'}
        </div>
      );
    });
    
    return <>{legalityElements}</>;
  };
  
  const loadOtherPrintings = async () => {
    if (!card) return;
    
    setLoadingPrintings(true);
    
    try {
      // Search for other printings of this card
      const query = `!"${card.name}" unique:prints`;
      const data = await ScryfallAPI.searchCards(query);
      
      if (data?.data) {
        setPrintings(data.data);
      }
    } catch (error) {
      console.error('Error loading printings:', error);
    } finally {
      setLoadingPrintings(false);
    }
  };
  
  const togglePrintings = async () => {
    if (showPrintings) {
      setShowPrintings(false);
    } else {
      if (printings.length === 0) {
        await loadOtherPrintings();
      }
      setShowPrintings(true);
    }
  };
  
  const switchToPrinting = (printing: CardType) => {
    setSelectedCard(printing);
  };
  
  if (!isOpen || !selectedCard) return null;
  
  const imageUrl = getCardImageUrl(selectedCard);
  
  return (
    <div className={`modal ${isOpen ? 'show' : ''}`} onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <span className="close-modal" onClick={onClose}>&times;</span>
        <div className="modal-body">
          <div className="modal-card-image">
            {imageUrl && <img src={imageUrl} alt={selectedCard.name} />}
          </div>
          <div className="modal-card-details">
            <h2 className="modal-card-name">{selectedCard.name}</h2>
            <div className="modal-card-type">{selectedCard.type_line}</div>
            <div className="modal-card-text">{getCardTextHtml(selectedCard)}</div>
            <div className="modal-card-stats">{getCardStatsHtml(selectedCard)}</div>
            <div className="modal-card-set">
              <strong>Set:</strong> {selectedCard.set_name} ({selectedCard.set?.toUpperCase()})
            </div>
            <div className="modal-card-legality">{getCardLegalityHtml(selectedCard)}</div>
            
            <button 
              className="modal-printings-button" 
              onClick={togglePrintings}
              disabled={loadingPrintings}
            >
              {loadingPrintings ? 'Loading Printings...' : showPrintings ? 'Hide Printings' : 'Load Other Printings'}
            </button>
            
            <div className="modal-printings-container" style={{ display: showPrintings ? 'block' : 'none' }}>
              {printings.length > 0 && (
                <>
                  <h3>Other Printings</h3>
                  <div className="printings-grid">
                    {printings.map(printing => (
                      <div 
                        key={printing.id} 
                        className="printing-card"
                        onClick={() => switchToPrinting(printing)}
                      >
                        <img src={getCardImageUrl(printing, 'small')} alt={printing.name} />
                        <div className="printing-info">
                          <div className="printing-set">
                            {printing.set_name} ({printing.set?.toUpperCase()})
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
            
            <Link 
              to={`/card/${selectedCard.id}?set=${selectedCard.set}`}
              className="view-in-sets-link"
              onClick={() => {
                // Save card info to localStorage for the card page
                localStorage.setItem('currentCard', JSON.stringify(selectedCard));
                localStorage.setItem('currentSetName', selectedCard.set_name || '');
                onClose();
              }}
            >
              View in All Sets
            </Link>
            
            <a 
              href={selectedCard.scryfall_uri} 
              className="modal-scryfall-link" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              View on Scryfall
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardModal; 