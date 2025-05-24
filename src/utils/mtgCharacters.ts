// MTG Wiki API utilities for character data from the new mtg.wiki domain
export interface WikiCategoryMembers {
  continue?: {
    cmcontinue: string;
    continue: string;
  };
  query: {
    categorymembers: Array<{
      pageid: number;
      ns: number;
      title: string;
      type: 'page' | 'subcat' | 'file';
    }>;
  };
}

export interface CharacterData {
  id: string;
  name: string;
  title: string;
  description: string;
  url: string;
  race?: string;
  plane?: string;
  type: 'page';
  originalCategory: string;
}

// Base URL for MTG Wiki API (moved to mtg.wiki hosted by Scryfall in Feb 2025)
const MTG_WIKI_API_BASE = 'https://mtg.wiki/api.php';

// Helper function to build API URLs
export const buildApiUrl = (params: Record<string, string | number>): string => {
  const urlParams = new URLSearchParams();
  urlParams.append('format', 'json');
  urlParams.append('origin', '*'); // For CORS
  
  Object.entries(params).forEach(([key, value]) => {
    urlParams.append(key, value.toString());
  });
  
  return `${MTG_WIKI_API_BASE}?${urlParams.toString()}`;
};

// Rate limiting helper
let lastApiCall = 0;
const API_RATE_LIMIT = 100; // 100ms between calls

const rateLimitedFetch = async (url: string): Promise<Response> => {
  const now = Date.now();
  const timeSinceLastCall = now - lastApiCall;
  
  if (timeSinceLastCall < API_RATE_LIMIT) {
    await new Promise(resolve => setTimeout(resolve, API_RATE_LIMIT - timeSinceLastCall));
  }
  
  lastApiCall = Date.now();
  return fetch(url);
};

// Fetch category members with pagination support
export const fetchAllCategoryMembers = async (
  categoryName: string, 
  cmtype: 'page' | 'subcat' | 'file' = 'page'
): Promise<any[]> => {
  let allMembers: any[] = [];
  let cmcontinue: string | undefined;
  
  do {
    const params: Record<string, string | number> = {
      action: 'query',
      list: 'categorymembers',
      cmtitle: `Category:${categoryName}`,
      cmtype,
      cmlimit: 500,
      cmsort: 'title',
      cmdir: 'asc'
    };
    
    if (cmcontinue) {
      params.cmcontinue = cmcontinue;
    }
    
    const url = buildApiUrl(params);
    console.log(`Fetching: ${url}`);
    
    try {
      const response = await rateLimitedFetch(url);
      
      if (!response.ok) {
        console.error(`Failed to fetch ${categoryName}:`, response.status, response.statusText);
        break;
      }
      
      const text = await response.text();
      console.log(`Raw response text for ${categoryName}:`, text.substring(0, 200) + '...');
      
      let data: any;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error(`JSON parse error for ${categoryName}:`, parseError);
        console.error('Response text:', text);
        break;
      }
      
      console.log(`Parsed data for ${categoryName}:`, data);
      
      if (!data.query) {
        console.error(`No query property in response for ${categoryName}:`, data);
        break;
      }
      
      if (!data.query.categorymembers) {
        console.warn(`No categorymembers in query for ${categoryName} (might be empty category):`, data.query);
        // Empty category is not an error, just break
        break;
      }
      
      allMembers.push(...data.query.categorymembers);
      console.log(`Added ${data.query.categorymembers.length} members for ${categoryName}`);
      
      cmcontinue = data.continue?.cmcontinue;
    } catch (error) {
      console.error(`Error fetching ${categoryName}:`, error);
      break;
    }
  } while (cmcontinue);
  
  return allMembers;
};

// Convert wiki character to our format
const convertCharacter = (character: any, originalCategory: string): CharacterData => {
  const name = character.title;
  
  return {
    id: name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
    name: name,
    title: name,
    description: `${name} from ${originalCategory}`,
    url: `https://mtg.wiki/wiki/${encodeURIComponent(name.replace(/\s/g, '_'))}`,
    race: 'unknown',
    plane: 'unknown',
    type: 'page',
    originalCategory
  };
};

// Map categories to their estimated counts
const categoryEstimates: Record<string, number> = {
  'Humans': 1200,
  'Elves': 150,
  'Goblins': 80,
  'Leonin': 45,
  'Merfolk': 90,
  'Vampires': 120,
  'Zombies': 95,
  'Spirits': 180,
  'Gods': 85,
  'Dragons': 90,
  'Angels': 75,
  'Demons': 60,
  'Constructs': 65,
  'Phyrexians': 95,
  'Planeswalker characters': 120
};

