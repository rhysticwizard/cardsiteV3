import React, { Component, ErrorInfo, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import './App.css';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Sidebar from './components/Sidebar';
import GlobalNavbar from './components/GlobalNavbar';
import HomePage from './pages/homepage/HomePage';
import ForumLayout from './pages/forums/ForumLayout';
import ForumPage from './pages/forums/ForumPage';
import CommunityGeneral from './pages/forums/CommunityGeneral';
import CategoryPage from './pages/forums/CategoryPage';
import CreatePost from './pages/forums/CreatePost';
import PostPage from './pages/forums/PostPage';
import MtgSetsRoutes from './pages/all sets/routes';
import SpoilersPage from './pages/spoilers';
import RandomCard from './pages/random-card/RandomCard';
import SearchPage from './pages/search/SearchPage';
import DeckBuilder from './pages/deckbuilder';
import DecksPage from './pages/decks';
import Playmat from './pages/playmat';
import ProfilePage from './pages/profile/ProfilePage';
import RulesPage from './pages/rules/RulesPage';
import { RandomCardProvider } from './context/RandomCardContext';
import { DeckProvider, useDeckContext } from './context/DeckContext';
import { ProfileProvider } from './context/ProfileContext';
import { FavoritesProvider } from './context/FavoritesContext';
import DeckDetails from './pages/deck-details';
// import { LoreTimeline, LoreDetail } from './components/lore/index'; // Commenting out for testing
import LoreTimeline from './components/lore/LoreTimeline'; // Direct import
import LoreDetail from './components/lore/LoreDetail'; // Direct import
import CharacterDetail from './components/lore/CharacterDetail'; // Character detail import

// Main layout component with sidebar
const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="app-container">
      <GlobalNavbar />
      <Sidebar />
      <div className="app-content">
        {children}
      </div>
    </div>
  );
};

// Simple About page component
const AboutPage = () => (
  <div className="about-page">
    <h1>About Us</h1>
    <p>A placeholder for your About page content.</p>
  </div>
);

