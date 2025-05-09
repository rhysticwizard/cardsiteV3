import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import './ForumPage.css';
import { setupVoting, setupRuleExpansion, setupFilters, setupCommunityPage } from './forumUtils';

// Additional CSS for the community page
const additionalStyles = `
/* Breadcrumb Navigation */
.breadcrumb {
    display: flex;
    align-items: center;
    font-size: 0.9rem;
    margin-bottom: 1rem;
    color: #aaa;
}

.breadcrumb a {
    color: #aaa;
    text-decoration: none;
    transition: color 0.2s ease;
}

.breadcrumb a:hover {
    color: #eee;
    text-decoration: underline;
}

.breadcrumb-separator {
    margin: 0 0.5rem;
}

.community-layout {
    width: 100%;
}

.community-banner {
    margin-bottom: 1.5rem;
}

.community-info {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.community-icon {
    font-size: 2rem;
    color: #fff;
    width: 40px;
    text-align: center;
}

.community-name {
    margin: 0;
    font-size: 2rem;
    color: #fff;
}

.community-container {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.community-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
}

.post-filters {
    display: flex;
    gap: 0.5rem;
}

.filter-btn {
    background: none;
    border: none;
    color: #aaa;
    padding: 0.5rem 0.8rem;
    cursor: pointer;
    font-size: 0.9rem;
    border-radius: 4px;
}

.filter-btn:hover {
    background-color: #222;
    color: #fff;
}

.filter-btn.active {
    background-color: #333;
    color: #fff;
}

.posts-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.post-item {
    background-color: #111;
    border: 1px solid #333;
    border-radius: 4px;
    padding: 1rem;
}

.post-content {
    width: 100%;
}

.post-category {
    font-size: 0.75rem;
    color: #888;
    text-transform: uppercase;
    margin-bottom: 0.25rem;
}

.post-title {
    margin: 0 0 0.25rem 0;
    font-size: 1.25rem;
}

.post-title a {
    color: #eee;
    text-decoration: none;
}

.post-title a:hover {
    color: #fff;
}

.post-meta {
    font-size: 0.85rem;
    color: #888;
    margin-bottom: 0.5rem;
}

.post-meta .author {
    color: #aaa;
}

.post-excerpt {
    color: #bbb;
    font-size: 0.95rem;
    margin: 0.5rem 0;
}

.post-actions {
    display: flex;
    gap: 1rem;
    margin-top: 0.75rem;
    font-size: 0.9rem;
}

.post-action {
    color: #888;
    display: flex;
    align-items: center;
    gap: 0.25rem;
    text-decoration: none;
}

.post-action:hover {
    color: #eee;
}
`;

