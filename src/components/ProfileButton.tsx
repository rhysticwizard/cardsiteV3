import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ProfileButton.css';
import { useProfile } from '../context/ProfileContext';

const ProfileButton: React.FC = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { avatarSrc, userName, userEmail } = useProfile();

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleProfileClick = () => {
    navigate('/profile');
    setDropdownOpen(false);
  };

  const handleAvatarClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent toggle dropdown
    navigate('/profile');
  };

  return (
    <div className="profile-button-container" ref={dropdownRef}>
      <button className="profile-button" onClick={toggleDropdown} aria-label="Profile menu">
        <div className="profile-avatar" onClick={handleAvatarClick}>
          {avatarSrc ? (
            <img src={avatarSrc} alt="Profile" className="profile-avatar-image" />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
            </svg>
          )}
        </div>
      </button>
      
      {dropdownOpen && (
        <div className="profile-dropdown">
          <div className="dropdown-header">
            <div className="dropdown-user-info">
              <span className="dropdown-username">{userName}</span>
              <span className="dropdown-email">{userEmail}</span>
            </div>
          </div>
          <div className="dropdown-divider"></div>
          <ul className="dropdown-menu">
            <li onClick={handleProfileClick} className="menu-item-clickable">
              <span className="menu-icon">👤</span>
              Profile
            </li>
            <li>
              <span className="menu-icon">⚙️</span>
              Settings
            </li>
            <li>
              <span className="menu-icon">🔑</span>
              Account
            </li>
            <li className="dropdown-divider"></li>
            <li>
              <span className="menu-icon">➡️</span>
              Sign out
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default ProfileButton; 