import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import charactersData from '../../lore/mtg_characters_CLEANED.json';
import '../../styles/lore/Characters.css';

interface CharacterData {
  metadata: any;
  characters: Record<string, any>;
}

interface Character {
  name: string;
  description: string;
  is_planeswalker: boolean;
  is_deceased: boolean;
  colors: string[];
  planes_associated: string[];
  races: string[];
  classes: string[];
  wiki_url: string;
  image_path?: string;
  type?: string;
  status?: string;
  plane?: string;
  race?: string;
  class?: string;
}

const Characters: React.FC = () => {
  const [selectedLetter, setSelectedLetter] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const charactersPerPage = 50;
  const navigate = useNavigate();

  // Convert the characters data to our interface format
  const allCharacters: Character[] = useMemo(() => {
    const data = charactersData as CharacterData;
    return Object.values(data.characters).map((char: any) => {
      // Create image path based on character name
      const getImagePath = (name: string): string | undefined => {
        // Handle special cases first (based on actual scraper output)
        const specialCases: { [key: string]: string } = {
          "Go-Shintai of Life's Origin": "Go-Shintai_of_Life_s_Origin.jpg",
          "Clavileño": "Clavileño.jpg"
        };
        
        if (specialCases[name]) {
          return `${specialCases[name]}`;
        }
        
        // Match the scraper's general logic: replace non-word chars with underscores
        // but keep hyphens and periods, then clean up multiple underscores
        // BUT don't remove trailing underscores (the scraper kept them)
        let fileName = name
          .replace(/[^\w\-.']/g, '_')  // Replace non-word chars (except hyphens, periods, apostrophes) with underscores
          .replace(/_+/g, '_')         // Replace multiple underscores with single underscore
          .replace(/^_+/g, '');        // Remove only leading underscores, keep trailing ones
        
        return `${fileName}.jpg`;
      };

      return {
        name: char.name,
        description: char.description || '',
        is_planeswalker: char.is_planeswalker || false,
        is_deceased: char.is_deceased || false,
        colors: char.colors || [],
        planes_associated: char.planes_associated || [],
        races: char.races || [],
        classes: char.classes || [],
        wiki_url: char.wiki_url || '',
        image_path: getImagePath(char.name),
        type: char.type,
        status: char.status,
        plane: char.plane,
        race: char.race,
        class: char.class
      };
    }).sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically
  }, []);

  // Filter characters based on selected alphabet
  const filteredCharacters = useMemo(() => {
    if (selectedLetter === 'All') {
      return allCharacters;
    }
    return allCharacters.filter(char => 
      char.name.toLowerCase().startsWith(selectedLetter.toLowerCase())
    );
  }, [allCharacters, selectedLetter]);

  // Paginate the filtered characters
  const paginatedCharacters = useMemo(() => {
    const startIndex = (currentPage - 1) * charactersPerPage;
    const endIndex = startIndex + charactersPerPage;
    return filteredCharacters.slice(startIndex, endIndex);
  }, [filteredCharacters, currentPage, charactersPerPage]);

  const totalPages = Math.ceil(filteredCharacters.length / charactersPerPage);

  const handleAlphabetClick = (letter: string) => {
    setSelectedLetter(letter);
    setCurrentPage(1); // Reset to first page when changing filter
  };

  const handleCharacterClick = (character: Character) => {
    // Navigate to character detail page
    const encodedName = encodeURIComponent(character.name);
    navigate(`/lore/character/${encodedName}`);
  };

  const CharacterCard: React.FC<{ character: Character; onClick: () => void }> = ({ character, onClick }) => {
    const getTypeIcon = (character: Character) => {
      // Remove all emojis
      return '';
    };

    const getColorIndicators = (character: Character) => {
      // Remove all color emoji indicators
      return '';
    };

    return (
      <div className="character-card" onClick={onClick}>
        {character.image_path && (
          <div className="character-image-background">
            <img 
              src={`${process.env.PUBLIC_URL}/lore/character_images/${character.image_path}?v=1`} 
              alt={character.name}
              className="character-full-image"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                const currentSrc = target.src;
                
                // Try alternative extensions
                if (currentSrc.includes('.jpg')) {
                  target.src = currentSrc.replace('.jpg', '.png');
                } else if (currentSrc.includes('.png')) {
                  target.src = currentSrc.replace('.png', '.jpeg');
                } else if (currentSrc.includes('.jpeg')) {
                  target.src = currentSrc.replace('.jpeg', '.webp');
                } else {
                  // All extensions failed, hide the image
                  target.style.display = 'none';
                }
              }}
            />
          </div>
        )}
        
        <div className="character-overlay">
          <div className="character-header">
            <div className="character-info">
              <h3 className="character-name">
                {character.name}
              </h3>
            </div>
          </div>
          
          <div className="character-details">
            {character.race && (
              <p className="character-detail">
                <strong>Race:</strong> {character.race}
              </p>
            )}
            
            {character.class && (
              <p className="character-detail">
                <strong>Class:</strong> {character.class}
              </p>
            )}
            
            {character.plane && (
              <p className="character-detail">
                <strong>Plane:</strong> {character.plane}
              </p>
            )}
            
            {character.status && (
              <p className="character-detail">
                <strong>Status:</strong> {character.status}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="characters-container">
      <div className="alphabet-navigation">
        {['All', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'].map((letter) => (
          <button
            key={letter}
            className={`alphabet-btn ${selectedLetter === letter ? 'active' : ''}`}
            onClick={() => handleAlphabetClick(letter)}
          >
            {letter}
          </button>
        ))}
      </div>
      
      <div className="characters-content">
        <div className="character-list">
          {paginatedCharacters.map((character, index) => (
            <CharacterCard
              key={`${character.name}-${index}`}
              character={character}
              onClick={() => handleCharacterClick(character)}
            />
          ))}
        </div>

        {totalPages > 1 && (
          <div className="pagination-controls">
            <button 
              className="pagination-btn"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              First
            </button>
            <button 
              className="pagination-btn"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            
            <span className="page-indicator">
              {currentPage} / {totalPages}
            </span>
            
            <button 
              className="pagination-btn"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
            <button 
              className="pagination-btn"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              Last
            </button>
          </div>
        )}

        {filteredCharacters.length === 0 && (
          <div className="no-characters">
            <p>No characters found starting with "{selectedLetter}"</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Characters; 