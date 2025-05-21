import React, { useRef, useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faEdit, faPlus, faHeart, faCamera } from '@fortawesome/free-solid-svg-icons';
import './ProfilePage.css';
import { useProfile } from '../../context/ProfileContext';
import { useDeckContext } from '../../context/DeckContext';
import { useFavorites } from '../../context/FavoritesContext';

const ProfilePage: React.FC = () => {
  const { avatarSrc, setAvatarSrc, userName, userEmail } = useProfile();
  const { decks, deleteDeck } = useDeckContext();
  const { favorites, removeFavorite } = useFavorites();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerFileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [bannerSrc, setBannerSrc] = useState<string | null>(localStorage.getItem('userBanner'));

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAvatarSrc(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle banner click
  const handleBannerClick = () => {
    bannerFileInputRef.current?.click();
  };

  // Handle banner file change
  const handleBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newBannerSrc = event.target?.result as string;
        setBannerSrc(newBannerSrc);
        localStorage.setItem('userBanner', newBannerSrc);
      };
      reader.readAsDataURL(file);
    }
  };

  // Get a sample card image from the deck to display
  const getSampleCardImage = (deckId: string): string | null => {
    const deck = decks.find(d => d.id === deckId);
    if (!deck || deck.cards.length === 0) return null;

    // Find a card with an image, preferring non-land cards with high-quality art
    const nonLandCards = deck.cards.filter(
      card => card.type_line && !card.type_line.toLowerCase().includes('land') && card.image_uris?.art_crop
    );
    
    if (nonLandCards.length > 0) {
      // Use the first non-land card with an image instead of a random one
      return nonLandCards[0].image_uris?.art_crop || null;
    }
    
    // If no non-land cards with images, try to get any card with an image
    const cardsWithImages = deck.cards.filter(card => card.image_uris?.art_crop);
    if (cardsWithImages.length > 0) {
      // Use the first card with an image
      return cardsWithImages[0].image_uris?.art_crop || null;
    }
    
    return null;
  };

  // Cache the deck images to avoid re-computing them on every render
  const deckImages = useMemo(() => {
    const imageMap: Record<string, string | null> = {};
    
    decks.forEach(deck => {
      imageMap[deck.id] = getSampleCardImage(deck.id);
    });
    
    return imageMap;
  }, [decks]);

  // Handle delete deck with confirmation
  const handleDeleteDeck = (deckId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this deck?')) {
      deleteDeck(deckId);
    }
  };

  // Handle edit deck
  const handleEditDeck = (deckId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/deckbuilder?deck=${deckId}`);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <>
            {/* Account Information section moved to settings tab */}
          </>
        );
      case 'decks':
        return (
          <div className="openai-card">
            <div className="profile-deck-header">
              <h3>Your Decks</h3>
              <button className="openai-button-primary create-deck-button" onClick={() => navigate('/deckbuilder')}>
                <FontAwesomeIcon icon={faPlus} />
                Create New Deck
              </button>
            </div>
            
            {decks.length === 0 ? (
              <div className="openai-empty-state">
                <p>You haven't created any decks yet</p>
                <button className="openai-button-primary" onClick={() => navigate('/deckbuilder')}>Create Your First Deck</button>
              </div>
            ) : (
              <div className="profile-decks-grid">
                {decks.map(deck => (
                  <div 
                    key={deck.id} 
                    className="profile-deck-card"
                    onClick={() => navigate(`/deckbuilder?deck=${deck.id}`)}
                  >
                    <div className="deck-image-container">
                      {deckImages[deck.id] ? (
                        <div 
                          className="deck-image" 
                          style={{ backgroundImage: `url(${deckImages[deck.id]})` }}
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
                        <div className="deck-type">
                          {deck.cards.length} {deck.cards.length === 1 ? 'card' : 'cards'}
                        </div>
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
                ))}
              </div>
            )}
          </div>
        );
      case 'favorites':
        return (
          <div className="openai-card">
            <div className="profile-deck-header">
              <h3>Your Favorite Cards</h3>
              <span className="favorites-count">{favorites.length} {favorites.length === 1 ? 'card' : 'cards'}</span>
            </div>
            
            {!favorites || favorites.length === 0 ? (
              <div className="openai-empty-state">
                <p>You haven't favorited any cards yet</p>
                <button className="openai-button-primary" onClick={() => navigate('/sets')}>
                  <FontAwesomeIcon icon={faHeart} /> Find Cards to Favorite
                </button>
              </div>
            ) : (
              <div className="profile-favorites-grid">
                {favorites.map(card => {
                  // Get card image URL
                  const imageUrl = card.image_uris?.normal || 
                    (card.card_faces && card.card_faces[0]?.image_uris?.normal);
                  
                  return (
                    <div key={card.id} className="favorite-card-item">
                      <div className="favorite-card-content">
                        <Link to={`/card/${card.id}?set=${card.set}`}>
                          {imageUrl ? (
                            <img src={imageUrl} alt={card.name} className="favorite-card-image" />
                          ) : (
                            <div className="favorite-card-placeholder">
                              <span>{card.name}</span>
                            </div>
                          )}
                        </Link>
                        <button 
                          className="remove-favorite-btn"
                          onClick={() => {
                            console.log('Removing favorite from profile:', card.id);
                            removeFavorite(card.id);
                          }}
                          title="Remove from favorites"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                      <div className="favorite-card-name">{card.name}</div>
                      <div className="favorite-card-set">{card.set_name}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      case 'wishlist':
        return (
          <div className="openai-card">
            <h3>Your Wishlist</h3>
            <div className="openai-empty-state">
              <p>Cards you want to acquire will appear here</p>
              <button className="openai-button-primary">Add to Wishlist</button>
            </div>
          </div>
        );
      case 'friends':
        return (
          <div className="openai-card">
            <h3>Friends</h3>
            <div className="openai-empty-state">
              <p>Connect with other players</p>
              <button className="openai-button-primary">Find Friends</button>
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="openai-card">
            <h3>Settings</h3>
            <div className="openai-info-item">
              <span className="openai-label">Theme</span>
              <span className="openai-value">Dark</span>
            </div>
            <div className="openai-info-item">
              <span className="openai-label">Notifications</span>
              <span className="openai-value">Enabled</span>
            </div>

            <div className="settings-section-divider"></div>
            
            <h3>Account Information</h3>
            <div className="openai-info-item">
              <span className="openai-label">Username</span>
              <span className="openai-value">{userName.toLowerCase().replace(/\s+/g, '')}</span>
            </div>
            <div className="openai-info-item">
              <span className="openai-label">Email</span>
              <span className="openai-value">{userEmail}</span>
            </div>
            <div className="openai-info-item">
              <span className="openai-label">Password</span>
              <span className="openai-value">••••••••</span>
              <button className="openai-text-button">Change</button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="openai-profile-container">
      {/* Discord-style banner */}
      <div className="profile-banner-container">
        <div 
          className="profile-banner" 
          style={bannerSrc ? { backgroundImage: `url(${bannerSrc})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
        >
          <button className="banner-change-btn" onClick={handleBannerClick} title="Change banner image">
            <FontAwesomeIcon icon={faCamera} />
          </button>
          <input 
            type="file" 
            ref={bannerFileInputRef} 
            onChange={handleBannerFileChange} 
            accept="image/*" 
            style={{ display: 'none' }} 
          />
        </div>

        {/* Moved avatar here directly in the banner container */}
        <div className="profile-avatar-wrapper">
          <div className="openai-avatar" onClick={handleAvatarClick}>
            {avatarSrc ? (
              <img src={avatarSrc} alt="Profile" className="avatar-image" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
              </svg>
            )}
            <div className="avatar-overlay">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                <circle cx="12" cy="13" r="4"></circle>
              </svg>
            </div>
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            style={{ display: 'none' }} 
          />
        </div>
      </div>
      
      <div className="username-container">
        <h2>{userName}</h2>
      </div>

      <div className="profile-header-container">
        <div className="openai-card profile-main-card">
          <div className="openai-user-info">
            {/* Username removed from here and placed above */}
          </div>
        </div>
      </div>

      <div className="profile-tabs">
        <button 
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab-button ${activeTab === 'decks' ? 'active' : ''}`}
          onClick={() => setActiveTab('decks')}
        >
          Decks
        </button>
        <button 
          className={`tab-button ${activeTab === 'favorites' ? 'active' : ''}`}
          onClick={() => setActiveTab('favorites')}
        >
          Favorites
        </button>
        <button 
          className={`tab-button ${activeTab === 'wishlist' ? 'active' : ''}`}
          onClick={() => setActiveTab('wishlist')}
        >
          Wishlist
        </button>
        <button 
          className={`tab-button ${activeTab === 'friends' ? 'active' : ''}`}
          onClick={() => setActiveTab('friends')}
        >
          Friends
        </button>
        <button 
          className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          Settings
        </button>
      </div>

      <div className="tab-content">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default ProfilePage; 