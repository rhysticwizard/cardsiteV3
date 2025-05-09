import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import './Navbar.css';

const Navbar: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  return (
    <nav className="navbar">
      <div className="logo">MTG Community Hub</div>
      <form className="nav-search-form" onSubmit={handleSearchSubmit}>
        <input
          type="text"
          placeholder="Search cards..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="nav-search-input"
        />
        <button type="submit" className="nav-search-button">
          <FontAwesomeIcon icon={faSearch} />
        </button>
      </form>
      <ul className="nav-links">
        <li><Link to="/">Home</Link></li>
        <li><Link to="/sets">All Sets</Link></li>
        <li><Link to="/deckbuilder">Deck Builder</Link></li>
        <li><Link to="/random-card">Random Card</Link></li>
        <li><Link to="/spoilers">Spoilers</Link></li>
        <li><Link to="/about">About</Link></li>
        <li><Link to="/services">Services</Link></li>
        <li><Link to="/contact">Contact</Link></li>
      </ul>
    </nav>
  );
};

export default Navbar; 