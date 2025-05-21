import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import SearchBar from '../../components/SearchBar';
import './styles.css';

interface Set {
  name: string;
  code: string;
  released_at: string;
  set_type: string;
  card_count: number;
  icon_svg_uri: string;
}

// Constants for local storage
const SETS_CACHE_KEY = 'mtg_sets_cache';
const SETS_CACHE_TIMESTAMP_KEY = 'mtg_sets_cache_timestamp';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

const AllSets: React.FC = () => {
  // State
  const [allSets, setAllSets] = useState<Set[]>([]);
  const [currentYear, setCurrentYear] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Refs
  const setsContainerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // API URLs
  const SCRYFALL_BASE_URL = 'https://api.scryfall.com';
  const CORS_PROXY = 'https://corsproxy.io/?';
  const [useCorsProxy, setUseCorsProxy] = useState(false);

  const getApiUrl = useCallback((endpoint: string) => {
    const baseUrl = useCorsProxy ? CORS_PROXY + encodeURIComponent(SCRYFALL_BASE_URL) : SCRYFALL_BASE_URL;
    return `${baseUrl}${endpoint}`;
  }, [useCorsProxy]);

  const getSetsUrl = useCallback(() => {
    return getApiUrl('/sets');
  }, [getApiUrl]);

  // Check if cache is valid
  const isCacheValid = useCallback(() => {
    try {
      const timestamp = localStorage.getItem(SETS_CACHE_TIMESTAMP_KEY);
      if (!timestamp) return false;
      
      const parsedTimestamp = parseInt(timestamp);
      const now = Date.now();
      
      return now - parsedTimestamp < CACHE_DURATION;
    } catch (error) {
      console.error('Error checking cache validity:', error);
      return false;
    }
  }, []);

  // Load sets from cache
  const loadSetsFromCache = useCallback(() => {
    try {
      const cachedSets = localStorage.getItem(SETS_CACHE_KEY);
      if (cachedSets) {
        const parsedSets = JSON.parse(cachedSets);
        if (Array.isArray(parsedSets) && parsedSets.length > 0) {
          console.log('Loading sets from cache');
          setAllSets(parsedSets);
          setIsLoading(false);
          setIsInitialLoad(false);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error loading from cache:', error);
      return false;
    }
  }, []);

  // Save sets to cache
  const saveSetsToCache = useCallback((sets: Set[]) => {
    try {
      localStorage.setItem(SETS_CACHE_KEY, JSON.stringify(sets));
      localStorage.setItem(SETS_CACHE_TIMESTAMP_KEY, Date.now().toString());
      console.log('Sets saved to cache');
    } catch (error) {
      console.error('Error saving to cache:', error);
    }
  }, []);

  // Fetch sets data
  const fetchSets = useCallback(async (skipCache = false) => {
    // Try to load from cache first if not skipping cache
    if (!skipCache && isCacheValid() && loadSetsFromCache()) {
      // Still fetch in background to update cache if needed
      fetchSetsInBackground();
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    // Abort any in-progress fetch
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create a new abort controller for this fetch
    abortControllerRef.current = new AbortController();
    
    try {
      const response = await fetch(getSetsUrl(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        mode: 'cors',
        signal: abortControllerRef.current.signal
      });
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.data && Array.isArray(data.data)) {
        // Sort sets by released_at date descending (newest first) as default
        const sortedSets = data.data.sort((a: Set, b: Set) => {
          return new Date(b.released_at).getTime() - new Date(a.released_at).getTime();
        });
        
        setAllSets(sortedSets);
        saveSetsToCache(sortedSets);
        
        // Small delay to ensure state updates are processed before showing content
        setTimeout(() => {
          setIsLoading(false);
          setIsInitialLoad(false);
        }, 300);
      } else {
        throw new Error('Invalid response format from API');
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Error fetching sets:', error);
        setError(`Failed to load sets. ${error.message}`);
        setIsLoading(false);
        setIsInitialLoad(false);
      }
    } finally {
      abortControllerRef.current = null;
    }
  }, [getSetsUrl, isCacheValid, loadSetsFromCache, saveSetsToCache]);

  // Fetch sets in background to update cache
  const fetchSetsInBackground = useCallback(async () => {
    // Skip if there's already a fetch in progress
    if (abortControllerRef.current) return;
    
    // Create a new abort controller for this fetch
    abortControllerRef.current = new AbortController();
    
    try {
      const response = await fetch(getSetsUrl(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        mode: 'cors',
        signal: abortControllerRef.current.signal
      });
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.data && Array.isArray(data.data)) {
        // Sort sets by released_at date descending (newest first) as default
        const sortedSets = data.data.sort((a: Set, b: Set) => {
          return new Date(b.released_at).getTime() - new Date(a.released_at).getTime();
        });
        
        saveSetsToCache(sortedSets);
        
        // Only update state if the new data is different
        if (JSON.stringify(sortedSets) !== JSON.stringify(allSets)) {
          setAllSets(sortedSets);
        }
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Error fetching sets in background:', error);
      }
    } finally {
      abortControllerRef.current = null;
    }
  }, [getSetsUrl, saveSetsToCache, allSets]);

  // Toggle CORS proxy and retry
  const toggleCorsProxyAndRetry = useCallback(() => {
    setUseCorsProxy(prev => !prev);
  }, []);

  // Use demo data
  const useDemoData = useCallback(() => {
    console.log("Loading demo data...");
    setIsDemoMode(true);
    setIsLoading(true);
    
    // Sample demo data with a few sets
    const demoSets = [
      {
        name: "The Brothers' War",
        code: "bro",
        released_at: "2022-11-18",
        set_type: "expansion",
        card_count: 287,
        icon_svg_uri: "https://svgs.scryfall.io/sets/bro.svg"
      },
      {
        name: "Dominaria United",
        code: "dmu",
        released_at: "2022-09-09",
        set_type: "expansion",
        card_count: 281,
        icon_svg_uri: "https://svgs.scryfall.io/sets/dmu.svg"
      },
      {
        name: "Streets of New Capenna",
        code: "snc",
        released_at: "2022-04-29",
        set_type: "expansion",
        card_count: 467,
        icon_svg_uri: "https://svgs.scryfall.io/sets/snc.svg"
      },
      {
        name: "Kamigawa: Neon Dynasty",
        code: "neo",
        released_at: "2022-02-18",
        set_type: "expansion",
        card_count: 302,
        icon_svg_uri: "https://svgs.scryfall.io/sets/neo.svg"
      },
      {
        name: "Innistrad: Crimson Vow",
        code: "vow",
        released_at: "2021-11-19",
        set_type: "expansion",
        card_count: 267,
        icon_svg_uri: "https://svgs.scryfall.io/sets/vow.svg"
      },
      {
        name: "Innistrad: Midnight Hunt",
        code: "mid",
        released_at: "2021-09-24",
        set_type: "expansion",
        card_count: 282,
        icon_svg_uri: "https://svgs.scryfall.io/sets/mid.svg"
      },
      {
        name: "Core Set 2021",
        code: "m21",
        released_at: "2020-07-03",
        set_type: "core",
        card_count: 274,
        icon_svg_uri: "https://svgs.scryfall.io/sets/m21.svg"
      },
      {
        name: "Modern Horizons",
        code: "mh1",
        released_at: "2019-06-14",
        set_type: "draft_innovation",
        card_count: 254,
        icon_svg_uri: "https://svgs.scryfall.io/sets/mh1.svg"
      },
      {
        name: "Modern Horizons 2",
        code: "mh2",
        released_at: "2021-06-18",
        set_type: "draft_innovation",
        card_count: 303,
        icon_svg_uri: "https://svgs.scryfall.io/sets/mh2.svg"
      },
      {
        name: "Double Masters",
        code: "2xm",
        released_at: "2020-08-07",
        set_type: "masters",
        card_count: 332,
        icon_svg_uri: "https://svgs.scryfall.io/sets/2xm.svg"
      },
      {
        name: "Commander 2021",
        code: "c21",
        released_at: "2021-04-23",
        set_type: "commander",
        card_count: 82,
        icon_svg_uri: "https://svgs.scryfall.io/sets/c21.svg"
      }
    ];
    
    // Store the demo flag in localStorage so set page can use it
    localStorage.setItem('isDemoMode', 'true');
    
    // Set the demo data
    setAllSets(demoSets);
    
    // Small delay to ensure state updates are processed before showing content
    setTimeout(() => {
      setIsLoading(false);
      setIsInitialLoad(false);
    }, 300);
  }, []);

  // Retry fetching sets
  const retryFetch = useCallback(() => {
    console.log("Retrying fetch...");
    fetchSets(true); // Skip cache on retry
  }, [fetchSets]);

  useEffect(() => {
    fetchSets();
    
    // Cleanup function to abort any in-progress fetch when component unmounts
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchSets]);
  
  // Filter and sort sets
  const getFilteredAndSortedSets = useCallback(() => {
    let filteredSets = [...allSets];
    
    // Apply year filter if set (retained as it might be used elsewhere or in future)
    if (currentYear) {
      filteredSets = filteredSets.filter(set => {
        const setYear = new Date(set.released_at).getFullYear().toString();
        return setYear === currentYear;
      });
    }
    
    // Default sort: newest first (as currentSort is removed)
    filteredSets.sort((a, b) => new Date(b.released_at).getTime() - new Date(a.released_at).getTime());
    
    return filteredSets;
  }, [allSets, currentYear]);

  // Group sets by year
  const groupSetsByYear = useCallback((sets: Set[]) => {
    const groupedSets: Record<string, Set[]> = {};
    
    sets.forEach(set => {
      const year = new Date(set.released_at).getFullYear().toString();
      if (!groupedSets[year]) {
        groupedSets[year] = [];
      }
      groupedSets[year].push(set);
    });
    
    return groupedSets;
  }, []);

  // Render set grid item
  const renderSetCard = useCallback((set: Set) => {
    return (
      <Link to={`/sets/${set.code}?name=${encodeURIComponent(set.name)}`} className="set-card" key={set.code}>
        <div className="set-logo-container">
          {set.icon_svg_uri ? (
            <img src={set.icon_svg_uri} alt={`${set.name} logo`} loading="lazy" />
          ) : (
            <div className="set-logo-placeholder"></div>
          )}
        </div>
        <div className="set-info">
          <div className="set-name">{set.name}</div>
          <div className="set-code">{set.code.toUpperCase()}</div>
          <div className="set-date">
            {new Date(set.released_at).toLocaleDateString('en-US', { 
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })}
          </div>
        </div>
      </Link>
    );
  }, []);

  // Create error display component
  const renderError = useCallback(() => (
    <div className="error">
      {error}
      <div className="error-buttons">
        <button className="retry-button" onClick={retryFetch}>
          <i className="fas fa-sync-alt"></i> Retry
        </button>
        <button className="retry-button" onClick={toggleCorsProxyAndRetry}>
          <i className="fas fa-shield-alt"></i> {useCorsProxy ? 'Disable' : 'Enable'} CORS Proxy
        </button>
        <button className="retry-button" onClick={useDemoData}>
          <i className="fas fa-database"></i> Use Demo Data
        </button>
      </div>
    </div>
  ), [error, retryFetch, toggleCorsProxyAndRetry, useCorsProxy, useDemoData]);

  // Memoized filtered and sorted sets
  const filteredAndSortedSets = useMemo(() => getFilteredAndSortedSets(), [getFilteredAndSortedSets]);
  
  // Memoized sets grouped by year
  const setsGroupedByYear = useMemo(() => groupSetsByYear(filteredAndSortedSets), [groupSetsByYear, filteredAndSortedSets]);
  
  // Memoized years sorted in descending order
  const sortedYears = useMemo(() => Object.keys(setsGroupedByYear).sort((a, b) => parseInt(b) - parseInt(a)), [setsGroupedByYear]);

  // Render sets by year - memoized to avoid unnecessary re-renders
  const renderedSetsByYear = useMemo(() => {
    if (sortedYears.length === 0 && !isLoading) {
      return (
        <div className="no-results">
          No sets match your current filters. Try different filter options.
        </div>
      );
    }
    
    return sortedYears.map(year => (
      <div key={year} className="year-container">
        <div className="year-header">{year}</div>
        <div className={'sets-grid'}>
          {setsGroupedByYear[year].map(set => (
            renderSetCard(set)
          ))}
        </div>
      </div>
    ));
  }, [sortedYears, setsGroupedByYear, renderSetCard, isLoading]);

  return (
    <main>
      <div className="search-page">
        <SearchBar />
      </div>
      <div id="sets-container" ref={setsContainerRef}>
        {isLoading && isInitialLoad ? (
          <div className="loading">
            <span>Loading cards...</span>
            <div className="loading-spinner"></div>
          </div>
        ) : error ? (
          renderError()
        ) : (
          renderedSetsByYear
        )}
      </div>
      
      {isDemoMode && (
        <div className="demo-mode-banner">
          <i className="fas fa-info-circle"></i> 
          You are viewing demo data with limited functionality.
          <button className="demo-retry-btn" onClick={() => {
            setIsDemoMode(false);
            localStorage.removeItem('isDemoMode');
            fetchSets(true); // Skip cache when switching from demo mode
          }}>
            <i className="fas fa-sync-alt"></i> Switch to Live Data
          </button>
        </div>
      )}
    </main>
  );
};

export default AllSets; 