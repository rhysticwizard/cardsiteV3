import React from 'react';
import ProfileButton from './ProfileButton';
import './GlobalNavbar.css';

const GlobalNavbar: React.FC = () => {
  return (
    <nav className="global-navbar">
      <div className="navbar-content">
        <div className="profile-container">
          <ProfileButton />
        </div>
      </div>
    </nav>
  );
};

export default GlobalNavbar; 