// Build initial category structure (counts only, no character data) - LAZY LOADING
export const buildOptimizedCategoryStructure = async (onProgress?: (progress: string) => void) => {
  if (onProgress) onProgress('Loading character categories...');
  
  // Return structure with estimated counts, no actual character data
  return {
    id: 'characters',
    name: 'Characters',
    type: 'category' as const,
    count: 6,
    subcategories: [
      {
        id: 'mortal-races',
        name: 'Mortal Races',
        type: 'category' as const,
        count: categoryEstimates['Humans'] + categoryEstimates['Elves'] + categoryEstimates['Goblins'] + 200,
        description: 'Living sentient beings across the multiverse',
        subcategories: [
          {
            id: 'humans',
            name: 'Humans',
            type: 'category' as const,
            count: categoryEstimates['Humans'],
            pages: [] // Empty initially - loaded on demand
          },
          {
            id: 'elves',
            name: 'Elves',
            type: 'category' as const,
            count: categoryEstimates['Elves'],
            pages: []
          },
          {
            id: 'goblins',
            name: 'Goblins',
            type: 'category' as const,
            count: categoryEstimates['Goblins'],
            pages: []
          },
          {
            id: 'beast-races',
            name: 'Beast Races',
            type: 'category' as const,
            count: categoryEstimates['Leonin'] + categoryEstimates['Merfolk'] + 60,
            pages: []
          },
          {
            id: 'exotic-races',
            name: 'Exotic Races',
            type: 'category' as const,
            count: 150,
            pages: []
          }
        ]
      },
      {
        id: 'artificial-beings',
        name: 'Artificial & Constructed',
        type: 'category' as const,
        count: categoryEstimates['Constructs'] + categoryEstimates['Phyrexians'],
        description: 'Created beings, artifacts, and mechanical entities',
        subcategories: [
          {
            id: 'constructs',
            name: 'Constructs & Golems',
            type: 'category' as const,
            count: categoryEstimates['Constructs'],
            pages: []
          },
          {
            id: 'phyrexians',
            name: 'Phyrexians',
            type: 'category' as const,
            count: categoryEstimates['Phyrexians'],
            pages: []
          }
        ]
      },
      {
        id: 'undead-spirits',
        name: 'Undead & Spirits',
        type: 'category' as const,
        count: categoryEstimates['Vampires'] + categoryEstimates['Zombies'] + categoryEstimates['Spirits'],
        description: 'Beings that have died, transcended, or exist in spiritual form',
        subcategories: [
          {
            id: 'vampires',
            name: 'Vampires',
            type: 'category' as const,
            count: categoryEstimates['Vampires'],
            pages: []
          },
          {
            id: 'zombies',
            name: 'Zombies & Reanimated',
            type: 'category' as const,
            count: categoryEstimates['Zombies'],
            pages: []
          },
          {
            id: 'spirits',
            name: 'Spirits & Ghosts',
            type: 'category' as const,
            count: categoryEstimates['Spirits'],
            pages: []
          }
        ]
      },
      {
        id: 'divine-legendary',
        name: 'Divine & Legendary Beings',
        type: 'category' as const,
        count: categoryEstimates['Gods'] + categoryEstimates['Dragons'] + categoryEstimates['Angels'] + categoryEstimates['Demons'],
        description: 'Gods, elder dragons, angels, demons, and other legendary entities',
        subcategories: [
          {
            id: 'gods',
            name: 'Gods & Deities',
            type: 'category' as const,
            count: categoryEstimates['Gods'],
            pages: []
          },
          {
            id: 'dragons',
            name: 'Elder Dragons & Legendary Dragons',
            type: 'category' as const,
            count: categoryEstimates['Dragons'],
            pages: []
          },
          {
            id: 'celestial-beings',
            name: 'Angels & Celestial Beings',
            type: 'category' as const,
            count: categoryEstimates['Angels'],
            pages: []
          },
          {
            id: 'demons-devils',
            name: 'Demons & Fiends',
            type: 'category' as const,
            count: categoryEstimates['Demons'],
            pages: []
          }
        ]
      },
      {
        id: 'planeswalkers',
        name: 'Planeswalkers',
        type: 'category' as const,
        count: categoryEstimates['Planeswalker characters'],
        description: 'Beings who can travel between planes',
        pages: [] // Empty initially - loaded on demand
      },
      {
        id: 'planes-origins',
        name: 'By Plane of Origin',
        type: 'category' as const,
        count: 800, // Estimated total across all planes
        description: 'Characters organized by their home plane or world',
        subcategories: [
          {
            id: 'major-planes',
            name: 'Major Planes',
            type: 'category' as const,
            count: 450,
            pages: []
          },
          {
            id: 'recent-planes',
            name: 'Recent Planes',
            type: 'category' as const,
            count: 250,
            pages: []
          },
          {
            id: 'classic-planes',
            name: 'Classic Planes',
            type: 'category' as const,
            count: 100,
            pages: []
          }
        ]
      }
    ]
  };
};

