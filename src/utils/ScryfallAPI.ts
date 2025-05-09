/**
 * API module for handling Scryfall API requests
 */

interface Card {
  id: string;
  name: string;
  oracle_id?: string;
  released_at?: string;
  type_line?: string;
  rarity?: string;
  set?: string;
  set_name?: string;
  mana_cost?: string;
  oracle_text?: string;
  power?: string;
  toughness?: string;
  image_uris?: {
    small?: string;
    normal?: string;
    large?: string;
    png?: string;
    art_crop?: string;
    border_crop?: string;
  };
  card_faces?: Array<{
    image_uris?: {
      small?: string;
      normal?: string;
      large?: string;
      png?: string;
      art_crop?: string;
      border_crop?: string;
    };
  }>;
  legalities?: Record<string, string>;
  scryfall_uri?: string;
  [key: string]: any;
}

interface CardsResponse {
  data: Card[];
  has_more: boolean;
  next_page?: string;
}

interface ScryfallCache {
  sets: null | any;
  recentCards: null | CardsResponse;
  latestSet: null | CardsResponse;
  queries: Record<string, any>;
  cardCollection: null | Card[];
}

interface FilterOptions {
  set?: string;
  colors?: string[];
  rarity?: string;
  type?: string;
  name?: string;
}

interface FuzzySearchOptions {
  term: string;
  limit?: number;
  threshold?: number;
  levenshteinDistanceLimit?: number;
}

