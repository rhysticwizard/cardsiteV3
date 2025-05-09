# TCG Rules Explorer

A simple, intuitive web application for searching and exploring comprehensive rules for trading card games. This project provides an easy way to reference, search, and navigate through complex rule sets.

## Features

- **Rules Explorer**: Browse through sections and subsections of comprehensive rules
- **Search Functionality**: Search for specific rules using keywords
- **Glossary**: Look up game terminology and definitions
- **Version History**: Track changes between different rule versions
- **Dark Mode**: Toggle between light and dark themes
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **HTML5**: Page structure and content
- **CSS3**: Styling and responsive design
- **JavaScript**: Client-side functionality
- **Font Awesome**: Icons

This project is built with vanilla JavaScript without any frameworks to keep it lightweight and simple. The modular component-based structure allows for easy expansion and maintenance.

## Getting Started

### Running Locally

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/tcg-rules-explorer.git
   ```

2. Navigate to the project directory:
   ```
   cd tcg-rules-explorer
   ```

3. Start a local server:
   
   Using Python:
   ```
   python -m http.server 8080
   ```
   
   Using Node.js:
   ```
   npx http-server -p 8080
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:8080
   ```

## Project Structure

```
/
├── index.html           # Main rules explorer page
├── glossary.html        # Glossary of terms
├── history.html         # Version history page
├── styles.css           # Main stylesheet
├── js/
│   ├── app.js           # Main application logic
│   ├── data.js          # Rules data
│   ├── glossary.js      # Glossary page functionality
│   └── history.js       # Version history functionality
└── README.md            # Project documentation
```

## Customizing Rules Data

To customize the rules data for your own TCG:

1. Edit the `js/data.js` file to include your game's specific rules
2. Follow the existing data structure for sections, subsections, and individual rules
3. Update the glossary terms and version history as needed

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Rules data structure inspired by the [MTG Comprehensive Rules](https://mtg.fandom.com/wiki/Comprehensive_Rules) 