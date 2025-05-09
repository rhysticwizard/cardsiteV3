import React from 'react';

interface FooterProps {
  copyrightYear?: number;
}

const Footer: React.FC<FooterProps> = ({ copyrightYear = new Date().getFullYear() }) => {
  return (
    <footer className="App-footer">
      <p>&copy; {copyrightYear} My Website. All rights reserved.</p>
    </footer>
  );
};

export default Footer; 