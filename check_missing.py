import requests

# Check the missed category
api_url = 'https://mtg.wiki/api.php'
params = {
    'action': 'query',
    'list': 'categorymembers',
    'cmtitle': 'Category:Characters by title',
    'cmlimit': 500,
    'format': 'json'
}

response = requests.get(api_url, params=params)
if response.status_code == 200:
    data = response.json()
    members = data['query']['categorymembers']
    print(f"📋 Category:Characters by title contains {len(members)} items:")
    for i, member in enumerate(members[:20], 1):
        print(f"  {i:2d}. {member['title']}")
    if len(members) > 20:
        print(f"     ... and {len(members) - 20} more")
else:
    print("Failed to fetch category")

# Also check if we got Ur-Dragon specifically
print(f"\n🐉 Checking if we captured Ur-Dragon...")
try:
    with open('mtg_characters_complete_20250523_132425.json', encoding='utf-8') as f:
        import json
        data = json.load(f)
        if 'Ur-Dragon' in data['characters']:
            print("✅ Ur-Dragon is in our dataset")
        else:
            print("❌ Ur-Dragon is NOT in our dataset")
except:
    print("Could not check our dataset") 