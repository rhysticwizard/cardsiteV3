import React, { useEffect, useState, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './ForumPage.css';
import './CreatePost.css';
import LocalGifPicker from '../../components/LocalGifPicker';
import EmojiPicker from '../../components/EmojiPicker';

// Categories data from CategoryPage (this would be imported in a real app)
const categories = {
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

// Subcategories data (simplified)
const subcategories: Record<string, Record<string, { name: string; icon: string }>> = {
  general: {
    introductions: { name: 'Introductions', icon: 'fa-user-plus' },
    announcements: { name: 'Announcements', icon: 'fa-bullhorn' },
    questions: { name: 'Questions & Answers', icon: 'fa-question-circle' }
  },
  strategy: {
    competitive: { name: 'Competitive Play', icon: 'fa-trophy' },
    commander: { name: 'Commander', icon: 'fa-crown' },
    'new-player': { name: 'New Player Strategies', icon: 'fa-graduation-cap' }
  }
  // ...other subcategories
};

// Posts store - in a real app this would be in a context or state management solution
type Post = {
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
  imageUrl?: string; // Legacy single image
  imageUrls?: string[]; // New multiple images
};

// Check if we have posts in localStorage, otherwise use empty array
const getStoredPosts = (): Post[] => {
  const storedPosts = localStorage.getItem('forumPosts');
  console.log('Loaded posts from storage:', storedPosts);
  return storedPosts ? JSON.parse(storedPosts) : [];
};

// Function to save posts to localStorage
const savePostsToStorage = (posts: Post[]) => {
  console.log('Saving posts to storage:', posts);
  localStorage.setItem('forumPosts', JSON.stringify(posts));
};

const CreatePost: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const initialCategory = queryParams.get('category') || 'general';
  const initialSubcategory = queryParams.get('subcategory') || '';

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState(initialCategory);
  const [subcategory, setSubcategory] = useState(initialSubcategory);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [selectedGifUrl, setSelectedGifUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showMediaOptions, setShowMediaOptions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  
  // Refs for media options popups
  const mediaOptionsRef = useRef<HTMLDivElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.title = 'Create Post - CardSite V3';
    
    // Handle clicks outside the popups
    const handleClickOutside = (event: MouseEvent) => {
      // Close media options popup when clicking outside
      if (
        mediaOptionsRef.current &&
        !mediaOptionsRef.current.contains(event.target as Node) &&
        showMediaOptions
      ) {
        setShowMediaOptions(false);
      }
      
      // Close emoji picker when clicking outside
      if (
        emojiButtonRef.current &&
        !emojiButtonRef.current.contains(event.target as Node) &&
        showEmojiPicker
      ) {
        setShowEmojiPicker(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMediaOptions, showEmojiPicker]);

  const toggleCategoryDropdown = () => {
    setCategoryDropdownOpen(!categoryDropdownOpen);
  };

  const selectCategory = (categoryId: string) => {
    setCategory(categoryId);
    setSubcategory(''); // Reset subcategory when changing category
    setCategoryDropdownOpen(false);
  };

  const selectSubcategory = (subcategoryId: string) => {
    setSubcategory(subcategoryId);
  };

  // Handle GIF selection
  const handleGifSelect = (gifUrl: string) => {
    setSelectedGifUrl(gifUrl);
    setShowGifPicker(false);
  };
  
  // Trigger file input click
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Function to handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const newFiles = Array.from(files);
    setImageFiles(prev => [...prev, ...newFiles]);
    
    // Process each file
    newFiles.forEach(file => {
      // Compress and convert the file to a base64 data URL
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result;
        if (result) {
          // Compress the image before saving
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            // Set max dimensions (800px width or height)
            const maxDimension = 800;
            let width = img.width;
            let height = img.height;
            
            // Calculate new dimensions while maintaining aspect ratio
            if (width > height && width > maxDimension) {
              height = (height * maxDimension) / width;
              width = maxDimension;
            } else if (height > maxDimension) {
              width = (width * maxDimension) / height;
              height = maxDimension;
            }
            
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              
              // Get compressed image as JPEG with reduced quality
              const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
              const originalSize = result.toString().length;
              console.log('Image compressed from', originalSize, 'to', compressedDataUrl.length, 'bytes');
              
              // Add this image URL to our array
              setImageUrls(prevUrls => [...prevUrls, compressedDataUrl]);
            }
          };
          img.src = result.toString();
        }
      };
      reader.readAsDataURL(file);
    });
  };
  
  // Clean up images
  const cleanupImages = () => {
    setImageUrls([]);
    setImageFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Insert emoji into content
  const insertEmoji = (emoji: string) => {
    const textAreaElement = document.querySelector('.form-control.post-content') as HTMLTextAreaElement;
    if (textAreaElement) {
      const start = textAreaElement.selectionStart;
      const end = textAreaElement.selectionEnd;
      const text = textAreaElement.value;
      const before = text.substring(0, start);
      const after = text.substring(end, text.length);
      
      setContent(before + emoji + after);
      
      // Focus the textarea and set cursor position after the inserted emoji
      setTimeout(() => {
        textAreaElement.focus();
        textAreaElement.selectionStart = start + emoji.length;
        textAreaElement.selectionEnd = start + emoji.length;
      }, 10);
    } else {
      setContent(prevText => prevText + emoji);
    }
    setShowEmojiPicker(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || (!content.trim() && !selectedGifUrl && imageUrls.length === 0)) {
      setError('Please provide both a title and content for your post');
      return;
    }
    
    setError(null);
    
    // Get current posts from localStorage
    const currentPosts = getStoredPosts();
    
    // Create a new post
    const newPost: Post = {
      id: Date.now(),
      category: getCategoryTitle(category),
      title: title,
      author: 'CurrentUser', // In a real app, this would be the logged-in user
      timeAgo: 'just now',
      excerpt: content.substring(0, 150) + (content.length > 150 ? '...' : ''),
      hearts: 0,
      comments: 0,
      subcategories: subcategory ? [subcategory] : [],
      categoryId: category,
      link: '#',
      gifUrl: selectedGifUrl || undefined, // Store the GIF URL if one was selected
      imageUrls: imageUrls, // Store all image URLs
      imageUrl: imageUrls.length > 0 ? imageUrls[0] : undefined // For backward compatibility
    };
    
    console.log('Creating new post with media:', { 
      hasGif: !!selectedGifUrl, 
      hasImages: imageUrls.length > 0,
      numImages: imageUrls.length,
      imageUrlsLength: imageUrls.length > 0 ? imageUrls.join(',').length : 0,
      newPost
    });
    
    try {
      // Add new post
      const updatedPosts = [newPost, ...currentPosts];
      
      // Save to localStorage
      savePostsToStorage(updatedPosts);
      console.log('Successfully saved post to localStorage');
      
      // Redirect to the post
      navigate(`/forums/post/${newPost.id}`);
    } catch (error) {
      console.error('Error saving post to localStorage:', error);
      // If the error is due to exceeding storage quota, try without the image data
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        // Create a version without potentially large data
        const newPostWithoutLargeData = {...newPost};
        
        if (imageUrls.length > 0) {
          newPostWithoutLargeData.imageUrls = [];
          newPostWithoutLargeData.imageUrl = undefined;
          alert('The images were too large to save. The post will be created without the images.');
        }
        
        const updatedPostsWithoutLargeData = [newPostWithoutLargeData, ...currentPosts];
        savePostsToStorage(updatedPostsWithoutLargeData);
        console.log('Saved post without large data');
        
        // Redirect to the post
        navigate(`/forums/post/${newPostWithoutLargeData.id}`);
      }
    }
  };

  const handleCancel = () => {
    navigate(-1); // Go back to previous page
  };

  const getCategoryIcon = (categoryId: string) => {
    return categories[categoryId as keyof typeof categories]?.icon || 'fa-folder';
  };

  const getCategoryTitle = (categoryId: string) => {
    return categories[categoryId as keyof typeof categories]?.title || 'Unknown Category';
  };

  return (
    <div className="create-post-container">
      {/* Breadcrumb navigation */}
      <div className="breadcrumb">
        <Link to="/forums">Categories</Link>
        <span className="breadcrumb-separator">&gt;</span>
        <Link to={`/forums/category/${category}`}>{getCategoryTitle(category)}</Link>
        <span className="breadcrumb-separator">&gt;</span>
        <span>Create Post</span>
      </div>

      <div className="post-creation-container">
        {/* Post form */}
        <form className="post-form" onSubmit={handleSubmit}>
          {/* Title */}
          <div className="form-group">
            <input 
              type="text" 
              className="form-control title" 
              placeholder="Title" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Category select */}
          <div className="category-select">
            <div className="category-select-header" onClick={toggleCategoryDropdown}>
              <div className="category-selected">
                <div className="category-icon-wrapper">
                  <i className={`fa ${getCategoryIcon(category)}`}></i>
                </div>
                <span>{getCategoryTitle(category)}</span>
              </div>
              <i className={`fa fa-chevron-${categoryDropdownOpen ? 'up' : 'down'}`}></i>
            </div>
            <div className={`category-options ${categoryDropdownOpen ? 'open' : ''}`}>
              {Object.entries(categories).map(([id, { title, icon }]) => (
                <div 
                  key={id} 
                  className={`category-option ${category === id ? 'selected' : ''}`}
                  onClick={() => selectCategory(id)}
                >
                  <div className="category-icon-wrapper">
                    <i className={`fa ${icon}`}></i>
                  </div>
                  <span>{title}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Subcategory options */}
          {subcategories[category] && Object.keys(subcategories[category]).length > 0 && (
            <div className="subcategory-options">
              <div className="subcategory-title">Choose a subcategory (optional):</div>
              <div className="subcategory-list">
                {Object.entries(subcategories[category]).map(([id, { name, icon }]) => (
                  <div 
                    key={id} 
                    className={`subcategory-option ${subcategory === id ? 'selected' : ''}`}
                    onClick={() => selectSubcategory(id)}
                  >
                    <i className={`fa ${icon}`}></i>
                    <span>{name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error message */}
          {error && <div className="error-message">{error}</div>}

          {/* Formatting toolbar */}
          <div className="formatting-toolbar">
            <button type="button" className="formatting-button"><i className="fa fa-bold"></i></button>
            <button type="button" className="formatting-button"><i className="fa fa-italic"></i></button>
            <button type="button" className="formatting-button"><i className="fa fa-underline"></i></button>
            <button type="button" className="formatting-button"><i className="fa fa-strikethrough"></i></button>
            <button type="button" className="formatting-button"><i className="fa fa-link"></i></button>
            <button type="button" className="formatting-button"><i className="fa fa-list-ul"></i></button>
            <button type="button" className="formatting-button"><i className="fa fa-list-ol"></i></button>
            <button type="button" className="formatting-button"><i className="fa fa-quote-left"></i></button>
            <button type="button" className="formatting-button"><i className="fa fa-code"></i></button>
          </div>

          {/* Post content textarea */}
          <div className="form-group">
            <textarea 
              className="form-control post-content" 
              placeholder="Text (required)" 
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required={!selectedGifUrl && imageUrls.length === 0}
            ></textarea>
          </div>
          
          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept="image/*"
            multiple
            onChange={handleFileUpload}
          />
          
          {/* GIF Preview */}
          {selectedGifUrl && (
            <div className="selected-gif-preview">
              <img src={selectedGifUrl} alt="Selected GIF" />
              <button 
                type="button" 
                className="remove-gif-btn"
                onClick={() => setSelectedGifUrl(null)}
              >
                &times;
              </button>
            </div>
          )}
          
          {/* Image Previews */}
          {imageUrls.length > 0 && (
            <div className="image-previews-container">
              <div className="image-previews-header">
                <h4>{imageUrls.length} {imageUrls.length === 1 ? 'Image' : 'Images'} selected</h4>
                <button 
                  type="button" 
                  className="clear-all-btn"
                  onClick={() => {
                    setImageUrls([]);
                    setImageFiles([]);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                >
                  Clear all
                </button>
              </div>
              <div className="image-previews-grid">
                {imageUrls.map((url, index) => (
                  <div key={index} className="selected-image-preview">
                    <img src={url} alt={`Selected image ${index + 1}`} />
                    <button 
                      type="button" 
                      className="remove-media-btn"
                      onClick={() => {
                        const newImageUrls = [...imageUrls];
                        newImageUrls.splice(index, 1);
                        setImageUrls(newImageUrls);
                        
                        const newImageFiles = [...imageFiles];
                        newImageFiles.splice(index, 1);
                        setImageFiles(newImageFiles);
                      }}
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Media and emoji tools */}
          <div className="comment-form-actions">
            <div className="comment-tools">
              <div ref={mediaOptionsRef} className="plus-button-wrapper">
                <button 
                  type="button" 
                  className="tool-btn plus-btn"
                  onClick={() => setShowMediaOptions(!showMediaOptions)}
                >
                  <i className="fas fa-plus"></i>
                </button>
                {showMediaOptions && (
                  <div className="media-options-popup">
                    <button 
                      type="button" 
                      className="media-option-btn"
                      onClick={() => {
                        setShowGifPicker(true);
                        setShowMediaOptions(false);
                      }}
                    >
                      <i className="fas fa-image"></i> GIF
                    </button>
                    <button 
                      type="button" 
                      className="media-option-btn"
                      onClick={() => {
                        triggerFileInput();
                        setShowMediaOptions(false);
                      }}
                    >
                      <i className="fas fa-camera"></i> Photo
                    </button>
                  </div>
                )}
              </div>
              <button 
                ref={emojiButtonRef}
                type="button" 
                className="tool-btn emoji-btn"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              >
                <i className="fas fa-smile"></i>
              </button>
              {showEmojiPicker && (
                <EmojiPicker 
                  onEmojiSelect={insertEmoji} 
                  onClose={() => setShowEmojiPicker(false)} 
                />
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={handleCancel}>Cancel</button>
            <button type="submit" className="submit-btn">Create Post</button>
          </div>
        </form>
      </div>
      
      {/* Posting to CardSite V3 info */}
      <div className="post-rules">
        <h3>Posting to CardSite V3</h3>
        <ul className="rule-list">
          <li>Remember to be respectful and follow the community guidelines</li>
          <li>No spamming or excessive self-promotion</li>
          <li>Use appropriate tags and categories for your content</li>
          <li>Posts that violate community rules may be removed</li>
        </ul>
      </div>
      
      {/* GIF Picker Modal */}
      {showGifPicker && (
        <LocalGifPicker 
          onSelect={handleGifSelect} 
          onClose={() => setShowGifPicker(false)} 
        />
      )}
    </div>
  );
};

export default CreatePost; 