// New function to load characters for a specific category (lazy loading)
export const loadCharactersForCategory = async (
  categoryId: string, 
  onProgress?: (progress: string) => void
): Promise<CharacterData[]> => {
  if (onProgress) onProgress(`Loading ${categoryId} characters...`);
  
  // Map category IDs to MTG Wiki categories
  const categoryMapping: Record<string, string[]> = {
    'humans': ['Humans'],
    'elves': ['Elves', 'Half-Elves', 'Devkarin'],
    'goblins': ['Goblins', 'Akki'],
    'beast-races': ['Leonin', 'Nacatl', 'Catfolk', 'Cat Warriors', 'Merfolk', 'River Heralds', 'Tritons', 'Minotaurs', 'Aven', 'Birdfolk'],
    'exotic-races': ['Vedalken', 'Kor', 'Dwarves', 'Giants', 'Centaurs', 'Cyclopes', 'Kithkin', 'Moonfolk', 'Orcs', 'Ogres'],
    'constructs': ['Constructs', 'Golems', 'Dragon Engines', 'Robots', 'Thopters', 'Scarecrows', 'Wickerfolk', 'Myr'],
    'phyrexians': ['Phyrexians', 'New Phyrexia Praetors', 'New Phyrexia thanes'],
    'vampires': ['Vampires'],
    'zombies': ['Zombies', 'Eternals', 'Liches', 'Returned'],
    'spirits': ['Spirits', 'Geists', 'Kamigawa kami', 'Kamigawa dragon spirits', 'Kamigawa oni', 'Skeletons', 'Specters', 'Shades'],
    'gods': ['Gods', 'Theros gods', 'Kaldheim gods', 'Kamigawa gods', 'Amonkhet gods'],
    'dragons': ['Dragons', 'Arcavios elder dragons', 'Dominaria elder dragons', 'Tarkir elder dragons'],
    'celestial-beings': ['Angels', 'Archangels', 'Kaldheim valkyries'],
    'demons-devils': ['Demons', 'Devils'],
    'planeswalkers': ['Planeswalker characters', 'Desparked Planeswalkers', 'Nine Titans'],
    'major-planes': ['Dominaria characters', 'Ravnica characters', 'Innistrad characters', 'Kamigawa characters', 'Zendikar characters', 'Theros characters', 'Ixalan characters'],
    'recent-planes': ['Bloomburrow characters', 'New Capenna characters', 'Kaldheim characters', 'Duskmourn characters'],
    'classic-planes': ['Mirrodin characters', 'Thunder Junction characters', 'Tarkir characters']
  };

  const categories = categoryMapping[categoryId] || [];
  if (categories.length === 0) {
    console.warn(`No categories mapped for ${categoryId}`);
    return [];
  }

  const allCharacters: CharacterData[] = [];

  for (let i = 0; i < categories.length; i++) {
    const categoryName = categories[i];
    
    if (onProgress) {
      onProgress(`Loading ${categoryName} (${i + 1}/${categories.length})`);
    }
    
    try {
      const members = await fetchAllCategoryMembers(categoryName, 'page');
      const characters = members.map(member => convertCharacter(member, categoryName));
      allCharacters.push(...characters);
      
      console.log(`Loaded ${characters.length} characters from ${categoryName}`);
    } catch (error) {
      console.error(`Error loading ${categoryName}:`, error);
    }
  }

  // Remove duplicates
  const uniqueCharacters = allCharacters.filter((character, index, self) => 
    index === self.findIndex(c => c.id === character.id)
  );

  console.log(`Total unique characters loaded for ${categoryId}: ${uniqueCharacters.length}`);
  return uniqueCharacters;
};

export {}; 