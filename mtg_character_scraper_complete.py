#!/usr/bin/env python3
"""
MTG Character Complete Data Scraper
Extracts ALL available data from MTG wiki character pages with proper cleaning
Designed to populate React component fields with clean, readable text
"""

import json
import re
import time
import html
import requests
from typing import Dict, List, Any, Optional, Tuple
from urllib.parse import quote, unquote
from datetime import datetime

class MTGCharacterScraper:
    def __init__(self):
        self.base_url = "https://mtg.wiki"
        self.api_url = f"{self.base_url}/api.php"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'MTG Character Scraper 1.0 (Educational/Personal Use)'
        })
        
        # Character categories to scrape (prioritized)
        self.categories = [
            # Priority 1: Planeswalkers
            "Category:Planeswalker_characters",
            
            # Priority 2: Major characters
            "Category:Legendary_creatures", 
            "Category:Characters",
            
            # Priority 3: Specific character types
            "Category:Human_characters",
            "Category:Elf_characters", 
            "Category:Angel_characters",
            "Category:Dragon_characters",
            "Category:Demon_characters",
            "Category:Vampire_characters",
            
            # Priority 4: Plane-specific characters
            "Category:Dominarian_characters",
            "Category:Ravnican_characters",
            "Category:Innistrad_characters",
            "Category:Zendikar_characters",
            "Category:Kaladesh_characters",
            
            # Priority 5: Story-specific
            "Category:New_Phyrexian_characters",
            "Category:Phyrexian_characters",
        ]

    def make_api_request(self, params: Dict[str, str], retries: int = 3) -> Optional[Dict]:
        """Make API request with error handling and retries"""
        for attempt in range(retries):
            try:
                response = self.session.get(self.api_url, params=params, timeout=30)
                response.raise_for_status()
                return response.json()
            except Exception as e:
                print(f"API request failed (attempt {attempt + 1}): {e}")
                if attempt < retries - 1:
                    time.sleep(2 ** attempt)
                else:
                    return None
        return None

    def get_category_members(self, category: str) -> List[str]:
        """Get all pages in a category"""
        print(f"  Getting members of {category}...")
        
        members = []
        continue_token = None
        
        while True:
            params = {
                'action': 'query',
                'list': 'categorymembers',
                'cmtitle': category,
                'cmlimit': '500',
                'format': 'json'
            }
            
            if continue_token:
                params['cmcontinue'] = continue_token
            
            data = self.make_api_request(params)
            if not data or 'query' not in data:
                break
            
            for member in data['query'].get('categorymembers', []):
                title = member['title']
                # Skip category pages, templates, and files
                if not any(title.startswith(prefix) for prefix in ['Category:', 'Template:', 'File:']):
                    members.append(title)
            
            # Check for continuation
            if 'continue' in data and 'cmcontinue' in data['continue']:
                continue_token = data['continue']['cmcontinue']
            else:
                break
            
            time.sleep(0.1)  # Rate limiting
        
        print(f"    Found {len(members)} characters")
        return members

    def clean_wikitext(self, text: str) -> str:
        """Clean wikitext markup and return readable text"""
        if not text:
            return ""
        
        # Decode HTML entities
        text = html.unescape(text)
        
        # Remove references and citations
        text = re.sub(r'<ref[^>]*>.*?</ref>', '', text, flags=re.DOTALL)
        text = re.sub(r'<ref[^>]*/?>', '', text)
        text = re.sub(r'\{\{[Rr]ef[^}]*\}\}', '', text)
        
        # Remove templates but try to extract useful content
        def template_replacer(match):
            template_content = match.group(1)
            # Handle mana symbols
            if 'mana|' in template_content.lower():
                mana_match = re.search(r'mana\|([^}]+)', template_content)
                if mana_match:
                    return f"({mana_match.group(1)})"
            # Handle daily ref and similar
            if any(x in template_content.lower() for x in ['dailyref', 'articlearchive', 'cite']):
                return ''
            # Handle card names
            if template_content.startswith('c|') or template_content.startswith('card|'):
                card_name = template_content.split('|')[1] if '|' in template_content else template_content
                return f'"{card_name}"'
            return ''
        
        text = re.sub(r'\{\{([^}]+)\}\}', template_replacer, text)
        
        # Clean wikilinks - extract display text or link target
        text = re.sub(r'\[\[([^|\]]+)\|([^\]]+)\]\]', r'\2', text)  # [[Link|Display]] -> Display
        text = re.sub(r'\[\[([^\]]+)\]\]', r'\1', text)  # [[Link]] -> Link
        
        # Remove external links but keep display text
        text = re.sub(r'\[https?://[^\s]+ ([^\]]+)\]', r'\1', text)
        text = re.sub(r'\[https?://[^\s]+\]', '', text)
        
        # Remove bold/italic markup
        text = re.sub(r"'''([^']+?)'''", r'\1', text)
        text = re.sub(r"''([^']+?)''", r'\1', text)
        
        # Remove HTML tags
        text = re.sub(r'<[^>]+>', '', text)
        
        # Remove file/image references
        text = re.sub(r'\[\[(File|Image):[^\]]+\]\]', '', text)
        
        # Remove categories
        text = re.sub(r'\[\[Category:[^\]]+\]\]', '', text)
        
        # Clean up whitespace
        text = re.sub(r'\s+', ' ', text)
        text = text.strip()
        
        return text

    def extract_section_content(self, full_content: str, section_name: str) -> str:
        """Extract content from a specific section"""
        # Match section headers
        pattern = rf'==+\s*{re.escape(section_name)}\s*==+(.*?)(?=\n==+|\Z)'
        match = re.search(pattern, full_content, re.DOTALL | re.IGNORECASE)
        
        if match:
            content = match.group(1).strip()
            return self.clean_wikitext(content)
        
        return ""

    def extract_infobox_data(self, content: str) -> Dict[str, str]:
        """Extract data from character infobox"""
        infobox_data = {}
        
        # Match infobox template
        infobox_pattern = r'\{\{(?:Infobox|Character)[^}]*\|([^}]+)\}\}'
        match = re.search(infobox_pattern, content, re.DOTALL | re.IGNORECASE)
        
        if match:
            infobox_content = match.group(1)
            
            # Extract key-value pairs
            pairs = re.findall(r'\|([^=|]+)=([^|]*)', infobox_content)
            
            for key, value in pairs:
                key = key.strip().lower()
                value = self.clean_wikitext(value.strip())
                
                if value and key not in ['image', 'caption']:
                    infobox_data[key] = value
        
        return infobox_data

    def extract_story_appearances(self, content: str) -> List[str]:
        """Extract story appearances from various sections"""
        appearances = []
        
        # Look for story sections
        story_sections = ['Story appearances', 'Appearances', 'Story', 'Fiction', 'Novels']
        
        for section in story_sections:
            section_content = self.extract_section_content(content, section)
            if section_content:
                # Split into lines and clean
                lines = section_content.split('\n')
                for line in lines:
                    line = line.strip()
                    if line and not line.startswith('*') and len(line) > 10:
                        appearances.append(line)
                    elif line.startswith('*'):
                        # Handle bullet points
                        clean_line = line[1:].strip()
                        if clean_line and len(clean_line) > 5:
                            appearances.append(clean_line)
        
        return appearances

    def extract_abilities(self, content: str) -> List[str]:
        """Extract character abilities"""
        abilities = []
        
        # Look for abilities sections
        ability_sections = ['Abilities', 'Powers', 'Magic', 'Planeswalker abilities']
        
        for section in ability_sections:
            section_content = self.extract_section_content(content, section)
            if section_content:
                # Split into sentences or paragraphs
                sentences = re.split(r'[.!?]+', section_content)
                for sentence in sentences:
                    sentence = sentence.strip()
                    if sentence and len(sentence) > 20:
                        abilities.append(sentence + '.')
        
        return abilities

    def extract_planes_associated(self, content: str) -> List[str]:
        """Extract associated planes"""
        planes = set()
        
        # Common plane names to look for
        known_planes = [
            'Dominaria', 'Ravnica', 'Zendikar', 'Innistrad', 'Theros', 'Tarkir',
            'Kaladesh', 'Amonkhet', 'Ixalan', 'Eldraine', 'Ikoria', 'Kaldheim',
            'Strixhaven', 'Capenna', 'Kamigawa', 'Mirrodin', 'New Phyrexia',
            'Alara', 'Lorwyn', 'Shadowmoor', 'Mercadia', 'Rath', 'Serra\'s Realm'
        ]
        
        content_lower = content.lower()
        for plane in known_planes:
            if plane.lower() in content_lower:
                planes.add(plane)
        
        # Also check for "plane" mentions
        plane_matches = re.findall(r'(\w+)\s+(?:plane|world)', content_lower)
        for match in plane_matches:
            if len(match) > 3:
                planes.add(match.title())
        
        return list(planes)

    def extract_creature_types(self, content: str) -> List[str]:
        """Extract creature types"""
        types = set()
        
        # Common creature types
        creature_types = [
            'Human', 'Elf', 'Dwarf', 'Goblin', 'Dragon', 'Angel', 'Demon',
            'Vampire', 'Zombie', 'Spirit', 'Elemental', 'Beast', 'Giant',
            'Wizard', 'Warrior', 'Knight', 'Cleric', 'Rogue', 'Artifact',
            'Planeswalker', 'God', 'Avatar', 'Sphinx', 'Hydra', 'Phoenix'
        ]
        
        content_lower = content.lower()
        for creature_type in creature_types:
            if creature_type.lower() in content_lower:
                types.add(creature_type)
        
        return list(types)

    def determine_colors(self, content: str) -> List[str]:
        """Determine mana colors from content"""
        colors = set()
        
        # Look for mana symbols and color mentions
        color_patterns = {
            'White': [r'\{W\}', r'white mana', r'plains', r'white magic'],
            'Blue': [r'\{U\}', r'blue mana', r'island', r'blue magic'],
            'Black': [r'\{B\}', r'black mana', r'swamp', r'black magic'],
            'Red': [r'\{R\}', r'red mana', r'mountain', r'red magic'],
            'Green': [r'\{G\}', r'green mana', r'forest', r'green magic']
        }
        
        content_lower = content.lower()
        for color, patterns in color_patterns.items():
            for pattern in patterns:
                if re.search(pattern, content_lower):
                    colors.add(color)
                    break
        
        return list(colors)

    def get_character_data(self, title: str) -> Optional[Dict[str, Any]]:
        """Get complete character data from wiki page"""
        print(f"    Scraping: {title}")
        
        # Get page content
        params = {
            'action': 'query',
            'titles': title,
            'prop': 'revisions',
            'rvprop': 'content',
            'format': 'json'
        }
        
        data = self.make_api_request(params)
        if not data or 'query' not in data:
            return None
        
        pages = data['query']['pages']
        page_data = next(iter(pages.values()))
        
        if 'revisions' not in page_data:
            return None
        
        content = page_data['revisions'][0]['content']
        
        # Extract various data
        infobox = self.extract_infobox_data(content)
        
        # Get main description (first paragraph)
        main_content = re.split(r'\n==', content)[0]  # Content before first section
        description = self.clean_wikitext(main_content)
        
        # Take first substantial paragraph as description
        paragraphs = description.split('\n\n')
        clean_description = ""
        for para in paragraphs:
            para = para.strip()
            if len(para) > 50 and not para.startswith('|'):
                clean_description = para
                break
        
        if not clean_description and description:
            # Fallback to first 500 chars
            clean_description = description[:500] + "..." if len(description) > 500 else description
        
        # Extract all other data
        story_appearances = self.extract_story_appearances(content)
        abilities = self.extract_abilities(content)
        planes = self.extract_planes_associated(content)
        creature_types = self.extract_creature_types(content)
        colors = self.determine_colors(content)
        
        # Determine planeswalker status
        is_planeswalker = any(term in content.lower() for term in ['planeswalker', 'planeswalk', 'spark'])
        
        # Extract biographical info
        biography_section = self.extract_section_content(content, 'Biography') or \
                          self.extract_section_content(content, 'Life') or \
                          self.extract_section_content(content, 'History')
        
        # Build character data
        character_data = {
            'name': title,
            'description': clean_description or f"{title} is a character from Magic: The Gathering.",
            'is_planeswalker': is_planeswalker,
            'is_deceased': any(term in content.lower() for term in ['deceased', 'died', 'death of', 'killed']),
            'colors': colors,
            'planes_associated': planes,
            'creature_types': creature_types,
            'story_appearances': story_appearances,
            'abilities': abilities,
            'biographical_info': {
                'race': infobox.get('race') or infobox.get('species'),
                'birthplace': infobox.get('birthplace') or infobox.get('origin'),
                'lifetime': infobox.get('lifetime') or infobox.get('born'),
                'death': infobox.get('death') or infobox.get('died'),
                'relatives': infobox.get('relatives') or infobox.get('family'),
            },
            'race': infobox.get('race') or infobox.get('species'),
            'plane': infobox.get('birthplace') or infobox.get('origin') or (planes[0] if planes else None),
            'status': infobox.get('status') or ('Deceased' if any(term in content.lower() for term in ['deceased', 'died']) else 'Unknown'),
            'wiki_url': f"{self.base_url}/page/{quote(title)}",
            'raw_content': content,  # Keep for debugging
            'categories': [],  # Will be filled by scraper
            'card_associations': [],  # Could be extracted if needed
            'game_mechanics': [],  # Could be extracted if needed
            'external_links': [f"{self.base_url}/page/{quote(title)}"]
        }
        
        # Clean biographical info - remove empty values
        character_data['biographical_info'] = {k: v for k, v in character_data['biographical_info'].items() if v}
        
        return character_data

    def scrape_all_characters(self, test_mode: bool = False, max_per_category: int = None) -> Dict[str, Any]:
        """Scrape all characters from all categories"""
        print("🚀 Starting MTG Character Complete Scraping...")
        
        all_characters = {}
        all_character_names = set()
        
        # Collect all unique character names
        print("\n📋 Collecting character names from categories...")
        for category in self.categories:
            try:
                members = self.get_category_members(category)
                for member in members:
                    all_character_names.add(member)
                    if test_mode and max_per_category and len(all_character_names) >= max_per_category:
                        break
            except Exception as e:
                print(f"Error processing category {category}: {e}")
                continue
        
        print(f"\n🎯 Found {len(all_character_names)} unique characters to scrape")
        
        if test_mode:
            print(f"🧪 TEST MODE: Limiting to first {max_per_category or 50} characters")
            all_character_names = list(all_character_names)[:max_per_category or 50]
        
        # Scrape each character
        print("\n🔍 Scraping character data...")
        scraped_count = 0
        
        for i, character_name in enumerate(all_character_names, 1):
            try:
                print(f"  [{i}/{len(all_character_names)}] Processing: {character_name}")
                
                character_data = self.get_character_data(character_name)
                if character_data:
                    all_characters[character_name] = character_data
                    scraped_count += 1
                
                # Rate limiting
                time.sleep(0.5)
                
                # Progress save every 100 characters
                if scraped_count > 0 and scraped_count % 100 == 0:
                    print(f"    💾 Progress save: {scraped_count} characters scraped")
                    
            except Exception as e:
                print(f"    ❌ Error scraping {character_name}: {e}")
                continue
        
        # Create final data structure
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        result = {
            'metadata': {
                'scraped_date': datetime.now().isoformat(),
                'last_updated': timestamp,
                'total_characters': len(all_characters),
                'scraper_version': '2.0_complete',
                'test_mode': test_mode
            },
            'characters': all_characters
        }
        
        print(f"\n✅ Scraping complete!")
        print(f"📊 Successfully scraped {scraped_count} characters")
        
        return result

