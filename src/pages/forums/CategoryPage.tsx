import React, { useEffect, useState } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import './ForumPage.css';
import './CategoryPage.css'; // Import dedicated CSS file
import { setupVoting, setupRuleExpansion, setupFilters, setupCommunityPage } from './forumUtils';
import ImageCarousel from '../../components/ImageCarousel';

// Type definitions
interface Category {
  title: string;
  icon: string;
  description: string;
}

interface Subcategory {
  name: string;
  icon: string;
}

interface Post {
  id: number;
  category: string;
  title: string;
  author: string;
  timeAgo: string;
  excerpt: string;
  hearts: number;
  comments: number;
  link: string;
  subcategories: string[];
  categoryId: string;
  gifUrl?: string;
  imageUrl?: string;
  imageUrls?: string[];
  reactions?: Record<string, { emoji: string; count: number; users: string[] }>;
}

// Categories data - in a real app this would come from an API
const categories: Record<string, Category> = {
  general: {
    title: 'General Discussion',
    icon: 'fa-comments',
    description: 'Discuss anything related to trading card games that doesn\'t fit into other categories.'
  },
  strategy: {
    title: 'Strategy & Gameplay',
    icon: 'fa-chess',
    description: 'Discuss gameplay strategies, card interactions, and competitive play.'
  },
  deckbuilding: {
    title: 'Deck Building',
    icon: 'fa-layer-group',
    description: 'Share your deck ideas, get feedback on your builds, and discuss deck archetypes.'
  },
  rules: {
    title: 'Rules & Rulings',
    icon: 'fa-book',
    description: 'Ask questions about rules, card interactions, and official rulings.'
  },
  humor: {
    title: 'Jokes & Humor',
    icon: 'fa-laugh',
    description: 'Share your funniest card game jokes, memes, and humorous stories.'
  }
};

// Subcategories data - in a real app this would come from an API
const subcategories: Record<string, Record<string, Subcategory>> = {
  general: {
    introductions: { name: 'Introductions', icon: 'fa-user-plus' },
    announcements: { name: 'Announcements', icon: 'fa-bullhorn' },
    questions: { name: 'Questions & Answers', icon: 'fa-question-circle' }
  },
  strategy: {
    competitive: { name: 'Competitive Play', icon: 'fa-trophy' },
    commander: { name: 'Commander', icon: 'fa-crown' },
    'new-player': { name: 'New Player Strategies', icon: 'fa-graduation-cap' }
  },
  deckbuilding: {
    standard: { name: 'Standard', icon: 'fa-chart-bar' },
    modern: { name: 'Modern', icon: 'fa-rocket' },
    commander: { name: 'Commander', icon: 'fa-crown' }
  },
  rules: {
    questions: { name: 'Rules Questions', icon: 'fa-question-circle' },
    judge: { name: 'Judge Corner', icon: 'fa-gavel' },
    interactions: { name: 'Complex Interactions', icon: 'fa-random' }
  },
  humor: {
    memes: { name: 'Memes & Images', icon: 'fa-image' },
    stories: { name: 'Funny Game Stories', icon: 'fa-comment-dots' },
    puns: { name: 'Card Puns', icon: 'fa-theater-masks' }
  }
};

