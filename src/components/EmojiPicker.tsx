import React, { useState, useRef, useEffect, FC } from 'react';
import './EmojiPicker.css';

// Emoji categories
const categories = [
  { id: 'recent', icon: '🕒', name: 'Recently Used' },
  { id: 'people', icon: '😊', name: 'People' },
  { id: 'nature', icon: '🦊', name: 'Nature' },
  { id: 'food', icon: '🍔', name: 'Food & Drink' },
  { id: 'activity', icon: '⚽', name: 'Activities' },
  { id: 'travel', icon: '✈️', name: 'Travel & Places' },
  { id: 'objects', icon: '💡', name: 'Objects' },
  { id: 'symbols', icon: '💯', name: 'Symbols' },
  { id: 'flags', icon: '🏁', name: 'Flags' }
];

// Sticker images from the public folder
const stickers = [
  '/sticker/emojis1.png',
  '/sticker/emojis2.png',
  '/sticker/emojis3.png',
  '/sticker/emojis4.png',
  '/sticker/emojis5.png',
  '/sticker/emojis6.png'
];

// Sample emoji data
const emojis = {
  people: [
    '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', 
    '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
    '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
    '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖',
    '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯',
    '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔'
  ],
  nature: [
    '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', 
    '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆'
  ],
  food: [
    '🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', 
    '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦'
  ],
  activity: [
    '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', 
    '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '⛳', '🪁', '🥅'
  ],
  travel: [
    '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', 
    '🚚', '🚛', '🚜', '🛴', '🚲', '🛵', '🏍️', '🚨', '🚔', '🚍'
  ],
  objects: [
    '⌚', '📱', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '🕹️', '🗜️', 
    '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📽️', '🎞️'
  ],
  symbols: [
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', 
    '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️'
  ],
  flags: [
    '🏁', '🚩', '🎌', '🏴', '🏳️', '🏳️‍🌈', '🏴‍☠️', '🇦🇨', '🇦🇩', '🇦🇪', 
    '🇦🇫', '🇦🇬', '🇦🇮', '🇦🇱', '🇦🇲', '🇦🇴', '🇦🇶', '🇦🇷', '🇦🇸', '🇦🇹'
  ],
  recent: [] // This would be populated from user's recent emojis
};

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  onClose: () => void;
}

const EmojiPicker: FC<EmojiPickerProps> = ({ onEmojiSelect, onClose }) => {
  const [activeTab, setActiveTab] = useState<'gifs' | 'stickers' | 'emoji'>('emoji');
  const [activeCategory, setActiveCategory] = useState('people');
  const [searchTerm, setSearchTerm] = useState('');
  const pickerRef = useRef<HTMLDivElement>(null);
  
  // Handle click outside to close picker
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);
  
  // Filter emojis based on search term
  const filteredEmojis = searchTerm.trim() 
    ? Object.values(emojis).flat().filter(emoji => 
        emoji.includes(searchTerm) || 
        String(emoji).toLowerCase().includes(searchTerm.toLowerCase()))
    : emojis[activeCategory as keyof typeof emojis] || [];
  
  // Handle sticker selection
  const handleStickerSelect = (stickerUrl: string) => {
    onEmojiSelect(`![sticker](${stickerUrl})`);
  };
  
  // Render content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'stickers':
        return (
          <div className="sticker-grid">
            {stickers.map((sticker, index) => (
              <button
                key={index}
                className="sticker-item"
                onClick={() => handleStickerSelect(sticker)}
              >
                <img src={sticker} alt={`Sticker ${index + 1}`} />
              </button>
            ))}
          </div>
        );
      case 'emoji':
        return (
          <>
            <div className="emoji-categories">
              {categories.map(category => (
                <button
                  key={category.id}
                  className={`category-btn ${activeCategory === category.id ? 'active' : ''}`}
                  onClick={() => {
                    setActiveCategory(category.id);
                    setSearchTerm('');
                  }}
                  title={category.name}
                >
                  {category.icon}
                </button>
              ))}
            </div>
            <div className="emoji-grid">
              {filteredEmojis.map((emoji, index) => (
                <button
                  key={index}
                  className="emoji-item"
                  onClick={() => onEmojiSelect(emoji)}
                >
                  {emoji}
                </button>
              ))}
              
              {filteredEmojis.length === 0 && (
                <div className="no-results">No emojis found</div>
              )}
            </div>
          </>
        );
      case 'gifs':
        return (
          <div className="gifs-placeholder">
            <div className="no-results">GIF functionality coming soon</div>
          </div>
        );
      default:
        return null;
    }
  };
  
  return (
    <div className="emoji-picker" ref={pickerRef}>
      {/* Tabs */}
      <div className="emoji-picker-tabs">
        <button 
          className={`emoji-tab ${activeTab === 'gifs' ? 'active' : ''}`}
          onClick={() => setActiveTab('gifs')}
        >
          GIFs
        </button>
        <button 
          className={`emoji-tab ${activeTab === 'stickers' ? 'active' : ''}`}
          onClick={() => setActiveTab('stickers')}
        >
          Stickers
        </button>
        <button 
          className={`emoji-tab ${activeTab === 'emoji' ? 'active' : ''}`}
          onClick={() => setActiveTab('emoji')}
        >
          Emoji
        </button>
      </div>
      
      {/* Search - Only show for emoji tab */}
      {activeTab === 'emoji' && (
        <div className="emoji-search-container">
          <input
            type="text"
            className="emoji-search"
            placeholder=":search_emoji:"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="emoji-search-clear" onClick={() => setSearchTerm('')}>
            ✕
          </button>
        </div>
      )}
      
      {/* Content area */}
      <div className="emoji-content">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default EmojiPicker; 