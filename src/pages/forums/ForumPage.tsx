import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import './ForumPage.css';
import { setupVoting, setupRuleExpansion, setupFilters, setupCommunityPage } from './forumUtils';

const ForumPage: React.FC = () => {
  useEffect(() => {
    document.title = 'Forums - CardSite V3';
    
    // Log when the page loads (equivalent to the original script.js)
    console.log('Forum page loaded and script running.');
    
    // Set up interactive elements
    setupVoting();
    setupRuleExpansion();
    setupFilters();
    setupCommunityPage();
    
    // Check if filter buttons exist (debug)
    const filterButtons = document.querySelectorAll('.filter-btn');
    console.log('Found filter buttons:', filterButtons.length);
    filterButtons.forEach(btn => console.log('Button text:', btn.textContent?.trim()));
  }, []);
  
  return (
    <>
      <main className="content-area">
        <h2 className="section-title">Categories</h2>
        
        {/* Category Cards */}
        <div className="category-cards">
          {/* General Discussion */}
          <div className="category-card">
            <div className="category-header">
              <div className="category-icon">
                <i className="fas fa-comments"></i>
              </div>
              <h3><Link to="/forums/category/general">General Discussion</Link></h3>
            </div>
            <div className="category-stats">
              <span><i className="fas fa-file-alt"></i> 1,245 topics</span>
              <span><i className="fas fa-reply"></i> 8,652 replies</span>
              <span><i className="fas fa-users"></i> 3,421 participants</span>
            </div>
            <p className="category-description">Discuss anything related to trading card games that doesn't fit into other categories. General questions, announcements, and community discussions.</p>
            
            <div className="subcategories">
              <div className="subcategory">
                <i className="fas fa-user-plus"></i>
                <Link to="/forums/category/general?subcategory=introductions">Introductions</Link>
                <span className="stats">248 topics • 1,432 replies</span>
              </div>
              <div className="subcategory">
                <i className="fas fa-bullhorn"></i>
                <Link to="/forums/category/general?subcategory=announcements">Announcements</Link>
                <span className="stats">87 topics • 654 replies</span>
              </div>
              <div className="subcategory">
                <i className="fas fa-question-circle"></i>
                <Link to="/forums/category/general?subcategory=questions">Questions & Answers</Link>
                <span className="stats">913 topics • 6,546 replies</span>
              </div>
            </div>
          </div>

          {/* Strategy & Gameplay */}
          <div className="category-card">
            <div className="category-header">
              <div className="category-icon">
                <i className="fas fa-chess"></i>
              </div>
              <h3><Link to="/forums/category/strategy">Strategy & Gameplay</Link></h3>
            </div>
            <div className="category-stats">
              <span><i className="fas fa-file-alt"></i> 2,187 topics</span>
              <span><i className="fas fa-reply"></i> 15,543 replies</span>
              <span><i className="fas fa-users"></i> 5,234 participants</span>
            </div>
            <p className="category-description">Discuss gameplay strategies, card interactions, and competitive play. Share tips, tricks, and get advice on improving your game.</p>
            
            <div className="subcategories">
              <div className="subcategory">
                <i className="fas fa-trophy"></i>
                <Link to="/forums/category/strategy?subcategory=competitive">Competitive Play</Link>
                <span className="stats">543 topics • 4,321 replies</span>
              </div>
              <div className="subcategory">
                <i className="fas fa-crown"></i>
                <Link to="/forums/category/strategy?subcategory=commander">Commander</Link>
                <span className="stats">878 topics • 7,654 replies</span>
              </div>
              <div className="subcategory">
                <i className="fas fa-graduation-cap"></i>
                <Link to="/forums/category/strategy?subcategory=new-player">New Player Strategies</Link>
                <span className="stats">768 topics • 3,608 replies</span>
              </div>
            </div>
          </div>
          
          {/* Deck Building */}
          <div className="category-card">
            <div className="category-header">
              <div className="category-icon">
                <i className="fas fa-layer-group"></i>
              </div>
              <h3><Link to="/forums/category/deckbuilding">Deck Building</Link></h3>
            </div>
            <div className="category-stats">
              <span><i className="fas fa-file-alt"></i> 3,458 topics</span>
              <span><i className="fas fa-reply"></i> 21,878 replies</span>
              <span><i className="fas fa-users"></i> 6,543 participants</span>
            </div>
            <p className="category-description">Share your deck ideas, get feedback on your builds, and discuss deck archetypes across all formats.</p>
            
            <div className="subcategories">
              <div className="subcategory">
                <i className="fas fa-chart-bar"></i>
                <Link to="/forums/category/deckbuilding?subcategory=standard">Standard</Link>
                <span className="stats">654 topics • 4,321 replies</span>
              </div>
              <div className="subcategory">
                <i className="fas fa-rocket"></i>
                <Link to="/forums/category/deckbuilding?subcategory=modern">Modern</Link>
                <span className="stats">765 topics • 5,432 replies</span>
              </div>
              <div className="subcategory">
                <i className="fas fa-crown"></i>
                <Link to="/forums/category/deckbuilding?subcategory=commander">Commander</Link>
                <span className="stats">1,432 topics • 9,876 replies</span>
              </div>
            </div>
          </div>

          {/* Rules & Rulings */}
          <div className="category-card">
            <div className="category-header">
              <div className="category-icon">
                <i className="fas fa-book"></i>
              </div>
              <h3><Link to="/forums/category/rules">Rules & Rulings</Link></h3>
            </div>
            <div className="category-stats">
              <span><i className="fas fa-file-alt"></i> 1,876 topics</span>
              <span><i className="fas fa-reply"></i> 12,543 replies</span>
              <span><i className="fas fa-users"></i> 4,321 participants</span>
            </div>
            <p className="category-description">Ask questions about rules, card interactions, and official rulings. Get clarification on complex game mechanics.</p>
            
            <div className="subcategories">
              <div className="subcategory">
                <i className="fas fa-question-circle"></i>
                <Link to="/forums/category/rules?subcategory=questions">Rules Questions</Link>
                <span className="stats">1,234 topics • 8,765 replies</span>
              </div>
              <div className="subcategory">
                <i className="fas fa-gavel"></i>
                <Link to="/forums/category/rules?subcategory=judge">Judge Corner</Link>
                <span className="stats">432 topics • 2,765 replies</span>
              </div>
              <div className="subcategory">
                <i className="fas fa-random"></i>
                <Link to="/forums/category/rules?subcategory=interactions">Complex Interactions</Link>
                <span className="stats">210 topics • 1,013 replies</span>
              </div>
            </div>
          </div>

          {/* Jokes & Humor */}
          <div className="category-card">
            <div className="category-header">
              <div className="category-icon">
                <i className="fas fa-laugh"></i>
              </div>
              <h3><Link to="/forums/category/humor">Jokes & Humor</Link></h3>
            </div>
            <div className="category-stats">
              <span><i className="fas fa-file-alt"></i> 567 topics</span>
              <span><i className="fas fa-reply"></i> 4,321 replies</span>
              <span><i className="fas fa-users"></i> 2,154 participants</span>
            </div>
            <p className="category-description">Share your funniest card game jokes, memes, and humorous stories. A lighthearted place to enjoy some laughs with the community.</p>
            
            <div className="subcategories">
              <div className="subcategory">
                <i className="fas fa-image"></i>
                <Link to="/forums/category/humor?subcategory=memes">Memes & Images</Link>
                <span className="stats">253 topics • 2,145 replies</span>
              </div>
              <div className="subcategory">
                <i className="fas fa-comment-dots"></i>
                <Link to="/forums/category/humor?subcategory=stories">Funny Game Stories</Link>
                <span className="stats">189 topics • 1,532 replies</span>
              </div>
              <div className="subcategory">
                <i className="fas fa-theater-masks"></i>
                <Link to="/forums/category/humor?subcategory=puns">Card Puns</Link>
                <span className="stats">125 topics • 644 replies</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="site-footer">
        <p>&copy; 2023 CardSite V3. All rights reserved.</p>
      </footer>
    </>
  );
};

export default ForumPage; 