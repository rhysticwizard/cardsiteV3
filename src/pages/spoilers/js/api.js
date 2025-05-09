/**
 * API module for handling Scryfall API requests
 */
const ScryfallAPI = {
    // Base URL for Scryfall API
    baseUrl: 'https://api.scryfall.com',
    
    // Cache for API responses
    cache: {
        sets: null,
        recentCards: null,
        latestSet: null,
        queries: {}
    },
    
    /**
     * Generic method to fetch data from Scryfall API
     * @param {String} url - API endpoint URL
     * @param {String} cacheKey - Optional cache key to store response
     * @returns {Promise} - Promise resolving to API response data
     */
    async fetchData(url, cacheKey = null) {
        // Check cache first if cacheKey is provided
        if (cacheKey) {
            if (cacheKey.startsWith('query:')) {
                // For query caches
                const queryKey = cacheKey.substring(6);
                if (this.cache.queries[queryKey]) {
                    return this.cache.queries[queryKey];
                }
            } else if (this.cache[cacheKey]) {
                // For standard caches
                return this.cache[cacheKey];
            }
        }
        
        // Use a longer timeout (30 seconds) to prevent premature aborts
        const timeout = 30000;
        let timeoutId;
        
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
            const response = await Promise.race([fetchPromise, timeoutPromise]);
            
            // Clear the timeout since we got a response
            clearTimeout(timeoutId);
            
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
                } else {
                    // For standard caches
                    this.cache[cacheKey] = data;
                }
            }
            
            return data;
        } catch (error) {
            // Clear the timeout if there was an error
            if (timeoutId) clearTimeout(timeoutId);
            
            console.error('Error fetching data:', error);
            
            // Return empty data for timeout or abort errors instead of throwing
            if (error.name === 'AbortError' || error.message.includes('timed out')) {
                console.warn('Request timed out or was aborted, returning empty data');
                return { data: [] };
            }
            
            throw error;
        }
    },
    
    /**
     * Fetch cards based on filters
     * @param {Object} filters - Optional filters to apply
     * @returns {Promise} - Promise resolving to card data
     */
    async getLatestSpoilers(filters = {}) {
        const query = this.buildQueryFromFilters(filters);
        
        // Don't use cache for latest spoilers to ensure fresh data
        const url = `${this.baseUrl}/cards/search?q=${encodeURIComponent(query)}&order=released&dir=desc&page=1&per_page=50`;
        return this.fetchData(url);
    },
    
    /**
     * Fetch the most recently added cards to Scryfall
     * @returns {Promise} - Promise resolving to card data
     */
    async getRecentlyAddedCards() {
        // Get cards from the last 90 days for better coverage
        const date = new Date();
        date.setDate(date.getDate() - 90);
        const dateString = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
        
        const url = `${this.baseUrl}/cards/search?q=date>=${dateString}&order=released&dir=desc&page=1&per_page=50`;
        return this.fetchData(url, 'recentCards');
    },
    
    /**
     * Fetch cards from the latest set
     * @returns {Promise} - Promise resolving to card data
     */
    async getLatestSetCards() {
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
        const sortedSets = setsData.data.sort((a, b) => 
            new Date(b.released_at) - new Date(a.released_at)
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
     * @returns {Promise} - Promise resolving to sets data
     */
    async getSets() {
        return this.fetchData(`${this.baseUrl}/sets`, 'sets');
    },
    
    /**
     * Build a Scryfall query string from filter options
     * @param {Object} filters - Filter options
     * @returns {String} - Scryfall query string
     */
    buildQueryFromFilters(filters) {
        const queryParts = [];
        
        // Only add year filter if explicitly provided in filters
        if (filters.year) {
            queryParts.push(`year=${filters.year}`);
        }
        
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
        
        // If no filters provided, use a default query that gets newer cards without year restriction
        if (queryParts.length === 0) {
            // Get cards from the last 365 days by default
            const date = new Date();
            date.setDate(date.getDate() - 365);
            const dateString = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
            queryParts.push(`date>=${dateString}`);
        }
        
        return queryParts.join(' ');
    },
    
    /**
     * Search for cards by query
     * @param {String} query - Search query
     * @returns {Promise} - Promise resolving to search results
     */
    async searchCards(query) {
        if (!query) return { data: [] };
        
        // Use cache for this specific query
        const cacheKey = `query:${query}`;
        
        const url = `${this.baseUrl}/cards/search?q=${encodeURIComponent(query)}&unique=prints&order=released&dir=desc&per_page=30`;
        return this.fetchData(url, cacheKey);
    },
    
    /**
     * Clear all caches and force fresh data
     */
    clearAllCaches() {
        this.cache = {
            sets: null,
            recentCards: null,
            latestSet: null,
            queries: {}
        };
        console.log('All caches cleared');
    },
    
    /**
     * Fetch a specific page of cards based on filters
     * @param {Object} filters - Optional filters to apply
     * @param {Number} page - Page number to fetch
     * @returns {Promise} - Promise resolving to card data
     */
    async getPagedCards(filters = {}, page = 1) {
        if (page < 1) page = 1;
        
        const query = this.buildQueryFromFilters(filters);
        
        // Use cache for this specific query and page
        const cacheKey = `query:${query}-page${page}`;
        
        // Limit to 50 cards per page for better performance
        const url = `${this.baseUrl}/cards/search?q=${encodeURIComponent(query)}&order=released&dir=desc&page=${page}&per_page=50`;
        return this.fetchData(url, cacheKey);
    }
}; 