#!/usr/bin/env python3
"""
MTG Character Data Cleaner
Cleans up the scraped character data to remove wikitext markup and formatting issues
"""

import json
import re
import html
from typing import Dict, Any

def clean_wikitext_template(text: str) -> str:
    """Clean wikitext template markup from text"""
    if not text:
        return ""
    
    # If it's a template format (starts with |), extract useful info
    if text.startswith('|'):
        # Extract description or summary if available
        desc_match = re.search(r'\|description\s*=\s*([^|]+)', text)
        if desc_match:
            return clean_wikitext(desc_match.group(1).strip())
        
        # Extract summary if available
        summary_match = re.search(r'\|summary\s*=\s*([^|]+)', text)
        if summary_match:
            return clean_wikitext(summary_match.group(1).strip())
        
        # Extract any text after the template parameters
        lines = text.split('\n')
        for line in lines:
            if not line.startswith('|') and line.strip():
                return clean_wikitext(line.strip())
        
        # If no description found, return empty string
        return ""
    
    # Otherwise, clean normally
    return clean_wikitext(text)

def clean_wikitext(text: str) -> str:
    """Clean wikitext markup from text"""
    if not text:
        return ""
    
    # Decode HTML entities first
    text = html.unescape(text)
    
    # Remove bold markup '''text''' -> text
    text = re.sub(r"'''([^']+?)'''", r'\1', text)
    
    # Remove italic markup ''text'' -> text
    text = re.sub(r"''([^']+?)''", r'\1', text)
    
    # Remove wikilinks [[Link|Display]] -> Display or [[Link]] -> Link
    text = re.sub(r'\[\[([^|\]]+)\|([^\]]+)\]\]', r'\2', text)
    text = re.sub(r'\[\[([^\]]+)\]\]', r'\1', text)
    
    # Remove external links [http://example.com Display] -> Display
    text = re.sub(r'\[https?://[^\s]+ ([^\]]+)\]', r'\1', text)
    text = re.sub(r'\[https?://[^\s]+\]', '', text)
    
    # Remove references like <ref>...</ref>
    text = re.sub(r'<ref[^>]*>.*?</ref>', '', text, flags=re.DOTALL)
    text = re.sub(r'<ref[^>]*/?>', '', text)
    
    # Remove categories [[Category:...]]
    text = re.sub(r'\[\[Category:[^\]]+\]\]', '', text)
    
    # Remove templates {{...}}
    text = re.sub(r'\{\{[^}]+\}\}', '', text)
    
    # Remove HTML tags
    text = re.sub(r'<[^>]+>', '', text)
    
    # Clean up IPA and pronunciation guides
    text = re.sub(r'\(Phyrexian:[^)]+\)', '', text)
    text = re.sub(r'\(IPA:[^)]+\)', '', text)
    text = re.sub(r'IPA:\s*\[[^\]]+\]', '', text)
    
    # Remove file references
    text = re.sub(r'\[\[File:[^\]]+\]\]', '', text)
    text = re.sub(r'\[\[Image:[^\]]+\]\]', '', text)
    
    # Clean up multiple spaces and newlines
    text = re.sub(r'\s+', ' ', text)
    text = text.strip()
    
    return text

def extract_template_info(template_text: str) -> Dict[str, str]:
    """Extract information from wikitext template format"""
    info = {}
    
    if not template_text or not template_text.startswith('|'):
        return info
    
    # Extract template parameters
    params = re.findall(r'\|([^=|]+)=([^|]*)', template_text)
    
    for param, value in params:
        param = param.strip().lower()
        value = value.strip()
        
        if param in ['name', 'aka', 'title']:
            info['display_name'] = clean_wikitext(value)
        elif param in ['race', 'species']:
            info['race'] = clean_wikitext(value)
        elif param in ['birthplace', 'plane', 'origin']:
            info['plane'] = clean_wikitext(value)
        elif param in ['description', 'summary']:
            info['description'] = clean_wikitext(value)
        elif param in ['status', 'lifetime']:
            info['status'] = clean_wikitext(value)
        elif param in ['colors', 'color']:
            info['colors'] = clean_wikitext(value)
    
    return info

