import React, { useState, useEffect } from 'react';
import './GifPicker.css'; // Reuse the same CSS

interface LocalGifPickerProps {
  onSelect: (gifUrl: string) => void;
  onClose: () => void;
}

// Collection of popular GIFs stored locally so we don't need an API
const LOCAL_GIFS = [
  {
    id: '1',
    title: 'Excited',
    url: 'https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExY2oxY3JlOTJwZHVnZDdpYWdkNDF3bjBjenF5aHlhajR6cjI3MzI0ZiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/oF5oUYTz8QncY/giphy.gif',
    previewUrl: 'https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExY2oxY3JlOTJwZHVnZDdpYWdkNDF3bjBjenF5aHlhajR6cjI3MzI0ZiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/oF5oUYTz8QncY/200.gif'
  },
  {
    id: '2',
    title: 'Deal With It',
    url: 'https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExZHJuM3V5cHFjMjZ6ZzY2c3Z1Z3RrZDl4YmdmaGJzc2d0MWJ0cmFkdiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/d3mlE7uhX8KFgEmY/giphy.gif',
    previewUrl: 'https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExZHJuM3V5cHFjMjZ6ZzY2c3Z1Z3RrZDl4YmdmaGJzc2d0MWJ0cmFkdiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/d3mlE7uhX8KFgEmY/200.gif'
  },
  {
    id: '3',
    title: 'Thumbs Up',
    url: 'https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExajFxMDBrc3kwbWg5Z3UwYjMwcm9xMGdiaTI5cXIwbmw1Z2J0YXZjciZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l4q8cJzGdR9J8w3hS/giphy.gif',
    previewUrl: 'https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExajFxMDBrc3kwbWg5Z3UwYjMwcm9xMGdiaTI5cXIwbmw1Z2J0YXZjciZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l4q8cJzGdR9J8w3hS/200.gif'
  },
  {
    id: '4',
    title: 'Facepalm',
    url: 'https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExdnd2aW95NHM4ZGdmYjhnbTYzYnlwY2dwdHpvM3EzNzBobmxraGZnYSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/TJawtKM6OCKkvwCIqX/giphy.gif',
    previewUrl: 'https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExdnd2aW95NHM4ZGdmYjhnbTYzYnlwY2dwdHpvM3EzNzBobmxraGZnYSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/TJawtKM6OCKkvwCIqX/200.gif'
  },
  {
    id: '5',
    title: 'Mindblown',
    url: 'https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExODNhMnNlYnI2ZHFiajZ2Ym1zNm1oc216eDVpand6MzRkeHBpZDM1ZCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/Um3ljJl8jrnHy/giphy.gif',
    previewUrl: 'https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExODNhMnNlYnI2ZHFiajZ2Ym1zNm1oc216eDVpand6MzRkeHBpZDM1ZCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/Um3ljJl8jrnHy/200.gif'
  },
  {
    id: '6',
    title: 'Nope',
    url: 'https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExeXo2d2E1NTB1emZ1a3Q3dWZkMnZveXpjcnZxYm1kZ2JoZmx0a2MyaiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/wYyTHMm50f4Dm/giphy.gif',
    previewUrl: 'https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExeXo2d2E1NTB1emZ1a3Q3dWZkMnZveXpjcnZxYm1kZ2JoZmx0a2MyaiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/wYyTHMm50f4Dm/200.gif'
  },
  {
    id: '7',
    title: 'Gaming',
    url: 'https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExaDJvbzZ2emt1djBmeG9vNXJjcmc0MjIyMXI0cGxnbndpb3NqcW94ZiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/8JTFsZmnTR1Rs1JFVP/giphy.gif',
    previewUrl: 'https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExaDJvbzZ2emt1djBmeG9vNXJjcmc0MjIyMXI0cGxnbndpb3NqcW94ZiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/8JTFsZmnTR1Rs1JFVP/200.gif'
  },
  {
    id: '8',
    title: 'Magic',
    url: 'https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExNWp3aWh3MWtlb3JtM3pqajViZjZnM3hjbzU0Mmc5MTB6NXdsbGhxayZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/12NUbkX6p4xOO4/giphy.gif',
    previewUrl: 'https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExNWp3aWh3MWtlb3JtM3pqajViZjZnM3hjbzU0Mmc5MTB6NXdsbGhxayZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/12NUbkX6p4xOO4/200.gif'
  },
  {
    id: '9',
    title: 'Cards',
    url: 'https://media3.giphy.com/media/l2JhoZK1wxY8e1UOI/giphy.gif',
    previewUrl: 'https://media3.giphy.com/media/l2JhoZK1wxY8e1UOI/200.gif'
  },
  {
    id: '10',
    title: 'Game Night',
    url: 'https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExb2xrMXNubWNyZXdyenE2MWJydGw2dXdtazdrZnA2Y3BlN2M2bGo2ciZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/xT5LMzFeXZZNhp8rTO/giphy.gif',
    previewUrl: 'https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExb2xrMXNubWNyZXdyenE2MWJydGw2dXdtazdrZnA2Y3BlN2M2bGo2ciZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/xT5LMzFeXZZNhp8rTO/200.gif'
  },
  {
    id: '11',
    title: 'Winning',
    url: 'https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExd3BlOXU4N21zejk5aHhkaDd1a3JiZTZlM3cxbmljM2MzZHRsdDJwbiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/YRuFixSNWFVcXaxpmX/giphy.gif',
    previewUrl: 'https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExd3BlOXU4N21zejk5aHhkaDd1a3JiZTZlM3cxbmljM2MzZHRsdDJwbiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/YRuFixSNWFVcXaxpmX/200.gif'
  },
  {
    id: '12',
    title: 'What?',
    url: 'https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExeXJrOGZ0bm1tdXF6ZnE5ZDVhaDd1NHdxdG41cWd0NmhmbnJpajRtZyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7527pa7qs9kCG78A/giphy.gif',
    previewUrl: 'https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExeXJrOGZ0bm1tdXF6ZnE5ZDVhaDd1NHdxdG41cWd0NmhmbnJpajRtZyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7527pa7qs9kCG78A/200.gif'
  },
  {
    id: '13',
    title: 'Hmm',
    url: 'https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExNWJ5NGp0ZWhrM2U3OWJnY3BtaTc0d3Y5NXR6MGczOTRpdDU5M2pmbyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/CaiVJuZGvR8HK/giphy.gif',
    previewUrl: 'https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExNWJ5NGp0ZWhrM2U3OWJnY3BtaTc0d3Y5NXR6MGczOTRpdDU5M2pmbyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/CaiVJuZGvR8HK/200.gif'
  },
  {
    id: '14',
    title: 'Happy',
    url: 'https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExOWYyZGl0ZjRyZmNlYXIxdDkwdmk3ZXZka2c5YjNjZ25hMGI0NWRhcyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/chzz1FQgqPyt2/giphy.gif',
    previewUrl: 'https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExOWYyZGl0ZjRyZmNlYXIxdDkwdmk3ZXZka2c5YjNjZ25hMGI0NWRhcyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/chzz1FQgqPyt2/200.gif'
  },
  {
    id: '15',
    title: 'LOL',
    url: 'https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExaG5oemkwdm1jcDkxMzA1d2YxczluOTc0czVyaGRjdDM0em04cnI2byZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/10JhviFuU2gWD6/giphy.gif',
    previewUrl: 'https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExaG5oemkwdm1jcDkxMzA1d2YxczluOTc0czVyaGRjdDM0em04cnI2byZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/10JhviFuU2gWD6/200.gif'
  },
  {
    id: '16',
    title: 'Sad',
    url: 'https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExMDNnb2loajNpZWlvcWdzZzhsaTR6cXF5bDlxMnE3eGRiMHZlbGdyYiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/ISOckXUybVfQ4/giphy.gif',
    previewUrl: 'https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExMDNnb2loajNpZWlvcWdzZzhsaTR6cXF5bDlxMnE3eGRiMHZlbGdyYiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/ISOckXUybVfQ4/200.gif'
  }
];

