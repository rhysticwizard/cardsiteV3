import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

// Sidebar styling
const sidebarStyles = `
  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    width: 260px;
    background-color: #000;
    color: #fff;
    display: flex;
    flex-direction: column;
    z-index: 100;
    transition: transform 0.3s ease;
  }

  .sidebar-collapsed {
    transform: translateX(-100%);
  }

  .sidebar-toggle {
    position: fixed;
    bottom: 20px;
    left: 12px;
    width: 36px;
    height: 36px;
    border-radius: 4px;
    background-color: #000;
    color: #fff;
    border: none;
    box-shadow: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 101;
    font-size: 20px;
  }

  .sidebar-toggle-collapsed {
    box-shadow: none;
  }

  .sidebar-header {
    padding: 20px 20px 18px;
    display: flex;
    align-items: center;
  }

  .sidebar-logo {
    font-weight: 600;
    font-size: 20px;
    color: #fff;
    margin-left: 36px;
  }

  .close-button {
    position: absolute;
    left: 20px;
    top: 20px;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    cursor: pointer;
    color: #fff;
    background: none;
    border: none;
    padding: 0;
  }

  .sidebar-content {
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow-y: auto;
    padding: 16px 0;
  }

  .sidebar-nav {
    display: flex;
    flex-direction: column;
    padding: 0 20px;
  }

  .nav-item {
    display: flex;
    align-items: center;
    padding: 12px 0;
    color: #fff;
    text-decoration: none;
    font-size: 15px;
    font-weight: 400;
    transition: opacity 0.2s ease;
    opacity: 0.7;
  }

  .nav-item:hover {
    opacity: 1;
  }

  .nav-item-active {
    opacity: 1;
  }

  .sidebar-footer {
    padding: 20px;
    position: relative;
  }

  .collapse-button {
    position: absolute;
    left: 20px;
    bottom: 20px;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    cursor: pointer;
    color: rgba(255, 255, 255, 0.7);
    background: none;
    border: none;
    padding: 0;
  }

  .collapse-button:hover {
    color: #fff;
  }

  .overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 99;
    display: none;
  }

  .overlay-visible {
    display: block;
  }

  /* Content adjustments */
  .app-content {
    transition: margin-left 0.3s ease;
  }

  .content-collapsed {
    margin-left: 0 !important;
  }

  @media (max-width: 768px) {
    .sidebar {
      width: 260px;
      transform: translateX(-100%);
    }

    .sidebar-expanded {
      transform: translateX(0);
    }
  }
`;

const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(window.innerWidth <= 768);
  const location = useLocation();

  useEffect(() => {
    // Add the styles to the document
    if (!document.getElementById('sidebar-styles')) {
      const styleEl = document.createElement('style');
      styleEl.id = 'sidebar-styles';
      styleEl.textContent = sidebarStyles;
      document.head.appendChild(styleEl);
    }

    // Handle window resize
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setCollapsed(true);
      }
    };

    window.addEventListener('resize', handleResize);

    // Apply content adjustments based on sidebar state
    const appContent = document.querySelector('.app-content');
    if (appContent) {
      if (collapsed) {
        appContent.classList.add('content-collapsed');
      } else {
        appContent.classList.remove('content-collapsed');
      }
    }

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [collapsed]);

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  const closeSidebar = () => {
    if (window.innerWidth <= 768) {
      setCollapsed(true);
    }
  };

  return (
    <>
      {/* Sidebar toggle button */}
      {collapsed && (
        <button 
          className={`sidebar-toggle ${collapsed ? 'sidebar-toggle-collapsed' : ''}`}
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
        >
          ☰
        </button>
      )}

      {/* Overlay for mobile */}
      <div 
        className={`overlay ${!collapsed && window.innerWidth <= 768 ? 'overlay-visible' : ''}`}
        onClick={closeSidebar}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''} ${!collapsed && window.innerWidth <= 768 ? 'sidebar-expanded' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo"></div>
        </div>

        <div className="sidebar-content">
          <nav className="sidebar-nav">
            <Link 
              to="/" 
              className={`nav-item ${location.pathname === '/' ? 'nav-item-active' : ''}`}
              onClick={closeSidebar}
            >
              Home
            </Link>
            <Link 
              to="/sets" 
              className={`nav-item ${location.pathname.includes('/sets') || location.pathname.includes('/card/') ? 'nav-item-active' : ''}`}
              onClick={closeSidebar}
            >
              All Sets
            </Link>
            <Link 
              to="/decks" 
              className={`nav-item ${location.pathname.includes('/decks') ? 'nav-item-active' : ''}`}
              onClick={closeSidebar}
            >
              Decks
            </Link>
            <Link 
              to="/spoilers" 
              className={`nav-item ${location.pathname.includes('/spoilers') ? 'nav-item-active' : ''}`}
              onClick={closeSidebar}
            >
              Spoilers
            </Link>
            <Link 
              to="/forums" 
              className={`nav-item ${location.pathname.includes('/forums') ? 'nav-item-active' : ''}`}
              onClick={closeSidebar}
            >
              Forums
            </Link>
          </nav>
        </div>

        <div className="sidebar-footer">
          {!collapsed && (
            <button className="collapse-button" onClick={toggleSidebar}>
              ×
            </button>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar; 