def main():
    scraper = MTGCharacterScraper()
    
    print("MTG Character Complete Data Scraper")
    print("===================================")
    print()
    print("This scraper extracts ALL available data from MTG character pages")
    print("and structures it for your React component with clean, readable text.")
    print()
    print("Options:")
    print("1. Full scrape (all characters)")
    print("2. Test run (50 characters)")
    print("3. Planeswalkers only (100+ characters)")
    
    choice = input("\nEnter your choice (1-3): ").strip()
    
    if choice == "2":
        print("\n🧪 Running test scrape...")
        data = scraper.scrape_all_characters(test_mode=True, max_per_category=50)
        filename = f"mtg_characters_COMPLETE_TEST_{data['metadata']['last_updated']}.json"
        
    elif choice == "3":
        print("\n⚡ Scraping planeswalkers only...")
        scraper.categories = ["Category:Planeswalker_characters"]
        data = scraper.scrape_all_characters(test_mode=False)
        filename = f"mtg_characters_PLANESWALKERS_{data['metadata']['last_updated']}.json"
        
    else:
        print("\n🚀 Running FULL scrape...")
        data = scraper.scrape_all_characters(test_mode=False)
        filename = f"mtg_characters_COMPLETE_FULL_{data['metadata']['last_updated']}.json"
    
    # Save JSON
    print(f"\n💾 Saving data to {filename}...")
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    # Also save to your React app location
    react_filename = 'src/lore/mtg_characters_CLEANED_NEW.json'
    print(f"💾 Also saving to React app: {react_filename}...")
    with open(react_filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"\n🎉 SUCCESS!")
    print(f"📁 Main file: {filename}")
    print(f"📁 React file: {react_filename}")
    print(f"📊 Total characters: {len(data['characters'])}")
    print("\n💡 You can now update your React component to use the new cleaned data!")

if __name__ == "__main__":
    main() 