// Categories for GIFs
const CATEGORIES = [
  { id: 'all', name: 'All' },
  { id: 'reactions', name: 'Reactions' },
  { id: 'gaming', name: 'Gaming' }
];

const LocalGifPicker: React.FC<LocalGifPickerProps> = ({ onSelect, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredGifs, setFilteredGifs] = useState(LOCAL_GIFS);
  const [activeCategory, setActiveCategory] = useState('all');

  // Filter GIFs based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredGifs(LOCAL_GIFS);
      return;
    }

    const lowerSearchTerm = searchTerm.toLowerCase();
    const filtered = LOCAL_GIFS.filter(gif => 
      gif.title.toLowerCase().includes(lowerSearchTerm)
    );
    setFilteredGifs(filtered);
  }, [searchTerm]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is already handled by the useEffect above
  };

  const handleSelect = (gif: typeof LOCAL_GIFS[0]) => {
    onSelect(gif.url);
    onClose();
  };

  return (
    <div className="gif-picker-overlay">
      <div className="gif-picker-container">
        <div className="gif-picker-header">
          <h3>Select a GIF</h3>
          <button className="gif-close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        <form onSubmit={handleSearch} className="gif-search-form">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search GIFs..."
            className="gif-search-input"
          />
          <button type="submit" className="gif-search-btn">
            Search
          </button>
        </form>

        <div className="gif-categories">
          {CATEGORIES.map(category => (
            <button
              key={category.id}
              className={`gif-category-btn ${activeCategory === category.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(category.id)}
            >
              {category.name}
            </button>
          ))}
        </div>

        <div className="gif-results">
          {filteredGifs.length === 0 ? (
            <div className="gif-no-results">No GIFs found</div>
          ) : (
            <div className="gif-grid">
              {filteredGifs.map((gif) => (
                <div
                  key={gif.id}
                  className="gif-item"
                  onClick={() => handleSelect(gif)}
                >
                  <img src={gif.previewUrl} alt={gif.title} loading="lazy" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LocalGifPicker; 