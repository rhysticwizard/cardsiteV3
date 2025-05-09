import React, { useState, useEffect } from 'react';
import Card from './Card';
import ScryfallAPI, { Card as CardType, CardsResponse } from '../../utils/ScryfallAPI';

interface CardGroup {
  date: string;
  cards: CardType[];
}

const Spoilers: React.FC = () => {
  const [cards, setCards] = useState<CardType[]>([]);
  const [groupedCards, setGroupedCards] = useState<CardGroup[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);

  // Load initial cards
  useEffect(() => {
    loadInitialCards();
  }, []);

  // Group cards by release date whenever cards array changes
  useEffect(() => {
    if (cards.length > 0) {
      setGroupedCards(groupCardsByReleaseDate(cards));
    }
  }, [cards]);

  // Group cards by their release date
  const groupCardsByReleaseDate = (cards: CardType[]): CardGroup[] => {
    const groups: { [key: string]: CardType[] } = {};
    
    // Sort cards by released_at date (newest first)
    const sortedCards = [...cards].sort((a, b) => {
      const dateA = a.released_at ? new Date(a.released_at).getTime() : 0;
      const dateB = b.released_at ? new Date(b.released_at).getTime() : 0;
      return dateB - dateA;
    });
    
    // Group cards by date
    sortedCards.forEach(card => {
      if (!card.released_at) return;
      
      const dateObj = new Date(card.released_at);
      // Format as "Month Day, Year" (e.g. "September 25, 2025")
      const formattedDate = dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      if (!groups[formattedDate]) {
        groups[formattedDate] = [];
      }
      
      groups[formattedDate].push(card);
    });
    
    // Convert the grouped object to an array of CardGroup objects
    return Object.entries(groups).map(([date, cards]) => ({
      date,
      cards
    }));
  };

  const loadInitialCards = async () => {
    setLoading(true);
    setError(null);

    try {
      // Clear all caches to ensure fresh data
      ScryfallAPI.clearAllCaches();
        
      // Try to load recently added cards first (fastest option)
      updateLoadingMessage('Loading spoilers...');
      let recentCards: CardsResponse | null = null;
      try {
        recentCards = await ScryfallAPI.getRecentlyAddedCards();
      } catch (error) {
        console.warn('Failed to load recently added cards:', error);
        recentCards = { data: [], has_more: false };
      }
        
      if (recentCards && recentCards.data && recentCards.data.length > 0) {
        // Set cards and pagination data
        setCards(recentCards.data);
        setHasMore(recentCards.has_more || false);
        setCurrentPage(1);
        setLoading(false);
        return;
      }
        
      // Fallback to standard method
      updateLoadingMessage('Loading latest spoilers...');
      let spoilers: CardsResponse | null = null;
      try {
        spoilers = await ScryfallAPI.getLatestSpoilers();
      } catch (error) {
        console.warn('Failed to load latest spoilers:', error);
        spoilers = { data: [], has_more: false };
      }
        
      if (spoilers && spoilers.data && spoilers.data.length > 0) {
        // Set cards and pagination data
        setCards(spoilers.data);
        setHasMore(spoilers.has_more || false);
        setCurrentPage(1);
        setLoading(false);
        return;
      }
        
      // Final fallback to latest set
      updateLoadingMessage('Loading latest set cards...');
      let latestSetCards: CardsResponse | null = null;
      try {
        latestSetCards = await ScryfallAPI.getLatestSetCards();
      } catch (error) {
        console.warn('Failed to load latest set cards:', error);
        latestSetCards = { data: [], has_more: false };
      }
        
      if (latestSetCards && latestSetCards.data && latestSetCards.data.length > 0) {
        // Set cards and pagination data
        setCards(latestSetCards.data);
        setHasMore(latestSetCards.has_more || false);
        setCurrentPage(1);
        setLoading(false);
        return;
      }
        
      // If all methods fail, show no results
      setCards([]);
      setHasMore(false);
      setLoading(false);
    } catch (error) {
      console.error('Error loading initial cards:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
      setLoading(false);
    }
  };

  const loadMoreCards = async () => {
    if (!hasMore || loadingMore) return;
    
    setLoadingMore(true);
    
    try {
      // Increment page
      const nextPage = currentPage + 1;
      
      // Fetch next page
      const nextPageData = await ScryfallAPI.getPagedCards({}, nextPage);
      
      if (nextPageData?.data?.length) {
        // Add new cards to existing data
        setCards(prevCards => [...prevCards, ...nextPageData.data]);
        
        // Update has more flag
        setHasMore(nextPageData.has_more || false);
        setCurrentPage(nextPage);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading more cards:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoadingMore(false);
    }
  };

  // Helper function for updating loading message
  function updateLoadingMessage(message: string) {
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
      loadingElement.textContent = message;
    }
  }

  return (
    <div className="container">
      <main>
        {loading ? (
          <div id="loading">Loading spoilers...</div>
        ) : error ? (
          <div className="error-message">Failed to load spoilers: {error}</div>
        ) : cards.length === 0 ? (
          <div className="no-results">No spoilers found. Check back later for new spoilers.</div>
        ) : (
          <>
            {groupedCards.map((group, index) => (
              <React.Fragment key={index}>
                <h2 className="category-header">
                  Revealed {group.date}
                </h2>
                <div className="cards-grid">
                  {group.cards.map(card => (
                    <Card
                      key={card.id}
                      card={card}
                    />
                  ))}
                </div>
              </React.Fragment>
            ))}
          </>
        )}
        
        {hasMore && !loading && !error && (
          <button 
            id="load-more" 
            className="load-more-button"
            onClick={loadMoreCards}
            disabled={loadingMore}
          >
            {loadingMore ? 'Loading...' : 'Load More Spoilers'}
          </button>
        )}
      </main>
    </div>
  );
};

export default Spoilers; 