def get_clean_description_from_raw(raw_content: str) -> str:
    """Extract clean description from raw page content"""
    if not raw_content:
        return ""
    
    # Look for the first paragraph that's not a template or category
    lines = raw_content.split('\n')
    description_lines = []
    
    for line in lines:
        line = line.strip()
        
        # Skip empty lines, templates, categories, etc.
        if (not line or 
            line.startswith('|') or 
            line.startswith('{{') or 
            line.startswith('[[Category:') or
            line.startswith('#') or
            line.startswith('*')):
            continue
        
        # If we find a good description line, use it
        clean_line = clean_wikitext(line)
        if len(clean_line) > 20:  # Only substantial content
            description_lines.append(clean_line)
            
        # Stop after we have a good description
        if len(description_lines) >= 1 and len(clean_line) > 50:
            break
    
    return ' '.join(description_lines)

def extract_race_from_types(creature_types: list) -> str:
    """Extract race from creature types list"""
    if not creature_types:
        return None
    
    # Common MTG races that we want to prioritize
    priority_races = ['Human', 'Elf', 'Dwarf', 'Goblin', 'Dragon', 'Angel', 'Demon', 'Vampire', 
                     'Sphinx', 'Minotaur', 'Centaur', 'Leonin', 'Merfolk', 'Vedalken']
    
    for race in priority_races:
        if race in creature_types:
            return race
    
    # Return first type if no priority race found
    return creature_types[0] if creature_types else None

def extract_race_from_text(text: str) -> str:
    """Extract race from text description"""
    if not text:
        return None
    
    text_lower = text.lower()
    
    # Check for specific race mentions
    race_patterns = [
        (r'\bis a (\w+) planeswalker', 1),
        (r'\bwas a (\w+) planeswalker', 1), 
        (r'(\w+) planeswalker from', 1),
        (r'is a (\w+)', 1),
        (r'was a (\w+)', 1)
    ]
    
    for pattern, group in race_patterns:
        match = re.search(pattern, text_lower)
        if match:
            potential_race = match.group(group).title()
            # Common MTG races
            known_races = ['Human', 'Elf', 'Dwarf', 'Goblin', 'Dragon', 'Angel', 'Demon', 'Vampire', 
                          'Sphinx', 'Minotaur', 'Centaur', 'Leonin', 'Kithkin', 'Merfolk', 'Treefolk',
                          'Giant', 'Elemental', 'Spirit', 'Zombie', 'Skeleton', 'Beast', 'Avatar',
                          'Vedalken', 'Kor', 'Viashino', 'Rhox', 'Loxodon', 'Homunculus']
            if potential_race in known_races:
                return potential_race
    
    return None

def extract_plane_from_text(text: str) -> str:
    """Extract plane name from text"""
    if not text:
        return None
    
    # Common plane names
    planes = ['Dominaria', 'Ravnica', 'Zendikar', 'Innistrad', 'Theros', 'Tarkir', 'Kaladesh', 
              'Amonkhet', 'Ixalan', 'Eldraine', 'Ikoria', 'Strixhaven', 'Kaldheim', 'Capenna']
    
    text_lower = text.lower()
    for plane in planes:
        if plane.lower() in text_lower:
            return plane
    
    return None

def extract_status_from_text(text: str) -> str:
    """Extract status from text"""
    if not text:
        return None
    
    text_lower = text.lower()
    
    # Check for alive status first (more specific)
    if any(phrase in text_lower for phrase in ['is a', 'continues to', 'currently', 'still lives', 'remains active']):
        if not any(word in text_lower for word in ['deceased', 'died', 'killed', 'dead', 'was killed', 'was slain']):
            return 'Alive'
    
    # Check for deceased status
    if any(word in text_lower for word in ['deceased', 'died', 'killed', 'dead', 'was killed', 'was slain', 'death of']):
        return 'Deceased'
    elif 'compleated' in text_lower and 'un-compleated' in text_lower:
        return 'Alive'
    elif 'compleated' in text_lower:
        return 'Compleated'
    
    return None

def extract_colors_from_data(colors_data) -> str:
    """Extract colors from colors data"""
    if not colors_data:
        return None
    
    if isinstance(colors_data, list):
        return ', '.join(colors_data)
    elif isinstance(colors_data, str):
        return colors_data
    
    return None

