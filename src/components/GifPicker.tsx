import React, { useState, useEffect } from 'react';
import './GifPicker.css';

interface GifPickerProps {
  onSelect: (gifUrl: string) => void;
  onClose: () => void;
}

interface Gif {
  id: string;
  url: string;
  title: string;
  images: {
    fixed_height: {
      url: string;
    };
    original: {
      url: string;
    };
  };
}

const GifPicker: React.FC<GifPickerProps> = ({ onSelect, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [gifs, setGifs] = useState<Gif[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // This is Giphy's public test API key for development
  const API_KEY = 'dc6zaTOxFJmzC';

  // Load trending GIFs on initial mount
  useEffect(() => {
    fetchTrendingGifs();
  }, []);

  const fetchTrendingGifs = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://api.giphy.com/v1/gifs/trending?api_key=${API_KEY}&limit=20`
      );
      const data = await response.json();
      setGifs(data.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching trending GIFs:', err);
      setError('Failed to load trending GIFs');
    } finally {
      setLoading(false);
    }
  };

  const searchGifs = async () => {
    if (!searchTerm.trim()) {
      fetchTrendingGifs();
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://api.giphy.com/v1/gifs/search?api_key=${API_KEY}&q=${encodeURIComponent(
          searchTerm
        )}&limit=20`
      );
      const data = await response.json();
      setGifs(data.data);
      setError(null);
    } catch (err) {
      console.error('Error searching GIFs:', err);
      setError('Failed to search GIFs');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchGifs();
  };

  const handleSelect = (gif: Gif) => {
    onSelect(gif.images.original.url);
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

        <div className="gif-results">
          {loading && <div className="gif-loading">Loading...</div>}
          {error && <div className="gif-error">{error}</div>}
          {!loading && gifs.length === 0 && (
            <div className="gif-no-results">No GIFs found</div>
          )}
          <div className="gif-grid">
            {gifs.map((gif) => (
              <div
                key={gif.id}
                className="gif-item"
                onClick={() => handleSelect(gif)}
              >
                <img
                  src={gif.images.fixed_height.url}
                  alt={gif.title}
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GifPicker; 