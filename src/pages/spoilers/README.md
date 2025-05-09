# MTG Spoilers Page - React Version

This is a React conversion of the original static HTML/JS spoilers page. The page maintains the exact same look, feel, and functionality as the original.

## Component Structure

1. **SpoilersPage** (`src/pages/spoilers/index.tsx`)
   - Main page component that sets the document title and description
   - Imports and renders the Spoilers component

2. **Spoilers** (`src/components/spoilers/Spoilers.tsx`)
   - Main component that manages the card grid and modal
   - Handles loading cards, pagination, and error states
   - Contains the main container layout

3. **Card** (`src/components/spoilers/Card.tsx`)
   - Individual card component that renders each card in the grid
   - Handles displaying the card image
   - Manages click events for opening the modal

4. **CardModal** (`src/components/spoilers/CardModal.tsx`)
   - Displays detailed card information in a modal
   - Loads and displays other printings of the card
   - Manages modal open/close state

## API Integration

- **ScryfallAPI** (`src/utils/ScryfallAPI.ts`)
  - TypeScript version of the original ScryfallAPI module
  - Handles all API requests to Scryfall
  - Includes caching and error handling

## Styling

- All original CSS is maintained in `src/pages/spoilers/styles.css`
- The CSS is imported directly into the React components
- No styling changes were made to maintain exact visual parity

## Integration with App

- The spoilers page is integrated into the app via React Router in `src/App.tsx`
- The route `/spoilers` renders the SpoilersPage component

## Key Features Maintained

- Card grid layout with smooth hover effects
- Card modal with detailed information
- Loading other printings of a card
- "Load More" pagination
- Error handling and fallbacks
- Performance optimizations

## Features

- View the latest MTG card spoilers
- Filter cards by set, color, rarity, and type
- Responsive design that works on desktop and mobile
- Click on cards to view full details on Scryfall

## Technologies Used

- HTML5
- CSS3
- JavaScript (ES6+)
- Scryfall API

## Getting Started

1. Clone this repository
2. Open `index.html` in your web browser
3. No build process required!

## Project Structure

```
/
├── index.html          # Main HTML file
├── styles.css          # CSS styles
├── js/
│   ├── api.js          # Scryfall API module
│   ├── filters.js      # Filter functionality
│   ├── cards.js        # Card display module
│   └── app.js          # Main application logic
└── README.md           # This file
```

## Future Improvements

- Add pagination for large result sets
- Add more filter options (mana value, keywords, etc.)
- Add card detail view without leaving the site
- Add ability to save favorite spoilers

## Credits

This project uses the [Scryfall API](https://scryfall.com/docs/api) to fetch Magic: The Gathering card data. 