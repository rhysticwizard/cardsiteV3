import json

# Load the data
with open('mtg_characters_complete_20250523_132425.json', encoding='utf-8') as f:
    data = json.load(f)

print("🎴 MTG CHARACTER DATABASE SUMMARY")
print("=" * 50)
print(f"Total Characters: {data['metadata']['total_characters']}")
print(f"Scraped Date: {data['metadata']['scraped_date']}")
print(f"Failed Pages: {len(data['metadata']['failed_pages'])}")
print()

# Count planeswalkers
planeswalkers = [char for char in data['characters'].values() if char['is_planeswalker']]
print(f"📊 STATISTICS:")
print(f"  Planeswalkers: {len(planeswalkers)}")
print(f"  Regular Characters: {len(data['characters']) - len(planeswalkers)}")
print()

# Show sample planeswalkers
print("🔥 SAMPLE PLANESWALKERS:")
for i, (name, char) in enumerate(list(data['characters'].items())[:10]):
    if char['is_planeswalker']:
        colors = ', '.join(char['colors']) if char['colors'] else 'Colorless'
        print(f"  • {name} - Colors: {colors}")
        if i >= 4:  # Show first 5 planeswalkers
            break

print()

# Show sample regular characters
print("⚔️ SAMPLE REGULAR CHARACTERS:")
count = 0
for name, char in data['characters'].items():
    if not char['is_planeswalker']:
        deceased = " (Deceased)" if char['is_deceased'] else ""
        print(f"  • {name}{deceased}")
        count += 1
        if count >= 5:
            break

print()

# Show data structure for one character
sample_char = list(data['characters'].values())[0]
print("📋 DATA FIELDS PER CHARACTER:")
for field in sample_char.keys():
    value = sample_char[field]
    if isinstance(value, list):
        print(f"  • {field}: List with {len(value)} items")
    elif isinstance(value, dict):
        print(f"  • {field}: Dict with {len(value)} keys")
    elif isinstance(value, str):
        print(f"  • {field}: String ({len(value)} chars)")
    else:
        print(f"  • {field}: {type(value).__name__}") 