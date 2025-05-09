/**
 * Filters module for handling card filtering
 */
const Filters = {
    // Store filter elements and callback
    elements: {
        setFilter: null,
        colorFilters: null,
        rarityFilter: null,
        typeFilter: null,
        nameFilter: null,
        resetButton: null
    },
    
    // Store filter change callback
    filterChangeCallback: null,
    
    /**
     * Initialize filters module
     * @returns {Object} - The filters module
     */
    init() {
        // Get filter elements
        this.elements = {
            setFilter: document.getElementById('set-filter'),
            colorFilters: document.querySelectorAll('.color-filter'),
            rarityFilter: document.getElementById('rarity-filter'),
            typeFilter: document.getElementById('type-filter'),
            nameFilter: document.getElementById('name-filter'),
            resetButton: document.getElementById('reset-filters')
        };
        
        // Validate that all elements exist
        if (!this.validateElements()) {
            console.error('Some filter elements could not be found');
            return this;
        }
        
        // Load sets for dropdown
        this.loadSets();
        
        // Set up event listeners
        this.setupEventListeners();
        
        return this;
    },
    
    /**
     * Validate that all required elements exist
     * @returns {Boolean} - True if all elements exist
     */
    validateElements() {
        return this.elements.setFilter && 
               this.elements.colorFilters && 
               this.elements.rarityFilter && 
               this.elements.typeFilter && 
               this.elements.nameFilter && 
               this.elements.resetButton;
    },
    
    /**
     * Load sets for the set dropdown
     */
    async loadSets() {
        try {
            const setsData = await ScryfallAPI.getSets();
            
            if (setsData?.data?.length) {
                this.populateSetDropdown(setsData.data);
            }
        } catch (error) {
            console.error('Error loading sets:', error);
            this.handleSetsLoadError(error);
        }
    },
    
    /**
     * Populate the set dropdown with sets
     * @param {Array} sets - Array of set data
     */
    populateSetDropdown(sets) {
        const { setFilter } = this.elements;
        
        if (!setFilter) {
            console.error('Set filter element not found');
            return;
        }
        
        // Sort sets by release date (newest first)
        const sortedSets = sets.sort((a, b) => 
            new Date(b.released_at) - new Date(a.released_at)
        );
        
        // Add sets to dropdown
        sortedSets.forEach(set => {
            const option = document.createElement('option');
            option.value = set.code;
            option.textContent = `${set.name} (${set.code.toUpperCase()})`;
            setFilter.appendChild(option);
        });
    },
    
    /**
     * Handle error loading sets
     * @param {Error} error - Error object
     */
    handleSetsLoadError(error) {
        const { setFilter } = this.elements;
        
        if (!setFilter) {
            console.error('Set filter element not found');
            return;
        }
        
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'Error loading sets';
        setFilter.appendChild(option);
    },
    
    /**
     * Set up event listeners for filters
     */
    setupEventListeners() {
        const { 
            setFilter, colorFilters, rarityFilter, 
            typeFilter, nameFilter, resetButton 
        } = this.elements;
        
        // Add event listeners to all filter elements
        setFilter.addEventListener('change', () => this.handleFilterChange());
        
        colorFilters.forEach(filter => {
            filter.addEventListener('change', () => this.handleFilterChange());
        });
        
        rarityFilter.addEventListener('change', () => this.handleFilterChange());
        
        // Use input event with debounce for text inputs
        typeFilter.addEventListener('input', this.debounce(() => this.handleFilterChange(), 500));
        nameFilter.addEventListener('input', this.debounce(() => this.handleFilterChange(), 500));
        
        // Reset button
        resetButton.addEventListener('click', () => this.resetFilters());
    },
    
    /**
     * Debounce function to limit how often a function is called
     * @param {Function} func - Function to debounce
     * @param {Number} wait - Wait time in milliseconds
     * @returns {Function} - Debounced function
     */
    debounce(func, wait) {
        let timeout;
        return function() {
            const context = this;
            const args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    },
    
    /**
     * Handle filter change event
     */
    handleFilterChange() {
        const filterData = this.getFilterData();
        
        // Call the callback if it exists
        if (typeof this.filterChangeCallback === 'function') {
            this.filterChangeCallback(filterData);
        }
    },
    
    /**
     * Register a callback for filter changes
     * @param {Function} callback - Function to call when filters change
     */
    onFilterChange(callback) {
        this.filterChangeCallback = callback;
    },
    
    /**
     * Get current filter data
     * @returns {Object} - Filter data
     */
    getFilterData() {
        const { 
            setFilter, colorFilters, rarityFilter, 
            typeFilter, nameFilter 
        } = this.elements;
        
        // Get selected colors
        const selectedColors = [];
        colorFilters.forEach(filter => {
            if (filter.checked) {
                selectedColors.push(filter.value);
            }
        });
        
        // Build filter data object
        return {
            set: setFilter.value,
            colors: selectedColors,
            rarity: rarityFilter.value,
            type: typeFilter.value,
            name: nameFilter.value
        };
    },
    
    /**
     * Reset all filters to default values
     */
    resetFilters() {
        const { 
            setFilter, colorFilters, rarityFilter, 
            typeFilter, nameFilter 
        } = this.elements;
        
        // Reset all filter values
        setFilter.value = '';
        
        colorFilters.forEach(filter => {
            filter.checked = false;
        });
        
        rarityFilter.value = '';
        typeFilter.value = '';
        nameFilter.value = '';
        
        // Trigger filter change event
        this.handleFilterChange();
    }
}; 