def extract_clean_info(char_data: Dict[str, Any]) -> Dict[str, Any]:
    """Extract structured information from character data"""
    
    # Start with template info if description is template format
    template_info = {}
    description = char_data.get('description', '')
    
    if description.startswith('|'):
        template_info = extract_template_info(description)
    
    # Try to get better description from raw content
    raw_content = char_data.get('raw_content', '')
    clean_desc = get_clean_description_from_raw(raw_content)
    
    # If no good description from raw content, try biographical_info
    if not clean_desc:
        bio_info = char_data.get('biographical_info', '')
        if bio_info and not bio_info.startswith('|'):
            clean_desc = clean_wikitext(bio_info)
    
    # If still no description, use template description if available
    if not clean_desc and 'description' in template_info:
        clean_desc = template_info['description']
    
    # Extract race from multiple sources
    race = (template_info.get('race') or 
            extract_race_from_types(char_data.get('creature_types', [])) or
            extract_race_from_text(clean_desc + ' ' + raw_content))
    
    # Build final info structure
    info = {
        'clean_description': clean_desc or f"{char_data.get('name', 'Unknown')} is a character from Magic: The Gathering.",
        'race': race,
        'plane': template_info.get('plane') or extract_plane_from_text(clean_desc + ' ' + raw_content),
        'status': template_info.get('status') or extract_status_from_text(clean_desc + ' ' + raw_content),
        'colors': template_info.get('colors') or extract_colors_from_data(char_data.get('colors', []))
    }
    
    return info

def clean_character_data(input_file: str, output_file: str):
    """Clean the character data and save to new file"""
    print(f"Loading data from {input_file}...")
    
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    cleaned_characters = {}
    total_characters = len(data['characters'])
    
    print(f"Cleaning {total_characters} characters...")
    
    for i, (name, char_data) in enumerate(data['characters'].items(), 1):
        if i % 100 == 0:
            print(f"  Processed {i}/{total_characters} characters...")
        
        # Clean the character data
        cleaned_char = char_data.copy()
        
        # Extract clean info
        clean_info = extract_clean_info(char_data)
        
        # Update with cleaned data
        cleaned_char['description'] = clean_info['clean_description']
        cleaned_char['race'] = clean_info['race']
        cleaned_char['plane'] = clean_info['plane'] 
        cleaned_char['status'] = clean_info['status']
        
        # Clean other text fields
        for field in ['abilities', 'story_appearances', 'biographical_info']:
            if field in cleaned_char and cleaned_char[field]:
                if isinstance(cleaned_char[field], str):
                    cleaned_char[field] = clean_wikitext(cleaned_char[field])
        
        cleaned_characters[name] = cleaned_char
    
    # Create output data structure
    output_data = {
        'metadata': {
            'generated': data['metadata']['scraped_date'],
            'source': 'Cleaned from scraped data',
            'total_characters': len(cleaned_characters),
            'cleaned_timestamp': data['metadata']['last_updated']
        },
        'characters': cleaned_characters
    }
    
    print(f"Saving cleaned data to {output_file}...")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)
    
    print(f"✅ Successfully cleaned {total_characters} characters!")
    print(f"📁 Output saved to: {output_file}")

def main():
    input_file = 'src/lore/mtg_characters_COMPLETE_20250523_141653.json'
    output_file = 'src/lore/mtg_characters_CLEANED.json'
    
    try:
        clean_character_data(input_file, output_file)
        
        # Also create a sample for testing
        print("\nCreating sample file for testing...")
        with open(output_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Take first 50 characters for sample
        sample_chars = dict(list(data['characters'].items())[:50])
        sample_data = {
            'metadata': {
                **data['metadata'],
                'note': 'Sample of first 50 characters for testing'
            },
            'characters': sample_chars
        }
        
        sample_file = 'src/lore/mtg_characters_CLEANED_sample.json'
        with open(sample_file, 'w', encoding='utf-8') as f:
            json.dump(sample_data, f, indent=2, ensure_ascii=False)
        
        print(f"📄 Sample file created: {sample_file}")
        
    except FileNotFoundError:
        print(f"❌ Error: Could not find input file {input_file}")
        print("Please make sure you're running this from the correct directory.")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    main() 