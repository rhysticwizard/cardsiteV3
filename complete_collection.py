#!/usr/bin/env python3
"""
Complete MTG Character Collection
Scrapes the remaining characters we missed and merges with existing dataset
"""

import requests
import json
import time
import re
from urllib.parse import quote, unquote
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class MTGCharacterCompleter:
    def __init__(self):
        self.base_url = "https://mtg.wiki"
        self.api_url = f"{self.base_url}/api.php"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'MTG Character Database Builder/1.0 (Educational Purpose)'
        })
        
    def get_category_members(self, category_title, include_subcats=True):
        """Get all members of a category"""
        all_members = []
        cmcontinue = None
        
        while True:
            params = {
                'action': 'query',
                'list': 'categorymembers',
                'cmtitle': category_title,
                'cmlimit': 500,
                'format': 'json'
            }
            
            if include_subcats:
                params['cmtype'] = 'page|subcat'
            else:
                params['cmtype'] = 'page'
                
            if cmcontinue:
                params['cmcontinue'] = cmcontinue
                
            try:
                response = self.session.get(self.api_url, params=params)
                response.raise_for_status()
                data = response.json()
                
                if 'query' in data and 'categorymembers' in data['query']:
                    all_members.extend(data['query']['categorymembers'])
                    
                    if 'continue' in data:
                        cmcontinue = data['continue']['cmcontinue']
                        time.sleep(0.1)  # Rate limiting
                    else:
                        break
                else:
                    break
                    
            except Exception as e:
                logger.error(f"Error fetching category {category_title}: {e}")
                break
                
        return all_members
    
    def extract_character_data(self, page_title):
        """Extract detailed character data from a page"""
        try:
            # Get page content
            params = {
                'action': 'query',
                'titles': page_title,
                'prop': 'revisions|categories',
                'rvprop': 'content',
                'format': 'json'
            }
            
            response = self.session.get(self.api_url, params=params)
            response.raise_for_status()
            data = response.json()
            
            page_data = list(data['query']['pages'].values())[0]
            
            if 'missing' in page_data:
                return None
                
            content = page_data.get('revisions', [{}])[0].get('*', '')
            categories = [cat['title'] for cat in page_data.get('categories', [])]
            
            # Extract character information
            character_info = {
                'name': page_title,
                'wiki_url': f"{self.base_url}/page/{quote(page_title.replace(' ', '_'))}",
                'description': self._extract_description(content),
                'is_planeswalker': self._is_planeswalker(content, categories),
                'colors': self._extract_colors(content),
                'planes_associated': self._extract_planes(content),
                'races': self._extract_races(content),
                'classes': self._extract_classes(content),
                'is_deceased': self._is_deceased(content, categories),
                'card_associations': self._extract_card_associations(content),
                'story_appearances': self._extract_story_appearances(content),
                'abilities': self._extract_abilities(content),
                'categories': categories,
                'raw_content': content[:1000] + '...' if len(content) > 1000 else content
            }
            
            time.sleep(0.1)  # Rate limiting
            return character_info
            
        except Exception as e:
            logger.error(f"Error extracting data for {page_title}: {e}")
            return None
    
    def _extract_description(self, content):
        """Extract character description from wiki content"""
        # Remove wiki markup and get first meaningful paragraph
        text = re.sub(r'\{\{[^}]*\}\}', '', content)  # Remove templates
        text = re.sub(r'\[\[([^|\]]*)\|?[^\]]*\]\]', r'\1', text)  # Clean links
        text = re.sub(r'==.*?==', '', text)  # Remove section headers
        text = re.sub(r'<[^>]*>', '', text)  # Remove HTML tags
        
        paragraphs = [p.strip() for p in text.split('\n') if p.strip() and not p.startswith('*')]
        return paragraphs[0] if paragraphs else ""
    
    def _is_planeswalker(self, content, categories):
        """Check if character is a planeswalker"""
        planeswalker_terms = ['planeswalker', 'sparked', 'planeswalker spark']
        content_lower = content.lower()
        
        for term in planeswalker_terms:
            if term in content_lower:
                return True
                
        return any('planeswalker' in cat.lower() for cat in categories)
    
    def _extract_colors(self, content):
        """Extract character's mana colors"""
        colors = []
        color_patterns = {
            'White': [r'\bwhite\b', r'\{W\}', r'\bplains\b'],
            'Blue': [r'\bblue\b', r'\{U\}', r'\bisland\b'],
            'Black': [r'\bblack\b', r'\{B\}', r'\bswamp\b'],
            'Red': [r'\bred\b', r'\{R\}', r'\bmountain\b'],
            'Green': [r'\bgreen\b', r'\{G\}', r'\bforest\b']
        }
        
        content_lower = content.lower()
        for color, patterns in color_patterns.items():
            if any(re.search(pattern, content_lower) for pattern in patterns):
                colors.append(color)
                
        return colors
    
    def _extract_planes(self, content):
        """Extract associated planes"""
        plane_mentions = re.findall(r'\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b', content)
        known_planes = ['Dominaria', 'Ravnica', 'Zendikar', 'Innistrad', 'Theros', 'Tarkir', 
                       'Kaladesh', 'Amonkhet', 'Ixalan', 'Eldraine', 'Ikoria', 'Kaldheim',
                       'Strixhaven', 'Kamigawa', 'New Capenna', 'Phyrexia', 'Mirrodin']
        
        found_planes = [plane for plane in plane_mentions if plane in known_planes]
        return list(set(found_planes))
    
    def _extract_races(self, content):
        """Extract character races"""
        race_patterns = [
            r'\b(Human|Elf|Dwarf|Goblin|Dragon|Angel|Demon|Vampire|Zombie|Spirit|Elemental|Beast|Cat|Merfolk|Vedalken|Viashino|Minotaur|Centaur|Giant|Troll|Orc|Artifact|Construct|Golem)\b'
        ]
        
        races = []
        for pattern in race_patterns:
            matches = re.findall(pattern, content, re.IGNORECASE)
            races.extend([match.title() for match in matches])
            
        return list(set(races))
    
    def _extract_classes(self, content):
        """Extract character classes"""
        class_patterns = [
            r'\b(Wizard|Warrior|Knight|Rogue|Cleric|Shaman|Druid|Artificer|Soldier|Scout|Assassin|Berserker|Monk|Paladin|Ranger|Sorcerer|Warlock|Barbarian|Bard)\b'
        ]
        
        classes = []
        for pattern in class_patterns:
            matches = re.findall(pattern, content, re.IGNORECASE)
            classes.extend([match.title() for match in matches])
            
        return list(set(classes))
    
    def _is_deceased(self, content, categories):
        """Check if character is deceased"""
        deceased_terms = ['died', 'death', 'killed', 'slain', 'deceased', 'dead']
        content_lower = content.lower()
        
        for term in deceased_terms:
            if term in content_lower:
                return True
                
        return any('deceased' in cat.lower() for cat in categories)
    
    def _extract_card_associations(self, content):
        """Extract associated card names"""
        # Look for card references in double brackets
        card_refs = re.findall(r'\[\[([^|\]]+)', content)
        return [ref for ref in card_refs if not ref.startswith('Category:')][:10]  # Limit to first 10
    
    def _extract_story_appearances(self, content):
        """Extract story/set appearances"""
        story_patterns = [
            r'appears in ([^.]+)',
            r'featured in ([^.]+)',
            r'story of ([^.]+)'
        ]
        
        appearances = []
        for pattern in story_patterns:
            matches = re.findall(pattern, content, re.IGNORECASE)
            appearances.extend(matches)
            
        return appearances[:5]  # Limit to first 5
    
    def _extract_abilities(self, content):
        """Extract character abilities"""
        ability_patterns = [
            r'ability to ([^.]+)',
            r'can ([^.]+)',
            r'power to ([^.]+)'
        ]
        
        abilities = []
        for pattern in ability_patterns:
            matches = re.findall(pattern, content, re.IGNORECASE)
            abilities.extend([match.strip() for match in matches])
            
        return abilities[:5]  # Limit to first 5

    def scrape_missing_characters(self):
        """Scrape all the characters we missed"""
        logger.info("🔄 Starting to scrape missing characters...")
        
        # Characters to scrape
        missing_characters = {}
        
        # 1. Get all title categories
        title_categories = [
            'Category:Ambassadors', 'Category:Barons', 'Category:Captains',
            'Category:Emperors', 'Category:Empresses', 'Category:Generals', 
            'Category:Kings', 'Category:Princes', 'Category:Princesses',
            'Category:Queens', 'Category:Viziers'
        ]
        
        logger.info(f"📋 Scraping {len(title_categories)} title categories...")
        
        for category in title_categories:
            logger.info(f"Processing {category}...")
            members = self.get_category_members(category, include_subcats=False)
            
            for member in members:
                if member['ns'] == 0:  # Main namespace only
                    character_name = member['title']
                    logger.info(f"  Extracting: {character_name}")
                    
                    character_data = self.extract_character_data(character_name)
                    if character_data:
                        missing_characters[character_name] = character_data
        
        # 2. Get Ur-Dragon specifically
        logger.info("🐉 Getting Ur-Dragon...")
        ur_dragon_data = self.extract_character_data('Ur-Dragon')
        if ur_dragon_data:
            missing_characters['Ur-Dragon'] = ur_dragon_data
        
        # 3. Load existing data and merge
        logger.info("🔗 Merging with existing dataset...")
        try:
            with open('mtg_characters_complete_20250523_132425.json', 'r', encoding='utf-8') as f:
                existing_data = json.load(f)
        except FileNotFoundError:
            logger.error("❌ Could not find existing dataset!")
            return
        
        # Merge the data
        existing_data['characters'].update(missing_characters)
        existing_data['metadata']['total_characters'] = len(existing_data['characters'])
        existing_data['metadata']['last_updated'] = datetime.now().isoformat()
        existing_data['metadata']['completion_status'] = '100% - All characters scraped'
        
        # Save complete dataset
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        complete_filename = f"mtg_characters_COMPLETE_{timestamp}.json"
        backup_filename = f"mtg_characters_COMPLETE_backup_{timestamp}.txt"
        
        # Save JSON
        with open(complete_filename, 'w', encoding='utf-8') as f:
            json.dump(existing_data, f, indent=2, ensure_ascii=False)
        
        # Save backup text file
        with open(backup_filename, 'w', encoding='utf-8') as f:
            f.write("MTG CHARACTERS COMPLETE DATABASE\n")
            f.write("=" * 50 + "\n")
            f.write(f"Generated: {datetime.now().isoformat()}\n")
            f.write(f"Total Characters: {len(existing_data['characters'])}\n")
            f.write(f"Newly Added: {len(missing_characters)}\n\n")
            
            # Write all character names
            all_chars = sorted(existing_data['characters'].keys())
            for i, char_name in enumerate(all_chars, 1):
                char_data = existing_data['characters'][char_name]
                pw_status = "🧙‍♂️" if char_data['is_planeswalker'] else "⚔️"
                f.write(f"{i:4d}. {pw_status} {char_name}\n")
        
        logger.info(f"✅ COMPLETE! Total characters: {len(existing_data['characters'])}")
        logger.info(f"📁 Saved to: {complete_filename}")
        logger.info(f"📁 Backup: {backup_filename}")
        logger.info(f"🆕 Added {len(missing_characters)} new characters")
        
        return existing_data, missing_characters

if __name__ == "__main__":
    completer = MTGCharacterCompleter()
    complete_data, new_chars = completer.scrape_missing_characters()
    
    print(f"\n🎉 COLLECTION COMPLETED!")
    print(f"Total Characters: {len(complete_data['characters'])}")
    print(f"New Characters Added: {len(new_chars)}")
    
    if new_chars:
        print(f"\n🆕 New Characters:")
        for name in sorted(new_chars.keys())[:10]:
            print(f"  • {name}")
        if len(new_chars) > 10:
            print(f"  ... and {len(new_chars) - 10} more") 