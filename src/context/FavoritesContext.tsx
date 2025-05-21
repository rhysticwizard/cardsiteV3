import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

// Card interface from existing types
interface Card {
  id: string;
  name: string;
  image_uris?: {
    normal: string;
    small?: string;
    art_crop?: string;
    [key: string]: string | undefined;
  };
  card_faces?: Array<{
    image_uris?: {
      normal: string;
      small?: string;
      art_crop?: string;
      [key: string]: string | undefined;
    };
  }>;
  set_name?: string;
  set?: string;
  collector_number?: string;
  type_line?: string;
  rarity?: string;
}

interface FavoritesContextType {
  favorites: Card[];
  addFavorite: (card: Card) => void;
  removeFavorite: (cardId: string) => void;
  isFavorite: (cardId: string) => boolean;
}

const defaultContext: FavoritesContextType = {
  favorites: [],
  addFavorite: () => {},
  removeFavorite: () => {},
  isFavorite: () => false,
};

const FavoritesContext = createContext<FavoritesContextType>(defaultContext);

export const useFavorites = () => useContext(FavoritesContext);

interface FavoritesProviderProps {
  children: ReactNode;
}

// Local storage key for favorites
const STORAGE_KEY = 'mtg_card_favorites';

export const FavoritesProvider: React.FC<FavoritesProviderProps> = ({ children }) => {
  const [favorites, setFavorites] = useState<Card[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Load favorites from localStorage on initial render
  useEffect(() => {
    try {
      const storedFavorites = localStorage.getItem(STORAGE_KEY);
      
      if (storedFavorites) {
        const parsedFavorites = JSON.parse(storedFavorites);
        if (Array.isArray(parsedFavorites)) {
          setFavorites(parsedFavorites);
          console.log('Loaded favorites from localStorage:', parsedFavorites.length);
        } else {
          console.error('Stored favorites is not an array, resetting');
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error('Error loading favorites from localStorage:', error);
      // Clear potentially corrupted data
      localStorage.removeItem(STORAGE_KEY);
    }
    
    setIsInitialized(true);
  }, []);
  
  // Save favorites to localStorage whenever they change
  useEffect(() => {
    // Only save if we've already loaded initial state
    if (isInitialized) {
      try {
        console.log('Saving favorites to localStorage:', favorites.length);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
      } catch (error) {
        console.error('Error saving favorites to localStorage:', error);
      }
    }
  }, [favorites, isInitialized]);
  
  const addFavorite = (card: Card) => {
    // Check if card is already in favorites
    if (!favorites.some(fav => fav.id === card.id)) {
      const newFavorites = [...favorites, card];
      setFavorites(newFavorites);
      console.log('Added card to favorites:', card.name);
    }
  };
  
  const removeFavorite = (cardId: string) => {
    setFavorites(prevFavorites => {
      const newFavorites = prevFavorites.filter(card => card.id !== cardId);
      console.log('Removed card from favorites');
      return newFavorites;
    });
  };
  
  const isFavorite = (cardId: string) => {
    return favorites.some(card => card.id === cardId);
  };
  
  return (
    <FavoritesContext.Provider 
      value={{ 
        favorites,
        addFavorite,
        removeFavorite,
        isFavorite
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};

export default FavoritesContext; 