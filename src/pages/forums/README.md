# TCG Forums

A simple forum site for TCG (Trading Card Game) players to make posts and discuss their favorite games.

## Features

- View posts organized by categories
- Create new posts (when logged in)
- Upvote and comment on posts
- User authentication (signup/login)
- Responsive design for various screen sizes

## Project Structure

This project is organized in a modular, component-based structure that makes it easy to maintain and extend:

```
.
├── css/
│   └── styles.css                 # Main CSS styles
├── js/
│   ├── components/
│   │   └── Post.js                # Post component
│   ├── utils/
│   │   └── storage.js             # Storage utilities 
│   └── app.js                     # Main application logic
└── index.html                     # Main HTML file
```

## Technology Stack

- HTML5, CSS3, and JavaScript ES6+
- Component-based architecture
- LocalStorage for data persistence
- ES6 Modules for code organization

## Getting Started

1. Clone the repository or download the source code
2. Open `index.html` in a modern web browser
3. Sign up to create an account
4. Start posting and interacting with the community!

## Future Enhancements

- Backend implementation with Node.js
- Database integration with MongoDB
- Advanced user profiles
- Real-time notifications
- Post categories management
- Moderation tools
- Search functionality

## Browser Support

This application works best in modern browsers that support ES6 features, including:
- Chrome
- Firefox
- Safari
- Edge 