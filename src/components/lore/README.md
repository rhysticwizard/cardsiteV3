# MTG Lore Timeline (React Version)

An interactive timeline of Magic: The Gathering's lore history, based on data from the [MTG Wiki Timeline](https://mtg.fandom.com/wiki/Timeline).

## Features

- View the complete MTG timeline organized by eras
- Filter timeline events by era (Pre-History, Brothers' War, Mending Era, etc.)
- Search for specific events by keyword
- Toggle between timeline and grid view modes
- Sort events by chronological order (oldest/newest first)
- View detailed information about specific events
- Navigate between events with previous/next controls
- Explore related events from the same era
- Responsive design works on all device sizes
- Keyboard navigation support

## Components

- `LoreTimeline` - Main timeline component that displays all eras and events
- `LoreDetail` - Detail component for displaying a specific event
- `timelineData` - Data source containing all timeline information

## Tech Stack

- React
- TypeScript
- React Router
- Font Awesome Icons

## Usage

The lore pages are accessible via:
- Main timeline: `/lore`
- Event details: `/lore/:eventId`

## Credits

All MTG lore information is sourced from the [MTG Wiki Timeline](https://mtg.fandom.com/wiki/Timeline), maintained by the MTG Wiki community.

## License

This project is intended for educational and personal use. Magic: The Gathering is owned by Wizards of the Coast. 