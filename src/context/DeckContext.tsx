import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Card } from '../utils/ScryfallAPI';

// Interface for deck cards with count
export interface DeckCard extends Card {
  count: number;
  column?: number;
  stackPosition?: number;
}

// Interface for a complete deck
export interface Deck {
  id: string;
  name: string;
  description: string;
  cards: DeckCard[];
  columnTitles: Record<number, string>;
  createdAt: number;
  updatedAt: number;
}

interface DeckContextType {
  decks: Deck[];
  addDeck: (deck: Omit<Deck, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateDeck: (updatedDeck: Deck) => void;
  deleteDeck: (deckId: string) => void;
  getDeck: (deckId: string) => Deck | undefined;
  resetStorage: () => void;
}

const DeckContext = createContext<DeckContextType | undefined>(undefined);

export const useDeckContext = () => {
  const context = useContext(DeckContext);
  if (!context) {
    throw new Error('useDeckContext must be used within a DeckProvider');
  }
  return context;
};

interface DeckProviderProps {
  children: ReactNode;
}

export const DeckProvider: React.FC<DeckProviderProps> = ({ children }) => {
  const [decks, setDecks] = useState<Deck[]>([]);

  // Load saved decks from localStorage on component mount
  useEffect(() => {
    try {
      // Try main storage first
      const loadFromStorage = () => {
        const savedDecks = localStorage.getItem('savedDecks');
        console.log('[DeckContext] Attempting to load savedDecks from localStorage:', savedDecks);
        
        if (savedDecks) {
          try {
            const parsedData = JSON.parse(savedDecks);
            console.log('[DeckContext] Successfully parsed data:', parsedData);
            
            // Handle new format with version number
            if (parsedData && typeof parsedData === 'object' && 'version' in parsedData && Array.isArray(parsedData.decks)) {
              console.log('[DeckContext] Loading decks from new format with version', parsedData.version);
              
              // Validate and clean decks before setting them
              const validDecks = parsedData.decks
                .filter((deck: any) => validateDeck(deck))
                .map((deck: any) => ({
                  ...deck,
                  // Ensure cards are valid and sanitized
                  cards: validateCards(deck.cards) 
                    ? deck.cards.map((card: any) => sanitizeCard(card as DeckCard))
                    : []
                }));
                
              console.log('[DeckContext] Valid decks after cleaning:', validDecks.length);
              setDecks(validDecks);
              return true;
            }
            
            // Handle old format (direct array)
            if (Array.isArray(parsedData)) {
              console.log('[DeckContext] Loading decks from old format (direct array)');
              
              // Validate and clean decks before setting them
              const validDecks = parsedData
                .filter((deck: any) => validateDeck(deck))
                .map((deck: any) => ({
                  ...deck,
                  // Ensure cards are valid and sanitized
                  cards: validateCards(deck.cards) 
                    ? deck.cards.map((card: any) => sanitizeCard(card as DeckCard))
                    : []
                }));
                
              console.log('[DeckContext] Valid decks after cleaning:', validDecks.length);
              setDecks(validDecks);
              return true;
            }
            
            console.error('[DeckContext] Parsed data is in unknown format:', parsedData);
            return false;
          } catch (error) {
            console.error('[DeckContext] Error parsing saved decks:', error);
            return false;
          }
        }
        
        console.log('[DeckContext] No saved decks found in localStorage');
        return false;
      };
      
      // Try to load from main storage
      const mainLoadSuccess = loadFromStorage();
      
      // If main storage failed, try to recover from backup
      if (!mainLoadSuccess) {
        console.log('[DeckContext] Attempting to recover from backup...');
        localStorage.removeItem('savedDecks'); // Clear corrupted main storage
        
        // Try to load from backup
        const backupDecks = localStorage.getItem('savedDecks_backup');
        if (backupDecks) {
          try {
            const parsedBackup = JSON.parse(backupDecks);
            console.log('[DeckContext] Successfully parsed backup:', parsedBackup);
            
            // Handle new format with version number
            if (parsedBackup && typeof parsedBackup === 'object' && 'version' in parsedBackup && Array.isArray(parsedBackup.decks)) {
              console.log('[DeckContext] Recovering decks from backup (new format)');
              
              // Validate and clean decks before setting them
              const validDecks = parsedBackup.decks
                .filter((deck: any) => validateDeck(deck))
                .map((deck: any) => ({
                  ...deck,
                  // Ensure cards are valid and sanitized
                  cards: validateCards(deck.cards) 
                    ? deck.cards.map((card: any) => sanitizeCard(card as DeckCard))
                    : []
                }));
                
              console.log('[DeckContext] Valid decks after cleaning backup:', validDecks.length);
              setDecks(validDecks);
              
              // Restore to main storage - but with the cleaned data
              const cleanedData = {
                version: parsedBackup.version,
                decks: validDecks
              };
              localStorage.setItem('savedDecks', JSON.stringify(cleanedData));
            } 
            // Handle old format (direct array)
            else if (Array.isArray(parsedBackup)) {
              console.log('[DeckContext] Recovering decks from backup (old format)');
              
              // Validate and clean decks before setting them
              const validDecks = parsedBackup
                .filter((deck: any) => validateDeck(deck))
                .map((deck: any) => ({
                  ...deck,
                  // Ensure cards are valid and sanitized
                  cards: validateCards(deck.cards) 
                    ? deck.cards.map((card: any) => sanitizeCard(card as DeckCard))
                    : []
                }));
                
              console.log('[DeckContext] Valid decks after cleaning backup:', validDecks.length);
              setDecks(validDecks);
              
              // Restore to main storage - but with the cleaned data
              localStorage.setItem('savedDecks', JSON.stringify(validDecks));
            } else {
              console.error('[DeckContext] Backup is in unknown format:', parsedBackup);
            }
          } catch (error) {
            console.error('[DeckContext] Error parsing backup decks:', error);
            localStorage.removeItem('savedDecks_backup'); // Clear corrupted backup
          }
        } else {
          console.log('[DeckContext] No backup found');
        }
      }
    } catch (e) {
      // Handle any other localStorage errors (like quota exceeded)
      console.error('[DeckContext] Error accessing localStorage:', e);
    }
  }, []);

  // Save decks to localStorage whenever they change
  useEffect(() => {
    if (decks.length === 0) {
      // Don't save empty deck arrays to localStorage
      return;
    }
    
    try {
      // Add a version number to our data to help with future migrations
      const dataToSave = {
        version: 1,
        decks: decks
      };
      
      console.log('[DeckContext] Preparing to save decks:', dataToSave);
      
      // First test if we can serialize
      const serialized = JSON.stringify(dataToSave);
      
      // If serialization successful, save to localStorage
      localStorage.setItem('savedDecks', serialized);
      console.log('[DeckContext] Decks saved successfully');
      
      // Also save as backup in case the main one gets corrupted
      localStorage.setItem('savedDecks_backup', serialized);
    } catch (error) {
      console.error('[DeckContext] Error saving decks to localStorage:', error);
      
      // Try to identify problematic deck
      decks.forEach((deck, index) => {
        try {
          const testSerialize = JSON.stringify(deck);
          console.log(`[DeckContext] Deck ${index} (${deck.name}) serializes OK`);
        } catch (e) {
          console.error(`[DeckContext] Deck ${index} (${deck.name}) fails to serialize:`, e);
        }
      });
    }
  }, [decks]);

  // Helper function to validate a deck before loading
  const validateDeck = (deck: any): boolean => {
    if (!deck) return false;
    if (typeof deck !== 'object') return false;
    if (!deck.id || typeof deck.id !== 'string') return false;
    if (!deck.name || typeof deck.name !== 'string') return false;
    if (!Array.isArray(deck.cards)) return false;
    
    // Basic validation passed
    return true;
  };

  // Helper function to validate cards in a deck before loading
  const validateCards = (cards: any[]): boolean => {
    if (!Array.isArray(cards)) return false;
    
    // Check that all cards have at least id, name, and count
    for (const card of cards) {
      if (!card.id || !card.name || typeof card.count !== 'number') {
        return false;
      }
    }
    
    return true;
  };

  // Enhanced sanitizeCard function to handle more edge cases
  const sanitizeCard = (card: DeckCard): DeckCard => {
    // Build a basic safe card object with all the required properties
    const safeCard: Partial<DeckCard> = {
      id: card.id || `card_${Math.random().toString(36).substr(2, 9)}`, // Fallback ID if missing
      name: card.name || 'Unknown Card',
      count: typeof card.count === 'number' ? card.count : 1, // Default to 1 if count is missing
      column: typeof card.column === 'number' ? card.column : 0,
      stackPosition: typeof card.stackPosition === 'number' ? card.stackPosition : 0,
    };
    
    // Copy other common properties if they exist
    if (card.type_line) safeCard.type_line = card.type_line;
    if (card.mana_cost) safeCard.mana_cost = card.mana_cost;
    if (card.oracle_text) safeCard.oracle_text = card.oracle_text;
    if (card.rarity) safeCard.rarity = card.rarity;
    if (card.set) safeCard.set = card.set;
    if (card.collector_number) safeCard.collector_number = card.collector_number;
    
    // Handle image URIs safely
    if (card.image_uris && typeof card.image_uris === 'object') {
      const safeImageUris: Record<string, string> = {};
      
      // Only copy string values from image_uris
      for (const [key, value] of Object.entries(card.image_uris)) {
        if (typeof value === 'string') {
          safeImageUris[key] = value;
        }
      }
      
      safeCard.image_uris = safeImageUris;
    }
    
    // Handle card faces if present
    if (card.card_faces && Array.isArray(card.card_faces)) {
      // TypeScript interface for card faces is minimal, so we need to carefully copy properties
      safeCard.card_faces = card.card_faces.map(face => {
        const safeFace: any = {};
        
        // Image URIs are the only defined property in the interface
        if (face.image_uris && typeof face.image_uris === 'object') {
          const safeFaceImageUris: Record<string, string> = {};
          
          // Only copy string values from image_uris
          for (const [key, value] of Object.entries(face.image_uris)) {
            if (typeof value === 'string') {
              safeFaceImageUris[key] = value;
            }
          }
          
          safeFace.image_uris = safeFaceImageUris;
        }
        
        // These are common properties but we need to check if they exist
        // We use the any indexer in the Card interface to access them
        const faceProps = ['name', 'type_line', 'oracle_text', 'mana_cost'];
        for (const prop of faceProps) {
          if (prop in face && typeof face[prop as keyof typeof face] === 'string') {
            safeFace[prop] = face[prop as keyof typeof face];
          }
        }
        
        return safeFace;
      });
    }
    
    return safeCard as DeckCard;
  };

  const addDeck = (deck: Omit<Deck, 'id' | 'createdAt' | 'updatedAt'>) => {
    const timestamp = Date.now();
    
    // Create a safe copy of the cards using the helper function
    const sanitizedCards = deck.cards.map(sanitizeCard);
    
    const newDeck: Deck = {
      ...deck,
      cards: sanitizedCards,
      id: `deck_${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    
    console.log('[DeckContext] Adding new deck with sanitized cards:', newDeck);
    setDecks(prevDecks => [...prevDecks, newDeck]);
  };

  const updateDeck = (updatedDeck: Deck) => {
    // Sanitize the cards in the updated deck
    const sanitizedDeck = {
      ...updatedDeck,
      cards: updatedDeck.cards.map(sanitizeCard),
      updatedAt: Date.now()
    };
    
    console.log('[DeckContext] Updating deck with sanitized cards:', sanitizedDeck);
    setDecks(prevDecks => prevDecks.map(deck => 
      deck.id === updatedDeck.id ? sanitizedDeck : deck
    ));
  };

  const deleteDeck = (deckId: string) => {
    setDecks(prevDecks => prevDecks.filter(deck => deck.id !== deckId));
  };

  const getDeck = (deckId: string) => {
    return decks.find(deck => deck.id === deckId);
  };

  const resetStorage = () => {
    console.log('[DeckContext] Resetting all deck storage');
    
    // Clear all deck-related items from localStorage
    localStorage.removeItem('savedDecks');
    localStorage.removeItem('savedDecks_backup');
    
    // Reset state
    setDecks([]);
    
    // Confirm to console
    console.log('[DeckContext] Storage reset complete');
    
    // Return true to indicate success
    return true;
  };

  return (
    <DeckContext.Provider value={{ decks, addDeck, updateDeck, deleteDeck, getDeck, resetStorage }}>
      {children}
    </DeckContext.Provider>
  );
};

export default DeckContext; 