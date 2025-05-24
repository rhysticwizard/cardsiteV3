#!/usr/bin/env python3
"""
Check all character categories on mtg.wiki to see if we missed any
"""

import requests
import json

def check_all_character_categories():
    api_url = 'https://mtg.wiki/api.php'
    
    # Get all subcategories under Category:Characters
    params = {
        'action': 'query',
        'list': 'categorymembers',
        'cmtitle': 'Category:Characters',
        'cmtype': 'subcat',
        'cmlimit': 500,
        'format': 'json'
    }
    
    response = requests.get(api_url, params=params)
    if response.status_code != 200:
        print("❌ Failed to fetch categories")
        return
    
    data = response.json()
    all_subcategories = [cat['title'] for cat in data['query']['categorymembers']]
    
    # Categories we scraped
    scraped_categories = [
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
    
    print("🔍 ALL CHARACTER SUBCATEGORIES ON MTG.WIKI:")
    print("=" * 60)
    
    missed_categories = []
    for i, cat in enumerate(sorted(all_subcategories), 1):
        if cat in scraped_categories:
            print(f"{i:2d}. ✅ {cat}")
        else:
            print(f"{i:2d}. ❌ {cat}")
            missed_categories.append(cat)
    
    print(f"\n📊 SUMMARY:")
    print(f"Total categories: {len(all_subcategories)}")
    print(f"Scraped: {len([c for c in all_subcategories if c in scraped_categories])}")
    print(f"Missed: {len(missed_categories)}")
    
    if missed_categories:
        print(f"\n⚠️  MISSED CATEGORIES:")
        for cat in missed_categories:
            print(f"   • {cat}")
    
    # Also check how many characters are directly in Category:Characters
    params2 = {
        'action': 'query',
        'list': 'categorymembers',
        'cmtitle': 'Category:Characters',
        'cmtype': 'page',
        'cmlimit': 500,
        'format': 'json'
    }
    
    response2 = requests.get(api_url, params=params2)
    if response2.status_code == 200:
        data2 = response2.json()
        direct_chars = data2['query']['categorymembers']
        print(f"\n📝 Characters directly in Category:Characters: {len(direct_chars)}")
        if direct_chars:
            print("First 10:")
            for char in direct_chars[:10]:
                print(f"   • {char['title']}")

if __name__ == "__main__":
    check_all_character_categories() 