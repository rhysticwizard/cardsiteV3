import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import charactersData from '../../lore/mtg_characters_CLEANED.json';
import '../../styles/lore/CharacterDetail.css';

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
  creature_types: string[];
  categories: string[];
  wiki_url?: string;
  image_path?: string;
  biographical_info?: {
    race?: string;
    birthplace?: string;
    lifetime?: string;
    death?: string;
    relatives?: string;
    image?: string;
  };
  abilities?: string[];
  story_appearances?: string[];
  card_associations?: string[];
  game_mechanics?: string[];
  planeswalker_type?: string;
  race?: string;
  plane?: string;
  status?: string;
  raw_content?: string;
  external_links?: string[];
}

const CharacterDetail: React.FC = () => {
  const { characterName } = useParams<{ characterName: string }>();
  const navigate = useNavigate();
  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('Story');

  const topNavItems = ['Story', 'Character', 'Game', 'References'];

  const handleNavClick = (item: string) => {
    setActiveTab(item);
  };

  useEffect(() => {
    if (!characterName) {
      setError('No character specified');
      setLoading(false);
      return;
    }

    try {
      const data = charactersData as CharacterData;
      const decodedName = decodeURIComponent(characterName);
      
      // Find character by name in the cleaned data structure
      const foundCharacter = Object.values(data.characters).find((char: any) => 
        char.name === decodedName
      );

      if (!foundCharacter) {
        setError('Character not found');
        setLoading(false);
        return;
      }

      // Create image path
      const getImagePath = (char: any): string | undefined => {
        // Check if image is provided in biographical_info
        if (char.biographical_info?.image) {
          return char.biographical_info.image;
        }
        
        // Fallback to generating from name
        const name = char.name;
        const specialCases: { [key: string]: string } = {
          "Go-Shintai of Life's Origin": "Go-Shintai_of_Life_s_Origin.jpg",
          "Clavileño": "Clavileño.jpg"
        };
        
        if (specialCases[name]) {
          return specialCases[name];
        }
        
        let fileName = name
          .replace(/[^\w\-.']/g, '_')
          .replace(/_+/g, '_')
          .replace(/^_+/g, '');
        
        return `${fileName}.jpg`;
      };

      // Extract wiki URL from external links or URL field
      const getWikiUrl = (char: any): string | undefined => {
        if (char.url && char.url.includes('mtg.wiki')) {
          return char.url;
        }
        if (char.external_links && char.external_links.length > 0) {
          return char.external_links.find((link: string) => link.includes('mtg.wiki')) || char.external_links[0];
        }
        return undefined;
      };

      const characterWithImage: Character = {
        name: foundCharacter.name,
        description: foundCharacter.description || '',
        is_planeswalker: foundCharacter.is_planeswalker || false,
        is_deceased: foundCharacter.is_deceased || false,
        colors: foundCharacter.colors || [],
        planes_associated: foundCharacter.planes_associated || [],
        creature_types: foundCharacter.creature_types || [],
        categories: foundCharacter.categories || [],
        wiki_url: getWikiUrl(foundCharacter),
        image_path: getImagePath(foundCharacter),
        biographical_info: foundCharacter.biographical_info || {},
        abilities: foundCharacter.abilities || [],
        story_appearances: foundCharacter.story_appearances || [],
        card_associations: foundCharacter.card_associations || [],
        game_mechanics: foundCharacter.game_mechanics || [],
        planeswalker_type: foundCharacter.planeswalker_type,
        race: foundCharacter.race || foundCharacter.biographical_info?.race,
        plane: foundCharacter.plane || foundCharacter.biographical_info?.birthplace,
        status: foundCharacter.status || (foundCharacter.is_deceased ? 'Deceased' : 'Unknown'),
        raw_content: foundCharacter.raw_content,
        external_links: foundCharacter.external_links || []
      };

      setCharacter(characterWithImage);
      setLoading(false);
    } catch (err) {
      setError('Failed to load character details');
      setLoading(false);
    }
  }, [characterName]);

  const renderTabContent = () => {
    if (!character) return null;

    switch (activeTab) {
      case 'Story':
        return (
          <div className="tab-content">
            
            {/* Description */}
            {character.description && (
              <div className="story-section">
                <h3>Description</h3>
                <p>{character.description}</p>
              </div>
            )}
            
            {/* Story Appearances */}
            {character.story_appearances && character.story_appearances.length > 0 && (
              <div className="story-section">
                <h3>Story Appearances</h3>
                <div>
                  {character.story_appearances.map((appearance, index) => (
                    <div key={index}>
                      <p>{appearance}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Biography */}
            {character.biographical_info && (
              <div className="story-section">
                <h3>Biography</h3>
                {character.biographical_info.lifetime && (
                  <p><strong>Lifetime:</strong> {character.biographical_info.lifetime}</p>
                )}
                {character.biographical_info.death && (
                  <p><strong>Death:</strong> {character.biographical_info.death}</p>
                )}
                {character.biographical_info.relatives && (
                  <p><strong>Relatives:</strong> {character.biographical_info.relatives}</p>
                )}
              </div>
            )}
            
            {/* Associated Planes */}
            {character.planes_associated && character.planes_associated.length > 0 && (
              <div className="story-section">
                <h3>Associated Planes</h3>
                <div>
                  <ul>
                    {character.planes_associated.map((plane, index) => (
                      <li key={index}>{plane}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            
            {/* Status */}
            <div className="story-section">
              <h3>Status</h3>
              <p><strong>Current Status:</strong> {character.status}</p>
              {character.is_deceased && <p><strong>Deceased:</strong> Yes</p>}
              {character.is_planeswalker && <p><strong>Planeswalker:</strong> Yes</p>}
            </div>
          </div>
        );

      case 'Character':
        return (
          <div className="tab-content">
            
            {/* Identity */}
            <div className="character-section">
              <h3>Identity</h3>
              <p><strong>Name:</strong> {character.name}</p>
              {character.race && <p><strong>Race:</strong> {character.race}</p>}
              {character.biographical_info?.birthplace && (
                <p><strong>Birthplace:</strong> {character.biographical_info.birthplace}</p>
              )}
            </div>
            
            {/* Biology */}
            {character.creature_types && character.creature_types.length > 0 && (
              <div className="character-section">
                <h3>Biology</h3>
                <div>
                  <strong>Creature Types:</strong>
                  <ul>
                    {character.creature_types.map((type, index) => (
                      <li key={index}>{type}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            
            {/* Abilities */}
            {character.abilities && character.abilities.length > 0 && (
              <div className="character-section">
                <h3>Abilities</h3>
                <div>
                  {character.abilities.map((ability, index) => (
                    <div key={index}>
                      <p>{ability}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Chronology */}
            <div className="character-section">
              <h3>Chronology</h3>
              {character.biographical_info?.lifetime && (
                <p><strong>Lifetime:</strong> {character.biographical_info.lifetime}</p>
              )}
              {character.is_deceased && <p><strong>Status:</strong> Deceased</p>}
              {character.status && character.status !== 'Deceased' && (
                <p><strong>Status:</strong> {character.status}</p>
              )}
            </div>
            
            {/* Magic */}
            <div className="character-section">
              <h3>Magic</h3>
              <p><strong>Planeswalker:</strong> {character.is_planeswalker ? 'Yes' : 'No'}</p>
              {character.planeswalker_type && (
                <p><strong>Planeswalker Type:</strong> {character.planeswalker_type}</p>
              )}
              {character.colors && character.colors.length > 0 && (
                <div>
                  <strong>Colors:</strong>
                  <div className="colors-list">
                    {character.colors.map((color, index) => (
                      <span key={index} className={`color-badge ${color.toLowerCase()}`}>
                        {color}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'Game':
        return (
          <div className="tab-content">
            
            {/* Mechanics */}
            <div className="game-section">
              <h3>Mechanics</h3>
              {character.is_planeswalker && <p><strong>Card Type:</strong> Planeswalker</p>}
              {character.colors && character.colors.length > 0 && (
                <div>
                  <strong>Color Identity:</strong>
                  <div className="colors-list">
                    {character.colors.map((color, index) => (
                      <span key={index} className={`color-badge ${color.toLowerCase()}`}>
                        {color}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {character.creature_types && character.creature_types.length > 0 && (
                <div>
                  <strong>Creature Types:</strong>
                  <ul>
                    {character.creature_types.map((type, index) => (
                      <li key={index}>{type}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            {/* Game Mechanics */}
            {character.game_mechanics && character.game_mechanics.length > 0 && (
              <div className="game-section">
                <h3>Game Mechanics</h3>
                <div>
                  {character.game_mechanics.map((mechanic, index) => (
                    <div key={index}>
                      <p>{mechanic}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Card Associations */}
            {character.card_associations && character.card_associations.length > 0 && (
              <div className="game-section">
                <h3>Card Associations</h3>
                <div>
                  {character.card_associations.map((card, index) => (
                    <div key={index}>
                      <p>{card}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Categories */}
            {character.categories && character.categories.length > 0 && (
              <div className="game-section">
                <h3>Categories</h3>
                <div>
                  <ul>
                    {character.categories.map((category, index) => (
                      <li key={index}>{category.replace('Category:', '')}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            
            {/* Appearances */}
            {character.planes_associated && character.planes_associated.length > 0 && (
              <div className="game-section">
                <h3>Plane Appearances</h3>
                <div>
                  <strong>Associated Planes:</strong>
                  <ul>
                    {character.planes_associated.map((plane, index) => (
                      <li key={index}>{plane}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        );

      case 'References':
        return (
          <div className="tab-content">
            
            {/* Sources */}
            <div className="references-section">
              <h3>Sources</h3>
              {character.wiki_url ? (
                <a href={character.wiki_url} target="_blank" rel="noopener noreferrer">
                  View on MTG Wiki
                </a>
              ) : (
                <p>No wiki URL available</p>
              )}
            </div>
            
            {/* External Links */}
            {character.external_links && character.external_links.length > 0 && (
              <div className="references-section">
                <h3>External Links</h3>
                <div>
                  {character.external_links.map((link, index) => (
                    <div key={index}>
                      <a href={link} target="_blank" rel="noopener noreferrer">
                        {link}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Media */}
            <div className="references-section">
              <h3>Media</h3>
              {character.image_path && (
                <p><strong>Image Path:</strong> {character.image_path}</p>
              )}
            </div>
            
            {/* Categories */}
            <div className="references-section">
              <h3>Categories</h3>
              <div>
                <strong>Classification Tags:</strong>
                <ul>
                  {character.is_planeswalker && <li>Planeswalker</li>}
                  {character.is_deceased && <li>Deceased</li>}
                  {character.race && <li>Race: {character.race}</li>}
                  {character.creature_types && character.creature_types.map((type, index) => (
                    <li key={index}>Type: {type}</li>
                  ))}
                  {character.colors && character.colors.map((color, index) => (
                    <li key={index}>Color: {color}</li>
                  ))}
                  {character.categories && character.categories.map((category, index) => (
                    <li key={index}>{category.replace('Category:', '')}</li>
                  ))}
                </ul>
              </div>
            </div>
            
            {/* Raw Content */}
            {character.raw_content && (
              <div className="references-section">
                <h3>Raw Wiki Content</h3>
                <p><strong>Data Source:</strong> MTG Characters Database (Cleaned as of May 23, 2024)</p>
                <p><strong>Original Content:</strong> Scraped from MTG Wiki</p>
                <details>
                  <summary>View Raw Wiki Content</summary>
                  <pre style={{fontSize: '0.8rem', marginTop: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'auto', whiteSpace: 'pre-wrap'}}>
                    {character.raw_content}
                  </pre>
                </details>
              </div>
            )}
            
            {/* Raw Data */}
            <div className="references-section">
              <h3>Raw Character Data</h3>
              <details>
                <summary>View Raw Character Data (JSON)</summary>
                <pre style={{fontSize: '0.8rem', marginTop: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'auto'}}>
                  {JSON.stringify(character, null, 2)}
                </pre>
              </details>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="character-detail-container">
        <div className="top-nav-bar">
          {topNavItems.map(item => (
            <button 
              key={item}
              className={`top-nav-btn ${item === activeTab ? 'active' : ''}`}
              onClick={() => handleNavClick(item)}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="loading">Loading character details...</div>
      </div>
    );
  }

  if (error || !character) {
    return (
      <div className="character-detail-container">
        <div className="top-nav-bar">
          {topNavItems.map(item => (
            <button 
              key={item}
              className={`top-nav-btn ${item === activeTab ? 'active' : ''}`}
              onClick={() => handleNavClick(item)}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="error-message">
          <h2>Error</h2>
          <p>{error || 'Character not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="character-detail-container">
      <div className="top-nav-bar">
        {topNavItems.map(item => (
          <button 
            key={item}
            className={`top-nav-btn ${item === activeTab ? 'active' : ''}`}
            onClick={() => handleNavClick(item)}
          >
            {item}
          </button>
        ))}
      </div>
      
      <div className="character-detail-main">
        <div className="character-detail-left">
          {renderTabContent()}
        </div>
        
        <div className="character-detail-right">
          {character.image_path && (
            <div className="character-detail-image-container">
              <img 
                src={`${process.env.PUBLIC_URL}/lore/character_images/${character.image_path}?v=1`}
                alt={character.name}
                className="character-detail-image"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  const currentSrc = target.src;
                  
                  if (currentSrc.includes('.jpg')) {
                    target.src = currentSrc.replace('.jpg', '.png');
                  } else if (currentSrc.includes('.png')) {
                    target.src = currentSrc.replace('.png', '.jpeg');
                  } else if (currentSrc.includes('.jpeg')) {
                    target.src = currentSrc.replace('.jpeg', '.webp');
                  } else {
                    target.style.display = 'none';
                  }
                }}
              />
            </div>
          )}
          
          <h1 className="character-detail-title">{character.name}</h1>
        </div>
      </div>
    </div>
  );
};

export default CharacterDetail; 