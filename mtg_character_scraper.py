#!/usr/bin/env python3
"""
MTG Wiki Character Scraper
Extracts all MTG characters with comprehensive data from mtg.wiki
Outputs to JSON and TXT formats for character glossary and database integration
"""

import requests
import json
import time
import re
from urllib.parse import quote, unquote
from datetime import datetime
import logging
from typing import Dict, List, Any, Optional

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('mtg_scraper.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class MTGCharacterScraper:
    def __init__(self):
        self.base_url = "https://mtg.wiki"
        self.api_url = f"{self.base_url}/api.php"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'MTG Character Database Builder 1.0'
        })
        
        # Character data storage
        self.characters = {}
        self.processed_pages = set()
        self.failed_pages = []
        
        # Priority categories (planeswalkers first, secondary characters last)
        self.priority_categories = [
            'Category:Planeswalker characters',
            'Category:Gods',
            'Category:Weatherlight Crew',
            'Category:Heroes of the Realm characters',
            'Category:Characters by plane',
            'Category:Characters by color', 
            'Category:Classes',
            'Category:Races',
            'Category:Deceased',
            'Category:LGBT characters',
            'Category:Characters with disabilities',
            'Category:Twins',
            'Category:Undead characters',
            'Category:Artifact creatures',
            'Category:Enchantment creatures',
            'List of secondary characters'
        ]

    def make_api_request(self, params: Dict[str, Any], retries: int = 3) -> Optional[Dict]:
        """Make API request with error handling and rate limiting"""
        for attempt in range(retries):
            try:
                time.sleep(0.5)  # Rate limiting
                response = self.session.get(self.api_url, params=params, timeout=30)
                response.raise_for_status()
                return response.json()
            except Exception as e:
                logger.warning(f"API request failed (attempt {attempt + 1}): {e}")
                if attempt == retries - 1:
                    logger.error(f"All API attempts failed for params: {params}")
                    return None
                time.sleep(2 ** attempt)  # Exponential backoff
        return None

    def get_category_members(self, category: str, limit: int = 500) -> List[str]:
        """Get all pages in a category"""
        members = []
        cmcontinue = None
        
        while True:
            params = {
                'action': 'query',
                'list': 'categorymembers',
                'cmtitle': category,
                'cmlimit': min(limit, 500),
                'format': 'json'
            }
            
            if cmcontinue:
                params['cmcontinue'] = cmcontinue
            
            data = self.make_api_request(params)
            if not data or 'query' not in data:
                break
                
            batch_members = data['query'].get('categorymembers', [])
            members.extend([member['title'] for member in batch_members])
            
            if 'continue' not in data:
                break
            cmcontinue = data['continue'].get('cmcontinue')
            
            logger.info(f"Retrieved {len(members)} members from {category}")
            
        return members

    def get_page_content(self, page_title: str) -> Optional[Dict[str, Any]]:
        """Get full page content including wikitext and metadata"""
        params = {
            'action': 'query',
            'titles': page_title,
            'prop': 'revisions|categories|links|templates|images|extlinks',
            'rvprop': 'content|timestamp',
            'rvslots': 'main',
            'format': 'json'
        }
        
        data = self.make_api_request(params)
        if not data or 'query' not in data:
            return None
            
        pages = data['query'].get('pages', {})
        page_data = next(iter(pages.values()))
        
        if 'missing' in page_data:
            return None
            
        return page_data

    def extract_character_info(self, page_title: str, page_data: Dict[str, Any]) -> Dict[str, Any]:
        """Extract comprehensive character information from page data"""
        character_info = {
            'name': page_title,
            'url': f"{self.base_url}/page/{quote(page_title.replace(' ', '_'))}",
            'last_updated': datetime.now().isoformat(),
            'biographical_info': {},
            'abilities': [],
            'story_appearances': [],
            'card_associations': [],
            'game_mechanics': [],
            'categories': [],
            'planeswalker_type': None,
            'is_planeswalker': False,
            'is_deceased': False,
            'planes_associated': [],
            'colors': [],
            'creature_types': [],
            'description': '',
            'raw_content': ''
        }
        
        # Get categories
        categories = page_data.get('categories', [])
        character_info['categories'] = [cat['title'] for cat in categories]
        
        # Check if planeswalker
        character_info['is_planeswalker'] = any('Planeswalker' in cat['title'] for cat in categories)
        character_info['is_deceased'] = any('Deceased' in cat['title'] for cat in categories)
        
        # Get page content
        revisions = page_data.get('revisions', [])
        if revisions:
            content = revisions[0]['slots']['main']['*']
            character_info['raw_content'] = content
            
            # Extract information from wikitext
            self.parse_wikitext_content(content, character_info)
        
        # Get linked pages for story appearances and card associations
        links = page_data.get('links', [])
        character_info['linked_pages'] = [link['title'] for link in links]
        
        # Get external links
        extlinks = page_data.get('extlinks', [])
        character_info['external_links'] = [link['*'] for link in extlinks]
        
        return character_info

    def parse_wikitext_content(self, content: str, character_info: Dict[str, Any]):
        """Parse wikitext to extract structured information"""
        
        # Extract description from first paragraph
        lines = content.split('\n')
        description_lines = []
        for line in lines:
            clean_line = re.sub(r'\[\[([^\]]+)\]\]', r'\1', line)  # Remove wiki links
            clean_line = re.sub(r'\{\{[^}]+\}\}', '', clean_line)   # Remove templates
            clean_line = re.sub(r'<[^>]+>', '', clean_line)        # Remove HTML tags
            clean_line = clean_line.strip()
            
            if clean_line and not clean_line.startswith('=') and not clean_line.startswith('{'):
                description_lines.append(clean_line)
                if len(description_lines) >= 3:  # First few meaningful lines
                    break
        
        character_info['description'] = ' '.join(description_lines)
        
        # Extract infobox information
        infobox_match = re.search(r'\{\{Infobox[^}]*\}\}', content, re.DOTALL | re.IGNORECASE)
        if infobox_match:
            self.parse_infobox(infobox_match.group(0), character_info)
        
        # Extract abilities (look for ability-related sections)
        abilities = re.findall(r'(?:ability|abilities|powers?|magic)[^.]*[.!]', content, re.IGNORECASE)
        character_info['abilities'] = abilities[:10]  # Limit to first 10
        
        # Extract story appearances (look for story/book references)
        story_refs = re.findall(r'(?:appears? in|story|novel|book)[^.]*[.!]', content, re.IGNORECASE)
        character_info['story_appearances'] = story_refs[:10]
        
        # Extract plane associations
        plane_matches = re.findall(r'\[\[([^]]*(?:plane|world|realm)[^]]*)\]\]', content, re.IGNORECASE)
        character_info['planes_associated'] = list(set(plane_matches))
        
        # Extract mana colors
        color_matches = re.findall(r'\{\{([WUBRG])\}\}', content)
        character_info['colors'] = list(set(color_matches))

    def parse_infobox(self, infobox_text: str, character_info: Dict[str, Any]):
        """Parse infobox template for structured data"""
        lines = infobox_text.split('\n')
        for line in lines:
            if '=' in line:
                key, value = line.split('=', 1)
                key = key.strip(' |')
                value = value.strip()
                
                # Clean up the value
                value = re.sub(r'\[\[([^\]]+)\]\]', r'\1', value)
                value = re.sub(r'\{\{[^}]+\}\}', '', value)
                value = value.strip()
                
                if value:
                    character_info['biographical_info'][key] = value

    def process_character_page(self, page_title: str) -> Optional[Dict[str, Any]]:
        """Process a single character page"""
        if page_title in self.processed_pages:
            return None
            
        logger.info(f"Processing character: {page_title}")
        
        page_data = self.get_page_content(page_title)
        if not page_data:
            logger.warning(f"Could not retrieve page data for: {page_title}")
            self.failed_pages.append(page_title)
            return None
        
        character_info = self.extract_character_info(page_title, page_data)
        self.processed_pages.add(page_title)
        
        return character_info

    def scrape_category(self, category: str, max_chars: int = None) -> int:
        """Scrape all characters from a category"""
        logger.info(f"Scraping category: {category}")
        
        members = self.get_category_members(category)
        processed_count = 0
        
        for member in members:
            if max_chars and processed_count >= max_chars:
                break
                
            # Skip subcategories
            if member.startswith('Category:'):
                continue
                
            character_info = self.process_character_page(member)
            if character_info:
                self.characters[member] = character_info
                processed_count += 1
                
                # Progress logging
                if processed_count % 10 == 0:
                    logger.info(f"Processed {processed_count} characters from {category}")
        
        logger.info(f"Completed {category}: {processed_count} characters")
        return processed_count

    def scrape_all_characters(self, max_per_category: int = None):
        """Scrape all characters starting with priority categories"""
        logger.info("Starting comprehensive MTG character scraping...")
        
        total_processed = 0
        
        for category in self.priority_categories:
            try:
                count = self.scrape_category(category, max_per_category)
                total_processed += count
                logger.info(f"Total characters processed so far: {len(self.characters)}")
                
                # Save progress periodically
                if total_processed % 100 == 0:
                    self.save_progress()
                    
            except Exception as e:
                logger.error(f"Error processing category {category}: {e}")
                continue
        
        logger.info(f"Scraping completed! Total characters: {len(self.characters)}")

    def save_progress(self):
        """Save current progress to files"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Save JSON
        json_filename = f"mtg_characters_progress_{timestamp}.json"
        with open(json_filename, 'w', encoding='utf-8') as f:
            json.dump(self.characters, f, indent=2, ensure_ascii=False)
        logger.info(f"Progress saved to {json_filename}")

    def save_final_output(self):
        """Save final output in both JSON and TXT formats"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Save comprehensive JSON
        json_filename = f"mtg_characters_complete_{timestamp}.json"
        with open(json_filename, 'w', encoding='utf-8') as f:
            json.dump({
                'metadata': {
                    'total_characters': len(self.characters),
                    'scraped_date': datetime.now().isoformat(),
                    'failed_pages': self.failed_pages,
                    'source': 'https://mtg.wiki'
                },
                'characters': self.characters
            }, f, indent=2, ensure_ascii=False)
        
        # Save human-readable TXT backup
        txt_filename = f"mtg_characters_backup_{timestamp}.txt"
        with open(txt_filename, 'w', encoding='utf-8') as f:
            f.write("MTG CHARACTERS DATABASE BACKUP\n")
            f.write("=" * 50 + "\n\n")
            f.write(f"Total Characters: {len(self.characters)}\n")
            f.write(f"Scraped: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"Source: https://mtg.wiki\n\n")
            
            # Sort characters: planeswalkers first, then alphabetically
            sorted_chars = sorted(self.characters.items(), 
                                key=lambda x: (not x[1]['is_planeswalker'], x[0]))
            
            for name, info in sorted_chars:
                f.write(f"CHARACTER: {name}\n")
                f.write("-" * len(name) + "\n")
                f.write(f"URL: {info['url']}\n")
                f.write(f"Planeswalker: {'Yes' if info['is_planeswalker'] else 'No'}\n")
                f.write(f"Deceased: {'Yes' if info['is_deceased'] else 'No'}\n")
                
                if info['description']:
                    f.write(f"Description: {info['description'][:500]}...\n")
                
                if info['abilities']:
                    f.write(f"Abilities: {'; '.join(info['abilities'][:3])}\n")
                
                if info['planes_associated']:
                    f.write(f"Planes: {', '.join(info['planes_associated'])}\n")
                
                if info['colors']:
                    f.write(f"Colors: {', '.join(info['colors'])}\n")
                
                f.write("\n" + "="*80 + "\n\n")
        
        logger.info(f"Final output saved:")
        logger.info(f"  JSON: {json_filename}")
        logger.info(f"  TXT:  {txt_filename}")
        
        return json_filename, txt_filename

def main():
    """Main execution function"""
    scraper = MTGCharacterScraper()
    
    print("🎴 MTG Character Database Builder")
    print("=" * 50)
    print("This will scrape ALL MTG characters from mtg.wiki")
    print("Priority: Planeswalkers → Main Characters → Secondary Characters")
    print("\nOptions:")
    print("1. Full scrape (all characters - may take hours)")
    print("2. Test run (10 characters per category)")
    print("3. Planeswalkers only")
    
    choice = input("\nSelect option (1-3): ").strip()
    
    try:
        if choice == "1":
            scraper.scrape_all_characters()
        elif choice == "2":
            scraper.scrape_all_characters(max_per_category=10)
        elif choice == "3":
            scraper.scrape_category('Category:Planeswalker characters')
        else:
            print("Invalid choice. Running test mode...")
            scraper.scrape_all_characters(max_per_category=5)
        
        # Save final output
        json_file, txt_file = scraper.save_final_output()
        
        print(f"\n✅ Scraping completed!")
        print(f"📊 Total characters: {len(scraper.characters)}")
        print(f"📁 JSON output: {json_file}")
        print(f"📄 TXT backup: {txt_file}")
        
        if scraper.failed_pages:
            print(f"⚠️  Failed pages: {len(scraper.failed_pages)}")
    
    except KeyboardInterrupt:
        print("\n\n⏹️  Scraping interrupted by user")
        if scraper.characters:
            json_file, txt_file = scraper.save_final_output()
            print(f"💾 Partial data saved to {json_file}")
    
    except Exception as e:
        logger.error(f"Fatal error: {e}")
        print(f"\n❌ Error occurred: {e}")

if __name__ == "__main__":
    main() 