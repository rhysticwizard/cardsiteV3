import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Type definitions
interface Card {
  id: string;
  name: string;
  type_line: string;
  rarity: string;
  set: string;
  set_name: string;
  colors?: string[];
  image_uris?: {
    normal?: string;
    png?: string;
  };
  oracle_text?: string;
  object?: string;
  error?: boolean;
  details?: string;
}

interface RandomCardContextType {
  currentCard: Card | null;
  setCurrentCard: React.Dispatch<React.SetStateAction<Card | null>>;
  previouslyViewedCards: Card[];
  setPreviouslyViewedCards: React.Dispatch<React.SetStateAction<Card[]>>;
  selectedFilters: {
    rarity: string[];
    color: string[];
    type: string[];
  };
  setSelectedFilters: React.Dispatch<React.SetStateAction<{
    rarity: string[];
    color: string[];
    type: string[];
  }>>;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  filtersVisible: boolean;
  setFiltersVisible: React.Dispatch<React.SetStateAction<boolean>>;
}

// Create context with default values
const RandomCardContext = createContext<RandomCardContextType | undefined>(undefined);

// Context Provider component
export const RandomCardProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize state from sessionStorage if available
  const [currentCard, setCurrentCard] = useState<Card | null>(() => {
    const savedCard = sessionStorage.getItem('randomCard_currentCard');
    return savedCard ? JSON.parse(savedCard) : null;
  });
  
  const [previouslyViewedCards, setPreviouslyViewedCards] = useState<Card[]>(() => {
    const savedCards = sessionStorage.getItem('randomCard_previouslyViewedCards');
    return savedCards ? JSON.parse(savedCards) : [];
  });
  
  const [selectedFilters, setSelectedFilters] = useState<{
    rarity: string[];
    color: string[];
    type: string[];
  }>(() => {
    const savedFilters = sessionStorage.getItem('randomCard_selectedFilters');
    return savedFilters ? JSON.parse(savedFilters) : {
      rarity: [],
      color: [],
      type: []
    };
  });
  
  const [loading, setLoading] = useState<boolean>(false);
  
  const [filtersVisible, setFiltersVisible] = useState<boolean>(() => {
    const savedFiltersVisible = sessionStorage.getItem('randomCard_filtersVisible');
    return savedFiltersVisible ? JSON.parse(savedFiltersVisible) : false;
  });

  // Save state to sessionStorage whenever it changes
  useEffect(() => {
    if (currentCard) {
      sessionStorage.setItem('randomCard_currentCard', JSON.stringify(currentCard));
    }
  }, [currentCard]);

  useEffect(() => {
    if (previouslyViewedCards.length > 0) {
      sessionStorage.setItem('randomCard_previouslyViewedCards', JSON.stringify(previouslyViewedCards));
    }
  }, [previouslyViewedCards]);

  useEffect(() => {
    sessionStorage.setItem('randomCard_selectedFilters', JSON.stringify(selectedFilters));
  }, [selectedFilters]);

  useEffect(() => {
    sessionStorage.setItem('randomCard_filtersVisible', JSON.stringify(filtersVisible));
  }, [filtersVisible]);

  return (
    <RandomCardContext.Provider value={{
      currentCard,
      setCurrentCard,
      previouslyViewedCards,
      setPreviouslyViewedCards,
      selectedFilters,
      setSelectedFilters,
      loading,
      setLoading,
      filtersVisible,
      setFiltersVisible
    }}>
      {children}
    </RandomCardContext.Provider>
  );
};

// Custom hook for using the context
export const useRandomCard = (): RandomCardContextType => {
  const context = useContext(RandomCardContext);
  if (context === undefined) {
    throw new Error('useRandomCard must be used within a RandomCardProvider');
  }
  return context;
}; 