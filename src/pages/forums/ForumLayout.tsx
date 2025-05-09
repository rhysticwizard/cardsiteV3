import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import './ForumLayout.css'; // Import the new CSS file for consistent layout

const ForumLayout: React.FC = () => {
  useEffect(() => {
    // Add Font Awesome stylesheet if it doesn't exist
    if (!document.querySelector('link[href*="font-awesome"]')) {
      const fontAwesomeLink = document.createElement('link');
      fontAwesomeLink.rel = 'stylesheet';
      fontAwesomeLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
      document.head.appendChild(fontAwesomeLink);
    }
    
    return () => {
      // Clean up Font Awesome link when component unmounts
      const fontAwesomeLink = document.querySelector('link[href*="font-awesome"]');
      if (fontAwesomeLink) {
        document.head.removeChild(fontAwesomeLink);
      }
    };
  }, []);

  return (
    <div className="forum-layout">
      <Outlet />
    </div>
  );
};

export default ForumLayout; 