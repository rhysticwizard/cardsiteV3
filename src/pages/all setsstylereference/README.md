# Magic: The Gathering Sets Viewer

A sleek, modern web application that displays all Magic: The Gathering sets organized by year of release. Users can browse sets with various filtering and sorting options, click on a set to view all cards within that set, and click on individual cards to see detailed information in a modal.

## Features

- Dark theme design with a modern, clean interface
- View all MTG sets organized by year or alphabetically
- Filter sets by type (Expansion, Core, Masters, etc.) or year
- Sort sets by newest, oldest, or alphabetically
- Toggle between grid view and list view
- Click on a set to view all cards in that set
- Click on individual cards to view detailed information in a modal
- Responsive design that works on desktop and mobile devices
- Fast loading with efficient API usage

## Technologies Used

- HTML5
- CSS3 (with Grid and Flexbox for responsive layouts)
- Vanilla JavaScript (ES6+)
- Font Awesome for icons
- Scryfall API for MTG data

## How to Use

1. Open `index.html` in a web browser
2. Use the navigation tabs to filter sets by type (All, Expansion, Core, etc.)
3. Use the Filter button to apply more specific filters
4. Use the Sort button to change the sort order of sets
5. Toggle between grid and list views using the view buttons
6. Click on any set to view its cards
7. Click on any card to view detailed information in a modal
8. Close the modal by clicking the X, clicking outside the modal, or pressing the Escape key
9. Use the "Back to Sets" button to return to the sets view

## Filtering and Sorting Options

### Filter By:
- Set Type (Expansion, Core, Masters, Commander, Draft Innovation)
- Year (2023, 2022, 2021, 2020, etc.)

### Sort By:
- Newest First (default)
- Oldest First
- Name (A-Z)
- Name (Z-A)

## View Options

- Grid View: Displays sets in a card-based grid layout
- List View: Displays sets in a more compact list with additional information

## Card Modal Features

The card modal displays comprehensive information about each card:
- Full card image(s) (including both sides of double-faced cards)
- Card name and mana cost
- Type line
- Rarity
- Power/toughness (for creatures)
- Loyalty (for planeswalkers)
- Oracle text
- Flavor text
- Artist information
- Collector number

## API Information

This project uses the [Scryfall API](https://scryfall.com/docs/api) to fetch Magic: The Gathering data:
- Sets endpoint: https://api.scryfall.com/sets
- Cards search endpoint: https://api.scryfall.com/cards/search?order=set&q=e:{set_code}

## Future Improvements

- Add card filtering and sorting options
- Add search functionality
- Implement caching for better performance
- Add card price information
- Convert to React components for better state management
- Add authentication for saving favorite cards/sets

## License

This project is open source and available under the MIT License. 