// Reusable post data structure to populate the category page
const samplePosts: Post[] = [
  {
    id: 1,
    category: 'NEW PLAYER',
    title: 'Just started the game yesterday!',
    author: 'FirstTimePlayer',
    timeAgo: '4 hours ago',
    excerpt: 'Hello everyone! I just started playing yesterday and I\'m really enjoying it so far. Any tips for absolute beginners? What should I focus on first?',
    hearts: 3,
    comments: 2,
    link: '#',
    subcategories: ['introductions', 'new-player'],
    categoryId: 'general'
  },
  {
    id: 2,
    category: 'QUESTION',
    title: 'Best places to buy card sleeves and accessories?',
    author: 'NewCollector',
    timeAgo: '6 hours ago',
    excerpt: 'I\'m looking for recommendations on where to buy quality card sleeves, deck boxes, and other accessories. Any favorite online stores or local shops worth checking out?',
    hearts: 14,
    comments: 8,
    link: '#',
    subcategories: ['questions'],
    categoryId: 'general'
  },
  {
    id: 3,
    category: 'EVENT',
    title: 'Upcoming Tournament - May 20th',
    author: 'EventOrganizer',
    timeAgo: '1 day ago',
    excerpt: 'We\'re excited to announce our next online tournament happening on May 20th. Registration is now open! Prize pool of $500 and exclusive digital items for participants.',
    hearts: 198,
    comments: 42,
    link: '#',
    subcategories: ['announcements', 'competitive'],
    categoryId: 'general'
  },
  {
    id: 4,
    category: 'DISCUSSION',
    title: 'What got you into this card game?',
    author: 'CardEnthusiast',
    timeAgo: '2 days ago',
    excerpt: 'I\'m curious about everyone\'s story. What initially drew you to the game? Was it the artwork, the mechanics, or did a friend introduce you to it?',
    hearts: 245,
    comments: 87,
    link: '#',
    subcategories: ['introductions'],
    categoryId: 'general'
  },
  {
    id: 5,
    category: 'COMMUNITY',
    title: 'Share your favorite card artwork!',
    author: 'ArtLover',
    timeAgo: '14 days ago',
    excerpt: 'The artwork in this game is phenomenal. Let\'s share our favorite card art and the stories behind why we love them so much!',
    hearts: 879,
    comments: 325,
    link: '#',
    subcategories: ['memes', 'stories'],
    categoryId: 'general'
  }
];

// Function to load posts from localStorage
const getStoredPosts = (): Post[] => {
  const storedPosts = localStorage.getItem('forumPosts');
  console.log('CategoryPage - Loading posts from storage:', storedPosts ? 'Found data' : 'No data');
  
  if (storedPosts) {
    try {
      const posts = JSON.parse(storedPosts);
      console.log('CategoryPage - Posts with media:', posts.map((p: Post) => ({
        id: p.id,
        title: p.title,
        hasGif: !!p.gifUrl,
        hasImage: !!p.imageUrl
      })));
      return posts;
    } catch (error) {
      console.error('Error parsing posts from localStorage:', error);
      return [];
    }
  }
  
  return [];
};

// Helper function to count total reactions on a post
const countTotalReactions = (post: Post): number => {
  if (!post.reactions) return 0;
  
  let total = 0;
  Object.values(post.reactions).forEach(reaction => {
    total += reaction.count;
  });
  return total;
};

