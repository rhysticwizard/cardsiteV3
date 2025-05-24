import React, { useState } from 'react';
import '../../styles/lore/Characters.css'; // We can reuse the same CSS

const Locations: React.FC = () => {
  const [activeAlphabet, setActiveAlphabet] = useState<string>('All');
  const alphabetOptions = ['All', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

  const handleAlphabetClick = (letter: string) => {
    setActiveAlphabet(letter);
    // Future implementation: filter locations by starting letter
  };

  return (
    <div className="characters-container">
      <div className="alphabet-navigation">
        {alphabetOptions.map((letter) => (
          <button
            key={letter}
            className={`alphabet-btn ${activeAlphabet === letter ? 'active' : ''}`}
            onClick={() => handleAlphabetClick(letter)}
          >
            {letter}
          </button>
        ))}
      </div>
      
      <div className="characters-content">
        {/* Content will be added in future implementation */}
      </div>
    </div>
  );
};

export default Locations; 