const ScryfallAPI = {
  // Base URL for Scryfall API
  baseUrl: 'https://api.scryfall.com',
  
  // Cache for API responses
  cache: {
    sets: null,
    recentCards: null,
    latestSet: null,
    queries: {},
    cardCollection: null
  } as ScryfallCache,
  
  /**
   * Generic method to fetch data from Scryfall API
   * @param url - API endpoint URL
   * @param cacheKey - Optional cache key to store response
   * @returns Promise resolving to API response data
   */
  async fetchData(url: string, cacheKey: string | null = null): Promise<any> {
    // Check cache first if cacheKey is provided
    if (cacheKey) {
      if (cacheKey.startsWith('query:')) {
        // For query caches
        const queryKey = cacheKey.substring(6);
        if (this.cache.queries[queryKey]) {
          return this.cache.queries[queryKey];
        }
      } else if (this.cache[cacheKey as keyof typeof this.cache]) {
        // For standard caches
        return this.cache[cacheKey as keyof typeof this.cache];
      }
    }
    
    // Use a longer timeout (30 seconds) to prevent premature aborts
    const timeout = 30000;
    let timeoutId: NodeJS.Timeout | undefined;
    
    try {
      const controller = new AbortController();
      const signal = controller.signal;
      
      // Create a timeout promise that rejects after the timeout
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          controller.abort();
          reject(new Error('Request timed out'));
        }, timeout);
      });
      
      // Create the fetch promise
      const fetchPromise = fetch(url, { 
        signal,
        headers: {
          'Accept': 'application/json'
        }
      });
      
      // Race the fetch against the timeout
      const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;
      
      // Clear the timeout since we got a response
      if (timeoutId) clearTimeout(timeoutId);
      
      if (!response.ok) {
        // If no cards found, return empty array instead of error
        if (response.status === 404) {
          return { data: [] };
        }
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Store in cache if cacheKey is provided
      if (cacheKey) {
        if (cacheKey.startsWith('query:')) {
          // For query caches
          const queryKey = cacheKey.substring(6);
          this.cache.queries[queryKey] = data;
        } else if (cacheKey === 'sets' || cacheKey === 'recentCards' || cacheKey === 'latestSet') {
          // For standard caches
          this.cache[cacheKey] = data;
        }
      }
      
      return data;
    } catch (error: any) {
      // Clear the timeout if there was an error
      if (timeoutId) clearTimeout(timeoutId);
      
      console.error('Error fetching data:', error);
      
      // Return empty data for timeout or abort errors instead of throwing
      if (error.name === 'AbortError' || (error.message && error.message.includes('timed out'))) {
        console.warn('Request timed out or was aborted, returning empty data');
        return { data: [] };
      }
      
      throw error;
    }
  },
  
  /**
   * Fetch cards based on filters
   * @param filters - Optional filters to apply
   * @returns Promise resolving to card data
   */
  async getLatestSpoilers(filters: FilterOptions = {}): Promise<CardsResponse> {
    const query = this.buildQueryFromFilters(filters);
    
    // Don't use cache for latest spoilers to ensure fresh data
    const url = `${this.baseUrl}/cards/search?q=${encodeURIComponent(query)}&order=released&dir=desc&page=1&per_page=50`;
    return this.fetchData(url);
  },
  
  /**
   * Fetch the most recently added cards to Scryfall
   * @returns Promise resolving to card data
   */
  async getRecentlyAddedCards(): Promise<CardsResponse> {
    const currentYear = new Date().getFullYear();
    // Limit to 50 cards for better performance
    const url = `${this.baseUrl}/cards/search?q=year=${currentYear}&order=released&dir=desc&page=1&per_page=50`;
    return this.fetchData(url, 'recentCards');
  },
  
  /**
   * Fetch cards from the latest set
   * @returns Promise resolving to card data
   */
  async getLatestSetCards(): Promise<CardsResponse> {
    // Check cache first
    if (this.cache.latestSet) {
      return this.cache.latestSet;
    }
    
    // First, get the latest set
    const setsData = await this.getSets();
    
    if (!setsData?.data?.length) {
      throw new Error('No sets found');
    }
    
    // Sort sets by release date (newest first)
    const sortedSets = setsData.data.sort((a: any, b: any) => 
      new Date(b.released_at).getTime() - new Date(a.released_at).getTime()
    );
    
    // Get the latest set code and fetch its cards
    const latestSetCode = sortedSets[0].code;
    // Limit to 50 cards for better performance
    const url = `${this.baseUrl}/cards/search?q=set:${latestSetCode}&order=released&dir=desc&page=1&per_page=50`;
    
    const data = await this.fetchData(url);
    this.cache.latestSet = data;
    return data;
  },
  
  /**
   * Fetch available sets for filtering
   * @returns Promise resolving to sets data
   */
  async getSets(): Promise<any> {
    return this.fetchData(`${this.baseUrl}/sets`, 'sets');
  },
  
  /**
   * Build a Scryfall query string from filter options
   * @param filters - Filter options
   * @returns Scryfall query string
   */
  buildQueryFromFilters(filters: FilterOptions): string {
    const queryParts = [];
    const currentYear = new Date().getFullYear();
    
    // Add default year filter
    queryParts.push(`year=${currentYear}`);
    
    // Add set filter
    if (filters.set) {
      queryParts.push(`set:${filters.set}`);
    }
    
    // Add color filter
    if (filters.colors?.length) {
      queryParts.push(`color:${filters.colors.join('')}`);
    }
    
    // Add rarity filter
    if (filters.rarity) {
      queryParts.push(`rarity:${filters.rarity}`);
    }
    
    // Add type filter
    if (filters.type) {
      queryParts.push(`type:"${filters.type}"`);
    }
    
    // Add name filter
    if (filters.name) {
      queryParts.push(`name:"${filters.name}"`);
    }
    
    return queryParts.join(' ');
  },
  
  /**
   * Search for cards by query
   * @param query - Search query
   * @returns Promise resolving to search results
   */
  async searchCards(query: string): Promise<CardsResponse> {
    if (!query) return { data: [], has_more: false };
    
    // Use cache for this specific query
    const cacheKey = `query:${query}`;
    
    const url = `${this.baseUrl}/cards/search?q=${encodeURIComponent(query)}&unique=cards&order=released&dir=desc&per_page=30`;
    return this.fetchData(url, cacheKey);
  },

  /**
   * Local fuzzy search for cards using Levenshtein distance
   * @param options - FuzzySearchOptions for the search
   * @returns Promise resolving to search results
   */
  async fuzzySearchCards(options: FuzzySearchOptions): Promise<Card[]> {
    if (!options.term) return [];

    const limit = options.limit || 20;
    const threshold = options.threshold || 0.4; // Higher threshold = more lenient matching
    const levenshteinLimit = options.levenshteinDistanceLimit || 3;

    // First, ensure we have a card collection to search within
    if (!this.cache.cardCollection) {
      try {
        // Try to get a good batch of cards for the local collection
        // First, look for recent cards that might be more relevant
        const recentCards = await this.getRecentlyAddedCards();
        
        // Then, fetch a batch of popular cards
        const popularCardsUrl = `${this.baseUrl}/cards/search?q=is:popular&unique=cards&order=edhrec&dir=desc&per_page=100`;
        const popularCards = await this.fetchData(popularCardsUrl);
        
        // Combine and deduplicate the cards by ID
        const allCards = [...recentCards.data, ...popularCards.data];
        const uniqueCardMap: Record<string, Card> = {};
        
        // Group cards by Oracle ID to ensure we only get one version of each card
        allCards.forEach(card => {
          // If we already have this oracle_id card and it's newer, skip this one
          if (card.oracle_id && uniqueCardMap[card.oracle_id]) {
            return;
          }
          
          // Otherwise add/replace with this card
          if (card.oracle_id) {
            uniqueCardMap[card.oracle_id] = card;
          } else {
            // Fallback to card ID if oracle_id is not available
            uniqueCardMap[card.id] = card;
          }
        });

        this.cache.cardCollection = Object.values(uniqueCardMap);
      } catch (error) {
        console.error('Error building card collection for fuzzy search:', error);
        return [];
      }
    }

    // Simple Levenshtein distance calculation
    const levenshteinDistance = (a: string, b: string): number => {
      const matrix: number[][] = [];

      // Initialize the matrix
      for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
      }
      for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
      }

      // Fill the matrix
      for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
          const cost = a[j - 1] === b[i - 1] ? 0 : 1;
          matrix[i][j] = Math.min(
            matrix[i - 1][j] + 1,     // deletion
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j - 1] + cost  // substitution
          );
        }
      }

      return matrix[b.length][a.length];
    };

    // Perform fuzzy search on the card collection
    const term = options.term.toLowerCase();
    
    // First, match directly against card names
    let results = this.cache.cardCollection
      .map(card => {
        const cardName = card.name.toLowerCase();
        const distance = levenshteinDistance(term, cardName);
        const maxLength = Math.max(term.length, cardName.length);
        const score = maxLength > 0 ? 1 - (distance / maxLength) : 0;
        
        return { card, score, distance };
      })
      .filter(result => 
        result.score > threshold && 
        result.distance <= levenshteinLimit
      )
      .sort((a, b) => b.score - a.score);
      
    // Deduplicate by Oracle ID in the results as well
    const uniqueOracleIds = new Set<string>();
    const dedupedResults = results.filter(result => {
      if (!result.card.oracle_id) return true;
      
      if (!uniqueOracleIds.has(result.card.oracle_id)) {
        uniqueOracleIds.add(result.card.oracle_id);
        return true;
      }
      
      return false;
    });
    
    return dedupedResults.slice(0, limit).map(result => result.card);
  },
  
  /**
   * Clear all caches and force fresh data
   */
  clearAllCaches(): void {
    this.cache = {
      sets: null,
      recentCards: null,
      latestSet: null,
      queries: {},
      cardCollection: null
    };
    console.log('All caches cleared');
  },
  
  /**
   * Fetch a specific page of cards based on filters
   * @param filters - Optional filters to apply
   * @param page - Page number to fetch
   * @returns Promise resolving to card data
   */
  async getPagedCards(filters: FilterOptions = {}, page = 1): Promise<CardsResponse> {
    if (page < 1) page = 1;
    
    const query = this.buildQueryFromFilters(filters);
    
    // Use cache for this specific query and page
    const cacheKey = `query:${query}-page${page}`;
    
    const url = `${this.baseUrl}/cards/search?q=${encodeURIComponent(query)}&order=released&dir=desc&page=${page}&per_page=50`;
    return this.fetchData(url, cacheKey);
  }
};

export default ScryfallAPI;
export type { Card, CardsResponse, FilterOptions, FuzzySearchOptions }; 