const CategoryPage: React.FC = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const subcategoryParam = queryParams.get('subcategory');
  
  const [filterType, setFilterType] = useState('latest');
  const [currentSubcategory, setCurrentSubcategory] = useState(subcategoryParam || '');
  const [posts, setPosts] = useState<Post[]>([]);
  
  const validCategoryId = categoryId && categoryId in categories ? categoryId : 'general';
  const category = categories[validCategoryId as keyof typeof categories];

  useEffect(() => {
    // Set the page title
    document.title = `${category.title} - CardSite V3`;
    
    // Load posts from localStorage
    const allPosts = getStoredPosts();
    setPosts(allPosts);
    
    // Update subcategory when URL changes
    setCurrentSubcategory(subcategoryParam || '');
  }, [category.title, subcategoryParam]);
  
  // Filter posts based on category and subcategory
  const filteredPosts = posts.filter(post => {
    // First filter by category
    if (post.categoryId !== validCategoryId) {
      return false;
    }
    
    // Then filter by subcategory if one is selected
    if (currentSubcategory) {
      return post.subcategories.includes(currentSubcategory);
    }
    
    // If we get here, post matches the category but no subcategory is selected
    return true;
  });
  
  // Sort posts based on filter type
  const sortedPosts = [...filteredPosts].sort((a, b) => {
    if (filterType === 'latest') {
      return b.id - a.id; // Sort by id (timestamp) descending
    } else if (filterType === 'popular') {
      // Sort by reactions if available, otherwise use hearts for backward compatibility
      const aReactions = countTotalReactions(a);
      const bReactions = countTotalReactions(b);
      
      // If both posts have reactions, sort by reactions
      if (aReactions > 0 || bReactions > 0) {
        return bReactions - aReactions;
      }
      
      // Fall back to hearts for backward compatibility
      return b.hearts - a.hearts;
    }
    return 0;
  });

  // Helper function to safely get subcategory name
  const getSubcategoryName = (catId: string, subId: string): string => {
    if (catId in subcategories && subId in subcategories[catId]) {
      return subcategories[catId][subId].name;
    }
    return 'Unknown Subcategory';
  };

  return (
    <main className="content-area">
      {/* Breadcrumb navigation */}
      <div className="breadcrumb">
        <Link to="/forums">Categories</Link>
        <span className="breadcrumb-separator">&gt;</span>
        <span>{category.title}</span>
        {currentSubcategory && (
          <>
            <span className="breadcrumb-separator">&gt;</span>
            <span>
              {getSubcategoryName(validCategoryId, currentSubcategory)}
            </span>
          </>
        )}
      </div>

      {/* Category header */}
      <div className="category-header">
        <div className="category-icon">
          <i className={`fas ${category.icon}`}></i>
        </div>
        <h1 className="category-title">
          {currentSubcategory 
            ? getSubcategoryName(validCategoryId, currentSubcategory)
            : category.title}
        </h1>
      </div>

      {/* Actions bar */}
      <div className="actions-bar">
        <Link to={`/forums/create-post?category=${validCategoryId}${currentSubcategory ? `&subcategory=${currentSubcategory}` : ''}`} className="create-post-btn">
          <i className="fas fa-pen-to-square"></i> Create Post
        </Link>
        <div className="filter-options">
          <button 
            className={`filter-btn ${filterType === 'latest' ? 'active' : ''}`}
            onClick={() => setFilterType('latest')}
          >
            <i className="fas fa-clock"></i> Latest
          </button>
          <button 
            className={`filter-btn ${filterType === 'popular' ? 'active' : ''}`}
            onClick={() => setFilterType('popular')}
          >
            <i className="fas fa-fire"></i> Popular
          </button>
        </div>
      </div>

      {/* Posts container */}
      <div className="posts-container">
        {sortedPosts.length > 0 ? (
          sortedPosts.map((post) => (
            <div className="post-card" key={post.id}>
              {/* Content area */}
              <div className="post-content-area">
                <div className="post-category">{post.category}</div>
                
                {/* For posts with media, use special layout */}
                <div className="post-with-media">
                  <div className="post-text-content">
                    <h2 className="post-title">
                      <Link to={`/forums/post/${post.id}`}>{post.title}</Link>
                    </h2>
                    <div className="post-author">
                      Posted by <Link to="#">{post.author}</Link> • {post.timeAgo}
                    </div>
                    <div className="post-content">{post.excerpt}</div>
                  </div>
                  
                  {/* Show thumbnail if post has media */}
                  {(post.gifUrl || post.imageUrl || (post.imageUrls && post.imageUrls.length > 0)) && (
                    <div className="post-thumbnail">
                      {post.gifUrl ? (
                        <img src={post.gifUrl} alt="Post GIF" />
                      ) : post.imageUrls && post.imageUrls.length > 0 ? (
                        <img src={post.imageUrls[0]} alt="Post thumbnail" />
                      ) : post.imageUrl && (
                        <img src={post.imageUrl} alt="Post thumbnail" />
                      )}
                    </div>
                  )}
                </div>
                
                <div className="post-actions">
                  <button 
                    className="action-btn reaction-btn"
                    onClick={(e) => {
                      e.preventDefault();
                      // Navigate to post to see reactions
                      window.location.href = `/forums/post/${post.id}`;
                    }}
                  >
                    <i className="fas fa-smile"></i> {countTotalReactions(post) || post.hearts} React
                  </button>
                  <Link to={`/forums/post/${post.id}`} className="action-btn">
                    <i className="fas fa-comment"></i> {post.comments} Comments
                  </Link>
                  <button className="action-btn">
                    <i className="fas fa-share"></i> Share
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="no-posts-message">
            <i className="fa fa-inbox"></i>
            <p>No posts in this category yet. Be the first to post!</p>
          </div>
        )}
      </div>
    </main>
  );
};

export default CategoryPage;