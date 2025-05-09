import React, { Component, ErrorInfo } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Sidebar from './components/Sidebar';
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
import { RandomCardProvider } from './context/RandomCardContext';
import { DeckProvider } from './context/DeckContext';

// Main layout component with sidebar
const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="app-container">
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

function App() {
  return (
    <ErrorBoundary>
      <DeckProvider>
        <Router basename="/cardsiteV3">
          <Routes>
            {/* Main homepage is now the MTG Hub */}
            <Route path="/" element={
              <MainLayout>
                <HomePage />
              </MainLayout>
            } />
            
            {/* Spoilers page */}
            <Route path="/spoilers" element={
              <MainLayout>
                <SpoilersPage />
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
            
            {/* Deck Builder page */}
            <Route path="/deckbuilder" element={
              <MainLayout>
                <DeckBuilder />
              </MainLayout>
            } />
            
            {/* Decks page */}
            <Route path="/decks" element={
              <MainLayout>
                <DecksPage />
              </MainLayout>
            } />
            
            {/* Search page */}
            <Route path="/search" element={
              <MainLayout>
                <SearchPage />
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
      </DeckProvider>
    </ErrorBoundary>
  );
}

export default App;
