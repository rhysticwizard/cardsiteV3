#!/usr/bin/env python3
"""
MTG Character Image Scraper
Scrapes character images from MTG Wiki and updates our character database
"""

import requests
import json
import time
import re
import os
from urllib.parse import urljoin, urlparse
from datetime import datetime
import logging
from typing import Dict, List, Any, Optional
from PIL import Image
import io

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('mtg_image_scraper.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class MTGImageScraper:
    def __init__(self):
        self.base_url = "https://mtg.wiki"
        self.api_url = f"{self.base_url}/api.php"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'MTG Character Database Builder/1.0 (Educational Purpose)'
        })
        
        # Create images directory
        self.images_dir = "src/lore/character_images"
        os.makedirs(self.images_dir, exist_ok=True)
        
        # Keep track of downloaded images
        self.downloaded_images = set()
        
    def get_page_images(self, page_title: str) -> List[Dict[str, str]]:
        """Get all images from a wiki page"""
        try:
            # Get page content with images
            params = {
                'action': 'query',
                'titles': page_title,
                'prop': 'revisions|images',
                'rvprop': 'content',
                'format': 'json'
            }
            
            response = self.session.get(self.api_url, params=params)
            response.raise_for_status()
            data = response.json()
            
            page_data = list(data['query']['pages'].values())[0]
            
            if 'missing' in page_data:
                return []
            
            # Get page content to find main image
            content = page_data.get('revisions', [{}])[0].get('*', '')
            
            # Get all images on the page
            page_images = page_data.get('images', [])
            
            # Find the main character image
            main_image = self._find_main_character_image(content, page_images)
            
            if main_image:
                image_url = self._get_image_url(main_image)
                if image_url:
                    return [{
                        'title': main_image,
                        'url': image_url,
                        'type': 'main'
                    }]
            
            return []
            
        except Exception as e:
            logger.error(f"Error getting images for {page_title}: {e}")
            return []
    
    def _find_main_character_image(self, content: str, page_images: List[Dict]) -> Optional[str]:
        """Find the main character image from page content"""
        # Look for infobox image first (most common for character pages)
        infobox_patterns = [
            r'\|\s*image\s*=\s*([^|\n]+)',
            r'\|\s*Image\s*=\s*([^|\n]+)',
            r'\{\{[Ii]nfobox[^}]*\|\s*image\s*=\s*([^|\n}]+)',
        ]
        
        for pattern in infobox_patterns:
            match = re.search(pattern, content, re.IGNORECASE)
            if match:
                image_name = match.group(1).strip()
                # Clean up the image name
                image_name = re.sub(r'\|.*$', '', image_name)  # Remove pipe and everything after
                image_name = image_name.replace('[[', '').replace(']]', '')
                
                # Make sure it starts with "File:" if it doesn't already
                if not image_name.lower().startswith('file:'):
                    image_name = f"File:{image_name}"
                
                return image_name
        
        # Look for first image in content that looks like character art
        image_patterns = [
            r'\[\[File:([^|\]]+\.(jpg|jpeg|png|gif))[^|\]]*\|[^|\]]*thumb[^|\]]*\]\]',
            r'\[\[File:([^|\]]+\.(jpg|jpeg|png|gif))',
        ]
        
        for pattern in image_patterns:
            matches = re.findall(pattern, content, re.IGNORECASE)
            for match in matches:
                image_name = match[0] if isinstance(match, tuple) else match
                if self._is_character_image(image_name):
                    return f"File:{image_name}"
        
        # Fallback: use first image from the page
        if page_images:
            for img in page_images:
                img_title = img['title']
                if self._is_character_image(img_title):
                    return img_title
        
        return None
    
    def _is_character_image(self, image_name: str) -> bool:
        """Check if image is likely a character image"""
        image_lower = image_name.lower()
        
        # Skip common non-character images
        skip_terms = [
            'symbol', 'icon', 'logo', 'mana', 'set_symbol', 'expansion',
            'background', 'pattern', 'texture', 'border', 'frame',
            'commons', 'uncommons', 'rares', 'mythics'
        ]
        
        for term in skip_terms:
            if term in image_lower:
                return False
        
        # Prefer character-related terms
        character_terms = [
            'portrait', 'character', 'artwork', 'art', '.jpg', '.jpeg', '.png'
        ]
        
        return any(term in image_lower for term in character_terms)
    
    def _get_image_url(self, image_title: str) -> Optional[str]:
        """Get the actual URL of an image file"""
        try:
            params = {
                'action': 'query',
                'titles': image_title,
                'prop': 'imageinfo',
                'iiprop': 'url|size',
                'format': 'json'
            }
            
            response = self.session.get(self.api_url, params=params)
            response.raise_for_status()
            data = response.json()
            
            page_data = list(data['query']['pages'].values())[0]
            
            if 'imageinfo' in page_data and page_data['imageinfo']:
                return page_data['imageinfo'][0]['url']
            
            return None
            
        except Exception as e:
            logger.error(f"Error getting image URL for {image_title}: {e}")
            return None
    
    def download_image(self, image_url: str, character_name: str) -> Optional[str]:
        """Download an image and save it locally"""
        try:
            # Create safe filename
            safe_name = re.sub(r'[^\w\-_.]', '_', character_name)
            safe_name = re.sub(r'_+', '_', safe_name)
            
            # Get file extension from URL
            parsed_url = urlparse(image_url)
            file_ext = os.path.splitext(parsed_url.path)[1]
            if not file_ext:
                file_ext = '.jpg'
            
            filename = f"{safe_name}{file_ext}"
            filepath = os.path.join(self.images_dir, filename)
            
            # Skip if already downloaded
            if filepath in self.downloaded_images:
                return f"character_images/{filename}"
            
            # Download image
            response = self.session.get(image_url, timeout=30)
            response.raise_for_status()
            
            # Verify it's an image
            try:
                img = Image.open(io.BytesIO(response.content))
                img.verify()
            except Exception:
                logger.warning(f"Invalid image data for {character_name}")
                return None
            
            # Save image
            with open(filepath, 'wb') as f:
                f.write(response.content)
            
            self.downloaded_images.add(filepath)
            logger.info(f"Downloaded image for {character_name}: {filename}")
            
            return f"character_images/{filename}"
            
        except Exception as e:
            logger.error(f"Error downloading image for {character_name}: {e}")
            return None
    
    def scrape_character_images(self, sample_size: Optional[int] = None):
        """Scrape images for all characters"""
        logger.info("🖼️ Starting character image scraping...")
        
        # Load existing character data
        try:
            with open('src/lore/mtg_characters_COMPLETE_20250523_141653.json', 'r', encoding='utf-8') as f:
                character_data = json.load(f)
        except FileNotFoundError:
            logger.error("❌ Character database not found!")
            return
        
        characters = character_data['characters']
        total_characters = len(characters)
        
        # Use sample for testing if specified
        if sample_size:
            character_items = list(characters.items())[:sample_size]
            logger.info(f"🔬 Processing sample of {sample_size} characters for testing")
        else:
            character_items = list(characters.items())
            logger.info(f"📊 Processing all {total_characters} characters")
        
        successful_downloads = 0
        failed_downloads = 0
        
        for i, (name, char_data) in enumerate(character_items, 1):
            logger.info(f"[{i}/{len(character_items)}] Processing: {name}")
            
            # Skip if already has image
            if char_data.get('image_path'):
                logger.info(f"  ✅ Already has image: {char_data['image_path']}")
                continue
            
            # Get images from wiki page
            images = self.get_page_images(name)
            
            if images:
                # Download the main image
                main_image = images[0]
                local_path = self.download_image(main_image['url'], name)
                
                if local_path:
                    # Update character data
                    char_data['image_path'] = local_path
                    char_data['image_url'] = main_image['url']
                    char_data['image_title'] = main_image['title']
                    successful_downloads += 1
                    logger.info(f"  ✅ Image downloaded: {local_path}")
                else:
                    char_data['image_path'] = None
                    failed_downloads += 1
                    logger.warning(f"  ❌ Failed to download image")
            else:
                char_data['image_path'] = None
                failed_downloads += 1
                logger.warning(f"  ❌ No image found")
            
            # Rate limiting
            time.sleep(0.2)
            
            # Save progress every 50 characters
            if i % 50 == 0:
                self._save_progress(character_data, i, len(character_items))
        
        # Final save
        self._save_final_data(character_data, successful_downloads, failed_downloads, total_characters)
    
    def _save_progress(self, character_data: Dict, processed: int, total: int):
        """Save progress to file"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        progress_file = f"mtg_characters_with_images_progress_{timestamp}.json"
        
        character_data['metadata']['last_updated'] = datetime.now().isoformat()
        character_data['metadata']['image_scraping_progress'] = f"{processed}/{total}"
        
        with open(progress_file, 'w', encoding='utf-8') as f:
            json.dump(character_data, f, indent=2, ensure_ascii=False)
        
        logger.info(f"💾 Progress saved: {processed}/{total} processed")
    
    def _save_final_data(self, character_data: Dict, successful: int, failed: int, total: int):
        """Save final data with images"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        final_file = f"mtg_characters_with_images_{timestamp}.json"
        
        # Update metadata
        character_data['metadata']['last_updated'] = datetime.now().isoformat()
        character_data['metadata']['images_scraped'] = successful
        character_data['metadata']['images_failed'] = failed
        character_data['metadata']['image_scraping_complete'] = True
        
        # Save final file
        with open(final_file, 'w', encoding='utf-8') as f:
            json.dump(character_data, f, indent=2, ensure_ascii=False)
        
        logger.info(f"✅ SCRAPING COMPLETE!")
        logger.info(f"📁 Saved to: {final_file}")
        logger.info(f"🖼️ Images downloaded: {successful}")
        logger.info(f"❌ Failed downloads: {failed}")
        logger.info(f"📊 Success rate: {(successful/total)*100:.1f}%")
        
        return final_file

if __name__ == "__main__":
    scraper = MTGImageScraper()
    
    # Test with a small sample first
    print("🔬 Testing with 10 characters first...")
    scraper.scrape_character_images(sample_size=10)
    
    # Ask user if they want to continue with full scraping
    user_input = input("\nDo you want to scrape images for ALL characters? (y/n): ")
    if user_input.lower() in ['y', 'yes']:
        print("🖼️ Starting full image scraping...")
        scraper.scrape_character_images()
    else:
        print("✋ Stopped at sample. You can run the full scraping later.") 