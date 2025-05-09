import React from 'react';
import './HomePage.css';

const HomePage: React.FC = () => {
  return (
    <>
      <main className="container">
        {/* Featured Section */}
        <section className="featured-section">
          <div className="featured-grid">
            <div className="featured-main">
              <div className="featured-content">
                <h1>Introducing New MTG Set: Bloomburrow</h1>
                <p className="featured-date">3 min read</p>
              </div>
              <div className="image-placeholder"></div>
            </div>
            <div className="featured-secondary">
              <div className="featured-content">
                <h2>Catching hellbent with ChatGPT</h2>
                <p className="featured-date">5 min read</p>
              </div>
              <div className="image-placeholder"></div>
            </div>
          </div>
        </section>

        {/* Latest News Section */}
        <section className="news-section">
          <h2 className="section-heading">Latest news</h2>
          <div className="news-grid">
            <article className="news-card">
              <div className="image-placeholder"></div>
              <div className="news-content">
                <h3>OpenAI announces nonprofit conversation initiative</h3>
                <p className="source-date">Company · Apr 18, 2023</p>
              </div>
            </article>
            
            <article className="news-card">
              <div className="image-placeholder"></div>
              <div className="news-content">
                <h3>Our updated Preparedness Framework</h3>
                <p className="source-date">Publication · Apr 13, 2023</p>
              </div>
            </article>
            
            <article className="news-card">
              <div className="image-placeholder"></div>
              <div className="news-content">
                <h3>BrowserGPT: A benchmark for browsing agents</h3>
                <p className="source-date">Publication · Apr 10, 2023</p>
              </div>
            </article>
          </div>
          <div className="view-all">
            <a href="#">View all</a>
          </div>
        </section>

        {/* Twitch Creators */}
        <section className="creators-section">
          <h2 className="section-heading">Twitch Streamers</h2>
          <div className="creators-grid">
            <article className="creator-card">
              <div className="image-placeholder"></div>
              <div className="creator-content">
                <h3>MTGNerdGirl</h3>
                <p className="creator-type">Streamer · Twitch</p>
              </div>
            </article>
            
            <article className="creator-card">
              <div className="image-placeholder"></div>
              <div className="creator-content">
                <h3>NumotTheNummy</h3>
                <p className="creator-type">Streamer · Twitch</p>
              </div>
            </article>
            
            <article className="creator-card">
              <div className="image-placeholder"></div>
              <div className="creator-content">
                <h3>LoadingReadyRun</h3>
                <p className="creator-type">Content · Twitch</p>
              </div>
            </article>
          </div>
          <div className="view-all">
            <a href="#">View all</a>
          </div>
        </section>

        {/* YouTube Creators */}
        <section className="creators-section">
          <h2 className="section-heading">YouTube Creators</h2>
          <div className="creators-grid">
            <article className="creator-card">
              <div className="image-placeholder"></div>
              <div className="creator-content">
                <h3>The Command Zone</h3>
                <p className="creator-type">Content · YouTube</p>
              </div>
            </article>
            
            <article className="creator-card">
              <div className="image-placeholder"></div>
              <div className="creator-content">
                <h3>Tolarian Community College</h3>
                <p className="creator-type">Education · YouTube</p>
              </div>
            </article>
            
            <article className="creator-card">
              <div className="image-placeholder"></div>
              <div className="creator-content">
                <h3>MTG Goldfish</h3>
                <p className="creator-type">Budget · YouTube</p>
              </div>
            </article>
          </div>
          <div className="view-all">
            <a href="#">View all</a>
          </div>
        </section>

        {/* Blog Authors */}
        <section className="creators-section">
          <h2 className="section-heading">MTG Blogs</h2>
          <div className="creators-grid">
            <article className="creator-card">
              <div className="image-placeholder"></div>
              <div className="creator-content">
                <h3>Star City Games</h3>
                <p className="creator-type">Strategy · Blog</p>
              </div>
            </article>
            
            <article className="creator-card">
              <div className="image-placeholder"></div>
              <div className="creator-content">
                <h3>Channel Fireball</h3>
                <p className="creator-type">Pro · Blog</p>
              </div>
            </article>
            
            <article className="creator-card">
              <div className="image-placeholder"></div>
              <div className="creator-content">
                <h3>MTG Salvation</h3>
                <p className="creator-type">Community · Blog</p>
              </div>
            </article>
          </div>
          <div className="view-all">
            <a href="#">View all</a>
          </div>
        </section>

        {/* Stories Section */}
        <section className="stories-section">
          <h2 className="section-heading">Stories</h2>
          <div className="stories-grid">
            <article className="story-card large">
              <div className="image-placeholder"></div>
              <div className="story-overlay">
                <h3>Lyceum Round 8 Story: Magic in Modern Competitive Play</h3>
                <p className="story-details">Lore · Oct 4, 2023 · 6 min read</p>
              </div>
            </article>
            
            <article className="story-card">
              <div className="image-placeholder"></div>
              <div className="story-overlay">
                <h3>Building a custom meta tutor powered by ChatGPT</h3>
                <p className="story-details">Company · Oct 3, 2023 · 12 min read</p>
              </div>
            </article>
            
            <article className="story-card">
              <div className="image-placeholder"></div>
              <div className="story-overlay">
                <h3>Economics and reasoning with Claude AI</h3>
                <p className="story-details">Research · May 25, 2023 · 21 min read</p>
              </div>
            </article>
          </div>
          <div className="view-all">
            <a href="#">View all</a>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <h3 className="footer-heading">Game Formats</h3>
              <ul className="footer-links">
                <li><a href="#">Standard</a></li>
                <li><a href="#">Modern</a></li>
                <li><a href="#">Commander</a></li>
                <li><a href="#">Legacy</a></li>
                <li><a href="#">Limited</a></li>
              </ul>
            </div>

            <div className="footer-section">
              <h3 className="footer-heading">Content</h3>
              <ul className="footer-links">
                <li><a href="#">News</a></li>
                <li><a href="#">Articles</a></li>
                <li><a href="#">Deck Tech</a></li>
                <li><a href="#">Spoilers</a></li>
                <li><a href="#">Tournaments</a></li>
              </ul>
            </div>

            <div className="footer-section">
              <h3 className="footer-heading">Community</h3>
              <ul className="footer-links">
                <li><a href="#">Forums</a></li>
                <li><a href="#">Discord</a></li>
                <li><a href="#">Events</a></li>
                <li><a href="#">Find Players</a></li>
              </ul>
            </div>

            <div className="footer-section">
              <h3 className="footer-heading">Resources</h3>
              <ul className="footer-links">
                <li><a href="#">Card Database</a></li>
                <li><a href="#">Rules</a></li>
                <li><a href="#">Banned List</a></li>
                <li><a href="#">Price Guide</a></li>
              </ul>
            </div>

            <div className="footer-section">
              <h3 className="footer-heading">About</h3>
              <ul className="footer-links">
                <li><a href="#">Our Team</a></li>
                <li><a href="#">Contact</a></li>
                <li><a href="#">Terms of Use</a></li>
                <li><a href="#">Privacy Policy</a></li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <div className="social-links">
              <a href="#" aria-label="Twitter"><i className="fab fa-twitter"></i></a>
              <a href="#" aria-label="YouTube"><i className="fab fa-youtube"></i></a>
              <a href="#" aria-label="Discord"><i className="fab fa-discord"></i></a>
              <a href="#" aria-label="Twitch"><i className="fab fa-twitch"></i></a>
              <a href="#" aria-label="Instagram"><i className="fab fa-instagram"></i></a>
              <a href="#" aria-label="GitHub"><i className="fab fa-github"></i></a>
            </div>
            <div className="copyright">
              <p>MTG Community Hub © 2023-2024</p>
            </div>
            <div className="language-selector">
              <select>
                <option>English</option>
                <option>Español</option>
                <option>Français</option>
                <option>Deutsch</option>
                <option>日本語</option>
              </select>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default HomePage; 