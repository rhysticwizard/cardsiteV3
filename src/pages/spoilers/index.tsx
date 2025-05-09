import React, { useEffect } from 'react';
import Spoilers from '../../components/spoilers/Spoilers';
import './styles.css';

const SpoilersPage: React.FC = () => {
  useEffect(() => {
    document.title = 'MTG Spoilers';
    
    // Add meta description for SEO
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'View the latest Magic: The Gathering card spoilers');
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = 'View the latest Magic: The Gathering card spoilers';
      document.getElementsByTagName('head')[0].appendChild(meta);
    }
  }, []);

  return (
    <Spoilers />
  );
};

export default SpoilersPage; 