// Error boundary component
class ErrorBoundary extends Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("DeckProvider Error:", error, errorInfo);
    
    // If localStorage is corrupted, clear it
    if (error.message.includes('JSON')) {
      console.log("Clearing localStorage due to JSON parsing error");
      localStorage.removeItem('savedDecks');
      // Reload the page to recover
      window.location.reload();
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-container">
          <h1>Something went wrong loading decks</h1>
          <p>We've cleared any corrupted data. Please refresh the page.</p>
          <button onClick={() => window.location.reload()}>Refresh</button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Add CreateDeckWrapper component that redirects to deckbuilder with a new ID
const CreateDeckWrapper: React.FC = () => {
  const navigate = useNavigate();
  const { createNewDeckId } = useDeckContext();
  
  useEffect(() => {
    // Clear any existing deckbuilder state in localStorage
    localStorage.removeItem('deckbuilder_cards');
    localStorage.removeItem('deckbuilder_title');
    localStorage.removeItem('deckbuilder_column_titles');
    localStorage.removeItem('deckbuilder_search_results');
    localStorage.removeItem('deckbuilder_search_query');
    
    // Generate a new ID and redirect
    const newDeckId = createNewDeckId();
    navigate(`/deckbuilder/${newDeckId}`);
  }, [navigate, createNewDeckId]);
  
  return <div>Creating new deck...</div>;
};

function App() {
  // Detect if we're on GitHub Pages and use the proper basename
  const isGitHubPages = window.location.hostname.includes('github.io');
  const basename = isGitHubPages ? '/cardsiteV3' : '';

  // For development/troubleshooting
  console.log("App rendering with basename:", basename);
  console.log("Current location:", window.location.pathname);

  return (
    <ErrorBoundary>
      <DeckProvider>
        <ProfileProvider>
          <FavoritesProvider>
            <Router basename={basename}>
              <Routes>
                {/* Main homepage is now the MTG Hub */}
                <Route path="/" element={
                  <MainLayout>
                    <HomePage />
                  </MainLayout>
                } />
                
                {/* Profile page */}
                <Route path="/profile" element={
                  <MainLayout>
                    <ProfilePage />
                  </MainLayout>
                } />
                
                {/* Spoilers page */}
                <Route path="/spoilers" element={
                  <MainLayout>
                    <SpoilersPage />
                  </MainLayout>
                } />
                
                {/* Rules page */}
                <Route path="/rules" element={
                  <MainLayout>
                    <RulesPage />
                  </MainLayout>
                } />
                
                {/* Random Card page */}
                <Route path="/random-card" element={
                  <MainLayout>
                    <RandomCardProvider>
                      <RandomCard />
                    </RandomCardProvider>
                  </MainLayout>
                } />
                
                {/* Create New Deck (redirects to deckbuilder with temp ID) */}
                <Route path="/create-deck" element={
                  <MainLayout>
                    <CreateDeckWrapper />
                  </MainLayout>
                } />
                
                {/* Deck Builder page with ID */}
                <Route path="/deckbuilder/:deckId" element={
                  <MainLayout>
                    <DeckBuilder />
                  </MainLayout>
                } />
                
                {/* Deck Builder page (backward compatibility) */}
                <Route path="/deckbuilder" element={
                  <MainLayout>
                    <DeckBuilder />
                  </MainLayout>
                } />
                
                {/* Deck Details page */}
                <Route path="/deck-details/:deckId" element={
                  <MainLayout>
                    <DeckDetails />
                  </MainLayout>
                } />
                
                {/* Decks page */}
                <Route path="/decks" element={
                  <MainLayout>
                    <DecksPage />
                  </MainLayout>
                } />
                
                {/* Playmat page */}
                <Route path="/playmat/:deckId" element={
                  <MainLayout>
                    <Playmat />
                  </MainLayout>
                } />
                
                {/* Playmat page (default without deck) */}
                <Route path="/playmat" element={
                  <MainLayout>
                    <Playmat />
                  </MainLayout>
                } />
                
                {/* Search page */}
                <Route path="/search" element={
                  <MainLayout>
                    <SearchPage />
                  </MainLayout>
                } />
                
                {/* Lore Timeline page */}
                <Route path="/lore" element={
                  <MainLayout>
                    <LoreTimeline />
                  </MainLayout>
                } />
                
                {/* Character Detail page */}
                <Route path="/lore/character/:characterName" element={
                  <MainLayout>
                    <CharacterDetail />
                  </MainLayout>
                } />
                
                {/* Lore Detail page */}
                <Route path="/lore/:eventId" element={
                  <MainLayout>
                    <LoreDetail />
                  </MainLayout>
                } />
                
                {/* Forum routes */}
                <Route path="/forums" element={
                  <MainLayout>
                    <ForumLayout />
                  </MainLayout>
                }>
                  <Route index element={<ForumPage />} />
                  <Route path="community-general" element={<CommunityGeneral />} />
                  {/* Dynamic route for any category */}
                  <Route path="category/:categoryId" element={<CategoryPage />} />
                  {/* Individual post route */}
                  <Route path="post/:postId" element={<PostPage />} />
                  {/* Create post route */}
                  <Route path="create-post" element={<CreatePost />} />
                </Route>
                
                {/* MTG Sets routes wrapped in MainLayout */}
                {MtgSetsRoutes.map(route => {
                  const WrappedElement = () => (
                    <MainLayout>
                      {route.props.element}
                    </MainLayout>
                  );
                  
                  return (
                    <Route 
                      key={route.key} 
                      path={route.props.path} 
                      element={<WrappedElement />} 
                    />
                  );
                })}
                
                {/* Regular routes with App container */}
                <Route path="/about" element={
                  <MainLayout>
                    <div className="App">
                      <header className="App-header">
                        <Navbar />
                      </header>
                      
                      <main className="App-main">
                        <AboutPage />
                      </main>
                      
                      <Footer />
                    </div>
                  </MainLayout>
                } />
              </Routes>
            </Router>
          </FavoritesProvider>
        </ProfileProvider>
      </DeckProvider>
    </ErrorBoundary>
  );
}

export default App;