const CommunityGeneral: React.FC = () => {
  useEffect(() => {
    document.title = 'General Discussion - CardSite V2';
    
    // Log when the page loads
    console.log('Community General page loaded and script running.');
    
    // Add the additional CSS if not already present
    if (!document.getElementById('community-general-styles')) {
      const styleEl = document.createElement('style');
      styleEl.id = 'community-general-styles';
      styleEl.textContent = additionalStyles;
      document.head.appendChild(styleEl);
    }
    
    // Set up interactive elements
    setupVoting();
    setupRuleExpansion();
    setupFilters();
    setupCommunityPage();
    
    return () => {
      // Clean up the additional styles when component unmounts
      const styleEl = document.getElementById('community-general-styles');
      if (styleEl) {
        document.head.removeChild(styleEl);
      }
    };
  }, []);
  
  return (
    <main className="content-area">
      {/* Breadcrumb navigation */}
      <div className="breadcrumb">
        <Link to="/forums">Categories</Link>
        <span className="breadcrumb-separator">&gt;</span>
        <span>General Discussion</span>
      </div>
      
      {/* Community banner */}
      <div className="community-banner">
        <div className="community-info">
          <div className="community-icon">
            <i className="fa fa-comments"></i>
          </div>
          <h1 className="community-name">General Discussion</h1>
        </div>
      </div>
      
      {/* Main container with single column layout */}
      <div className="community-container single-column">
        {/* Posts column */}
        <div className="posts-column">
          {/* Top actions and sorting */}
          <div className="community-actions">
            <Link to="/forums/create-post?category=general" className="create-post-btn"><i className="fa fa-plus"></i> Create Post</Link>
            
            <div className="post-filters">
              <button className="filter-btn active"><i className="fa fa-certificate"></i> New</button>
              <button className="filter-btn"><i className="fa fa-arrow-up"></i> Top</button>
            </div>
          </div>
          
          {/* Post items */}
          <div className="posts-list">
            {/* Post 1 */}
            <article className="post-item">
              <div className="post-content">
                <div className="post-category">ANNOUNCEMENT</div>
                <h3 className="post-title">
                  <Link to="/forums/post-welcome">Welcome to the General Discussion Forum</Link>
                </h3>
                <p className="post-meta">Posted by <Link to="#" className="author">CommunityMod</Link> 5 days ago</p>
                <p className="post-excerpt">Welcome to our community! This is the place for all general discussions about the card game. Feel free to share your thoughts, ask questions, and connect with fellow players.</p>
                
                <div className="post-actions">
                  <Link to="/forums/post-welcome" className="post-action heart-btn"><i className="fa fa-heart"></i> 352</Link>
                  <Link to="/forums/post-welcome" className="post-action"><i className="fa fa-comment"></i> 128 comments</Link>
                  <Link to="#" className="post-action"><i className="fa fa-share"></i> Share</Link>
                  <Link to="#" className="post-action"><i className="fa fa-bookmark"></i> Save</Link>
                </div>
              </div>
            </article>
            
            {/* Post 2 */}
            <article className="post-item">
              <div className="post-content">
                <div className="post-category">DISCUSSION</div>
                <h3 className="post-title">
                  <Link to="#">What got you into this card game?</Link>
                </h3>
                <p className="post-meta">Posted by <Link to="#" className="author">CardEnthusiast</Link> 2 days ago</p>
                <p className="post-excerpt">I'm curious about everyone's story. What initially drew you to the game? Was it the artwork, the mechanics, or did a friend introduce you to it?</p>
                
                <div className="post-actions">
                  <Link to="#" className="post-action heart-btn"><i className="fa fa-heart"></i> 245</Link>
                  <Link to="#" className="post-action"><i className="fa fa-comment"></i> 87 comments</Link>
                  <Link to="#" className="post-action"><i className="fa fa-share"></i> Share</Link>
                  <Link to="#" className="post-action"><i className="fa fa-bookmark"></i> Save</Link>
                </div>
              </div>
            </article>
            
            {/* Post 3 */}
            <article className="post-item">
              <div className="post-content">
                <div className="post-category">EVENT</div>
                <h3 className="post-title">
                  <Link to="#">Upcoming Tournament - May 20th</Link>
                </h3>
                <p className="post-meta">Posted by <Link to="#" className="author">EventOrganizer</Link> 1 day ago</p>
                <p className="post-excerpt">We're excited to announce our next online tournament happening on May 20th. Registration is now open! Prize pool of $500 and exclusive digital items for participants.</p>
                
                <div className="post-actions">
                  <Link to="#" className="post-action heart-btn"><i className="fa fa-heart"></i> 198</Link>
                  <Link to="#" className="post-action"><i className="fa fa-comment"></i> 42 comments</Link>
                  <Link to="#" className="post-action"><i className="fa fa-share"></i> Share</Link>
                  <Link to="#" className="post-action"><i className="fa fa-bookmark"></i> Save</Link>
                </div>
              </div>
            </article>
            
            {/* Post 4 - New post */}
            <article className="post-item">
              <div className="post-content">
                <div className="post-category">QUESTION</div>
                <h3 className="post-title">
                  <Link to="#">Best places to buy card sleeves and accessories?</Link>
                </h3>
                <p className="post-meta">Posted by <Link to="#" className="author">NewCollector</Link> 6 hours ago</p>
                <p className="post-excerpt">I'm looking for recommendations on where to buy quality card sleeves, deck boxes, and other accessories. Any favorite online stores or local shops worth checking out?</p>
                
                <div className="post-actions">
                  <Link to="#" className="post-action heart-btn"><i className="fa fa-heart"></i> 14</Link>
                  <Link to="#" className="post-action"><i className="fa fa-comment"></i> 8 comments</Link>
                  <Link to="#" className="post-action"><i className="fa fa-share"></i> Share</Link>
                  <Link to="#" className="post-action"><i className="fa fa-bookmark"></i> Save</Link>
                </div>
              </div>
            </article>
            
            {/* Post 5 - Very popular */}
            <article className="post-item">
              <div className="post-content">
                <div className="post-category">COMMUNITY</div>
                <h3 className="post-title">
                  <Link to="#">Share your favorite card artwork!</Link>
                </h3>
                <p className="post-meta">Posted by <Link to="#" className="author">ArtLover</Link> 14 days ago</p>
                <p className="post-excerpt">The artwork in this game is phenomenal. Let's share our favorite card art and the stories behind why we love them so much!</p>
                
                <div className="post-actions">
                  <Link to="#" className="post-action heart-btn"><i className="fa fa-heart"></i> 879</Link>
                  <Link to="#" className="post-action"><i className="fa fa-comment"></i> 325 comments</Link>
                  <Link to="#" className="post-action"><i className="fa fa-share"></i> Share</Link>
                  <Link to="#" className="post-action"><i className="fa fa-bookmark"></i> Save</Link>
                </div>
              </div>
            </article>
            
            {/* Post 6 - New with no hearts */}
            <article className="post-item">
              <div className="post-content">
                <div className="post-category">NEW PLAYER</div>
                <h3 className="post-title">
                  <Link to="/forums/post-just-started">Just started the game yesterday!</Link>
                </h3>
                <p className="post-meta">Posted by <Link to="#" className="author">FirstTimePlayer</Link> 4 hours ago</p>
                <p className="post-excerpt">Hello everyone! I just started playing yesterday and I'm really enjoying it so far. Any tips for absolute beginners? What should I focus on first?</p>
                
                <div className="post-actions">
                  <Link to="/forums/post-just-started" className="post-action heart-btn"><i className="fa fa-heart"></i> 3</Link>
                  <Link to="/forums/post-just-started" className="post-action"><i className="fa fa-comment"></i> 2 comments</Link>
                  <Link to="#" className="post-action"><i className="fa fa-share"></i> Share</Link>
                  <Link to="#" className="post-action"><i className="fa fa-bookmark"></i> Save</Link>
                </div>
              </div>
            </article>
          </div>
        </div>
      </div>
    </main>
  );
};

export default CommunityGeneral; 