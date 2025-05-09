import React, { useEffect, useState, useRef } from 'react';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import './ForumPage.css';
import './PostPage.css'; // We'll create this file next
import LocalGifPicker from '../../components/LocalGifPicker';
import EmojiPicker from '../../components/EmojiPicker';
import ImageCarousel from '../../components/ImageCarousel';

// Types
interface Post {
  id: number;
  category: string;
  title: string;
  author: string;
  timeAgo: string;
  excerpt: string;
  content?: string; // Full content
  hearts: number;
  comments: number;
  link: string;
  subcategories: string[];
  categoryId: string;
  gifUrl?: string; // Add this field for GIF attachments
  imageUrl?: string; // Add this field for image attachments (legacy)
  imageUrls?: string[]; // Array of image URLs for slideshow
  reactions?: Record<string, Reaction>;
}

interface Comment {
  id: number;
  postId: number;
  author: string;
  content: string;
  timeAgo: string;
  hearts: number;
  replies: Comment[];
  parentId?: number; // ID of parent comment (if this is a reply)
  gifUrl?: string; // GIF attachments
  imageUrl?: string; // Image attachments
  links?: { url: string; title: string }[]; // Links in the comment
  reactions?: Record<string, Reaction>;
}

interface Reaction {
  emoji: string;
  count: number;
  users: string[]; // usernames who reacted
}

// Helper function to load posts from localStorage
const getStoredPosts = (): Post[] => {
  const storedPosts = localStorage.getItem('forumPosts');
  console.log('PostPage - Loading posts from storage:', storedPosts ? 'Found data' : 'No data');
  return storedPosts ? JSON.parse(storedPosts) : [];
};

// Helper function to load comments from localStorage
const getStoredComments = (): Comment[] => {
  const storedComments = localStorage.getItem('forumComments');
  return storedComments ? JSON.parse(storedComments) : [];
};

// Helper function to save comments to localStorage
const saveCommentsToStorage = (comments: Comment[]) => {
  localStorage.setItem('forumComments', JSON.stringify(comments));
};

// Maximum depth for displaying nested comments before showing "Continue this thread" link
const MAX_NESTED_COMMENTS_DEPTH = 3;
// Maximum number of replies to show initially
const MAX_VISIBLE_REPLIES = 3;

// Categories data
const categories: Record<string, { title: string; icon: string }> = {
  general: { title: 'General Discussion', icon: 'fa-comments' },
  strategy: { title: 'Strategy & Gameplay', icon: 'fa-chess' },
  deckbuilding: { title: 'Deck Building', icon: 'fa-layer-group' },
  rules: { title: 'Rules & Rulings', icon: 'fa-book' },
  humor: { title: 'Jokes & Humor', icon: 'fa-laugh' }
};

const PostPage: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [expandedComments, setExpandedComments] = useState<Record<number, boolean>>({});
  const [commentSorting, setCommentSorting] = useState<'latest' | 'popular'>('latest');
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [selectedGifUrl, setSelectedGifUrl] = useState<string | null>(null);
  const [showImageInput, setShowImageInput] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState<string>('');
  const [linkTitle, setLinkTitle] = useState<string>('');
  const [replyShowImageInput, setReplyShowImageInput] = useState(false);
  const [replyImageUrl, setReplyImageUrl] = useState<string>('');
  const [replyImageFile, setReplyImageFile] = useState<File | null>(null);
  const [showMediaOptions, setShowMediaOptions] = useState(false);
  const [showReplyMediaOptions, setShowReplyMediaOptions] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showReplyEmojiPicker, setShowReplyEmojiPicker] = useState(false);
  const [showCommentMoreOptions, setShowCommentMoreOptions] = useState<number | null>(null);
  const [showPostReactionPicker, setShowPostReactionPicker] = useState(false);
  const [showCommentReactionPicker, setShowCommentReactionPicker] = useState<number | null>(null);
  const [isPostSaved, setIsPostSaved] = useState(false);
  
  // Refs for media options popups
  const mediaOptionsRef = useRef<HTMLDivElement>(null);
  const replyMediaOptionsRef = useRef<HTMLDivElement>(null);
  const shareOptionsRef = useRef<HTMLDivElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  const replyEmojiButtonRef = useRef<HTMLButtonElement>(null);
  const moreOptionsRef = useRef<HTMLDivElement>(null);
  const postReactionRef = useRef<HTMLDivElement>(null);
  const commentReactionRef = useRef<HTMLDivElement>(null);
  
  // Load user likes on component mount
  useEffect(() => {
    // Check if post is saved
    const savedPosts = JSON.parse(localStorage.getItem('savedPosts') || '[]');
    if (postId && savedPosts.includes(Number(postId))) {
      setIsPostSaved(true);
    }
  }, [postId]);
  
  useEffect(() => {
    const fetchPost = () => {
      setLoading(true);
      
      try {
        // Get all posts from storage
        const posts = getStoredPosts();
        console.log('PostPage - All loaded posts:', posts.length);
        
        // Find the specific post
        const foundPost = posts.find(p => p.id === Number(postId));
        console.log('PostPage - Found post object:', foundPost);
        
        if (foundPost) {
          // Explicitly check for media URLs
          console.log('DEBUG - Media URL check:', {
            gifUrl: foundPost.gifUrl || 'MISSING',
            imageUrl: foundPost.imageUrl || 'MISSING',
            properties: Object.keys(foundPost)
          });
          
          setPost(foundPost);
          
          // Add a dummy content if none exists
          if (!foundPost.content) {
            // If no full content exists, use the excerpt
            foundPost.content = foundPost.excerpt + "\n\nThis is additional content that would be part of the full post. In a real application, the complete post content would be stored and displayed here. The content can include formatted text, links, images, and other rich media elements.";
          }
          
          // Get comments for this post from localStorage
          const allComments = getStoredComments();
          
          // Organize comments and replies
          const topLevelComments = allComments.filter(c => c.postId === Number(postId) && !c.parentId);
          const replies = allComments.filter(c => c.postId === Number(postId) && c.parentId);
          
          // Build comment tree structure
          let commentTree = topLevelComments.map(comment => {
            return {
              ...comment,
              replies: buildCommentReplies(comment.id, replies)
            };
          });
          
          setComments(commentTree);
        } else {
          setError('Post not found');
        }
      } catch (err) {
        setError('Error loading post');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    // Helper function to recursively build the comment tree
    const buildCommentReplies = (parentId: number, allReplies: Comment[]): Comment[] => {
      const directReplies = allReplies.filter(reply => reply.parentId === parentId);
      
      return directReplies.map(reply => {
        return {
          ...reply,
          replies: buildCommentReplies(reply.id, allReplies)
        };
      });
    };
    
    fetchPost();
  }, [postId]);
  
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    
    if ((!commentText.trim() && !selectedGifUrl && !imageUrl) || !post) return;
    
    // Create a new comment with optional media
    const newComment: Comment = {
      id: Date.now(),
      postId: post.id,
      author: 'CurrentUser', // In a real app, this would be the logged-in user
      content: commentText,
      timeAgo: 'just now',
      hearts: 0,
      replies: [],
      reactions: {} // Initialize empty reactions object
    };
    
    // Add the GIF if one was selected
    if (selectedGifUrl) {
      newComment.gifUrl = selectedGifUrl;
    }
    
    // Add image if provided
    if (imageUrl.trim()) {
      newComment.imageUrl = imageUrl;
    }
    
    // Add link if provided
    if (linkUrl.trim()) {
      newComment.links = [{ url: linkUrl, title: linkTitle || linkUrl }];
    }
    
    // Add the comment to the state based on current sorting
    let updatedComments;
    if (commentSorting === 'latest') {
      // Latest first - new comment goes at top
      updatedComments = [newComment, ...comments];
    } else {
      // Popular first - new comment likely goes at end (0 hearts)
      updatedComments = [...comments, newComment];
    }
    
    setComments(updatedComments);
    
    // Reset form
    setCommentText('');
    setSelectedGifUrl(null);
    cleanupImage();
    setShowLinkInput(false);
    setLinkUrl('');
    setLinkTitle('');
    
    // Save all comments to localStorage
    const allComments = getStoredComments();
    // Extract all nested comments into a flat structure
    const flatComments = flattenComments(updatedComments);
    // Combine with comments from other posts
    const otherComments = allComments.filter(c => c.postId !== post.id);
    saveCommentsToStorage([...otherComments, ...flatComments]);
    
    // Update post comment count in localStorage
    const allPosts = getStoredPosts();
    const updatedPosts = allPosts.map(p => {
      if (p.id === post.id) {
        return { ...p, comments: p.comments + 1 };
      }
      return p;
    });
    localStorage.setItem('forumPosts', JSON.stringify(updatedPosts));
    
    // Update the post in state
    setPost(prev => prev ? { ...prev, comments: prev.comments + 1 } : null);
  };
  
  // Helper function to flatten nested comments for storage
  const flattenComments = (nestedComments: Comment[]): Comment[] => {
    let result: Comment[] = [];
    
    nestedComments.forEach(comment => {
      // Create a copy without replies but ensure the reply property exists
      const { replies, ...commentWithoutReplies } = comment;
      result.push({
        ...commentWithoutReplies,
        replies: [] // Add empty replies array to fix type error
      });
      
      if (replies && replies.length > 0) {
        result = [...result, ...flattenComments(replies)];
      }
    });
    
    return result;
  };
  
  // Handle GIF selection
  const handleGifSelect = (gifUrl: string) => {
    setSelectedGifUrl(gifUrl);
    setShowGifPicker(false);
  };
  
  // Function to handle image file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      
      // Convert the file to a base64 data URL
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && event.target.result) {
          setImageUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Handle file upload for replies
  const handleReplyFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReplyImageFile(file);
      
      // Convert the file to a base64 data URL
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && event.target.result) {
          setReplyImageUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Handle submitting a reply to a comment
  const handleAddReply = (e: React.FormEvent) => {
    e.preventDefault();
    
    if ((!replyText.trim() && !selectedGifUrl && !replyImageUrl) || replyingTo === null || !post) return;
    
    // Create a new reply
    const newReply: Comment = {
      id: Date.now(),
      postId: post.id,
      parentId: replyingTo,
      author: 'CurrentUser', // In a real app, this would be the logged-in user
      content: replyText,
      timeAgo: 'just now',
      hearts: 0,
      replies: [],
      reactions: {} // Initialize empty reactions object
    };
    
    // Add the GIF if one was selected
    if (selectedGifUrl) {
      newReply.gifUrl = selectedGifUrl;
    }
    
    // Add image if provided
    if (replyImageUrl.trim()) {
      newReply.imageUrl = replyImageUrl;
    }
    
    // Add the reply to the comment tree
    const updatedComments = addReplyToCommentTree(comments, replyingTo, newReply);
    setComments(updatedComments);
    
    // Reset form
    setReplyText('');
    setReplyingTo(null);
    setSelectedGifUrl(null); // Clear the selected GIF
    cleanupReplyImage();
    
    // Save all comments to localStorage
    const allComments = getStoredComments();
    // Extract all nested comments into a flat structure
    const flatComments = flattenComments(updatedComments);
    // Combine with comments from other posts
    const otherComments = allComments.filter(c => c.postId !== post.id);
    saveCommentsToStorage([...otherComments, ...flatComments]);
    
    // Update post comment count in localStorage
    const allPosts = getStoredPosts();
    const updatedPosts = allPosts.map(p => {
      if (p.id === post.id) {
        return { ...p, comments: p.comments + 1 };
      }
      return p;
    });
    localStorage.setItem('forumPosts', JSON.stringify(updatedPosts));
    
    // Update the post in state
    setPost(prev => prev ? { ...prev, comments: prev.comments + 1 } : null);
  };
  
  // Helper function to add a reply to the correct place in the comment tree
  const addReplyToCommentTree = (commentTree: Comment[], parentId: number, newReply: Comment): Comment[] => {
    return commentTree.map(comment => {
      if (comment.id === parentId) {
        // Add reply to this comment based on current sorting
        let updatedReplies;
        if (commentSorting === 'latest') {
          // Add new reply at the beginning for latest sorting
          updatedReplies = [newReply, ...comment.replies];
        } else {
          // Add new reply at the end for popular sorting (0 hearts)
          updatedReplies = [...comment.replies, newReply];
        }
        
        return {
          ...comment,
          replies: updatedReplies
        };
      } else if (comment.replies && comment.replies.length > 0) {
        // Check in the replies
        return {
          ...comment,
          replies: addReplyToCommentTree(comment.replies, parentId, newReply)
        };
      }
      return comment;
    });
  };
  
  // Toggle expanding a comment to show more replies
  const toggleExpandComment = (commentId: number) => {
    setExpandedComments(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };
  
  // Function to navigate to a dedicated thread page
  const viewThread = (commentId: number) => {
    // In a real implementation, this would navigate to a dedicated thread view
    // For now, we'll just alert the user
    alert(`In a full implementation, this would navigate to a dedicated page for thread #${commentId}`);
    
    // Example of how this would be implemented:
    // navigate(`/forums/post/${postId}/comment/${commentId}`);
  };
  
  // Add a function to sort comments based on selected sorting option
  const sortComments = (commentsToSort: Comment[]): Comment[] => {
    const sortedComments = [...commentsToSort];
    
    if (commentSorting === 'latest') {
      // Sort by newest first (assuming id is related to creation time)
      sortedComments.sort((a, b) => b.id - a.id);
    } else {
      // Sort by most hearts/likes (kept for backward compatibility with existing data)
      sortedComments.sort((a, b) => b.hearts - a.hearts);
    }
    
    // Apply the same sorting to nested replies
    return sortedComments.map(comment => ({
      ...comment,
      replies: comment.replies.length > 0 ? sortComments(comment.replies) : []
    }));
  };
  
  // Create a file input ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replyFileInputRef = useRef<HTMLInputElement>(null);
  
  // Function to trigger file dialog
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Function to trigger reply file dialog
  const triggerReplyFileInput = () => {
    if (replyFileInputRef.current) {
      replyFileInputRef.current.click();
    }
  };
  
  // Function to handle image upload
  const handleImageUpload = () => {
    if (!imageFile) {
      setShowImageInput(false);
      return;
    }
    
    // For now, we're just displaying the local URL
    // In a real app, you'd upload the file to a server here
    // and then use the returned URL
    
    // Keep the image preview open
  };
  
  // Add a similar function for handling link submission
  const handleLinkSubmit = () => {
    if (!linkUrl.trim()) {
      setShowLinkInput(false);
      return;
    }
    
    // Validate URL format
    try {
      new URL(linkUrl);
    } catch (e) {
      alert('Please enter a valid URL');
      return;
    }
    
    // Keep the input open in case they want to adjust it
  };
  
  // Handle click outside to close popups
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Close media options popup if click is outside
      if (
        mediaOptionsRef.current && 
        !mediaOptionsRef.current.contains(event.target as Node) &&
        showMediaOptions
      ) {
        setShowMediaOptions(false);
      }
      
      // Close reply media options popup if click is outside
      if (
        replyMediaOptionsRef.current && 
        !replyMediaOptionsRef.current.contains(event.target as Node) &&
        showReplyMediaOptions
      ) {
        setShowReplyMediaOptions(false);
      }
      
      // Close share options popup if click is outside
      if (
        shareOptionsRef.current && 
        !shareOptionsRef.current.contains(event.target as Node) &&
        showShareOptions
      ) {
        setShowShareOptions(false);
      }
      
      // Close comment more options if click is outside
      if (
        moreOptionsRef.current && 
        !moreOptionsRef.current.contains(event.target as Node) &&
        showCommentMoreOptions !== null
      ) {
        setShowCommentMoreOptions(null);
      }
      
      // Close post reaction picker if click is outside
      if (
        postReactionRef.current && 
        !postReactionRef.current.contains(event.target as Node) &&
        showPostReactionPicker
      ) {
        setShowPostReactionPicker(false);
      }
      
      // Close comment reaction picker if click is outside
      if (
        commentReactionRef.current && 
        !commentReactionRef.current.contains(event.target as Node) &&
        showCommentReactionPicker !== null
      ) {
        setShowCommentReactionPicker(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [
    showMediaOptions, 
    showReplyMediaOptions, 
    showShareOptions, 
    showCommentMoreOptions,
    showPostReactionPicker,
    showCommentReactionPicker
  ]);
  
  // Update cleanup functions to not use URL.revokeObjectURL since we're using base64
  const cleanupImage = () => {
    setImageFile(null);
    setImageUrl('');
  };
  
  const cleanupReplyImage = () => {
    setReplyImageFile(null);
    setReplyImageUrl('');
  };
  
  // Remove the cleanup in useEffect since we don't need to revoke URLs
  useEffect(() => {
    return () => {
      // No need to cleanup base64 URLs
    };
  }, []);
  
  // Function to show a toast notification
  const showToast = (message: string) => {
    setToastMessage(message);
    
    // Hide the toast after 3 seconds
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };
  
  // Function to copy post link to clipboard
  const copyPostLink = () => {
    const postUrl = window.location.href;
    navigator.clipboard.writeText(postUrl)
      .then(() => {
        showToast('Link copied to clipboard!');
        setShowShareOptions(false);
      })
      .catch(err => {
        console.error('Failed to copy link: ', err);
        showToast('Failed to copy link');
      });
  };
  
  // Function to get embed code
  const getEmbedCode = () => {
    const postUrl = window.location.href;
    const embedCode = `<iframe src="${postUrl}" width="100%" height="500" frameborder="0"></iframe>`;
    
    navigator.clipboard.writeText(embedCode)
      .then(() => {
        showToast('Embed code copied to clipboard!');
        setShowShareOptions(false);
      })
      .catch(err => {
        console.error('Failed to copy embed code: ', err);
        showToast('Failed to copy embed code');
      });
  };
  
  // Function to insert emoji into text
  const insertEmoji = (emoji: string) => {
    const textAreaElement = document.querySelector('textarea') as HTMLTextAreaElement;
    if (textAreaElement) {
      const start = textAreaElement.selectionStart;
      const end = textAreaElement.selectionEnd;
      const text = textAreaElement.value;
      const before = text.substring(0, start);
      const after = text.substring(end, text.length);
      
      setCommentText(before + emoji + after);
      
      // Focus the textarea and set cursor position after the inserted emoji
      setTimeout(() => {
        textAreaElement.focus();
        textAreaElement.selectionStart = start + emoji.length;
        textAreaElement.selectionEnd = start + emoji.length;
      }, 10);
    } else {
      setCommentText(prevText => prevText + emoji);
    }
    setShowEmojiPicker(false);
  };
  
  // Function to insert emoji into reply text
  const insertReplyEmoji = (emoji: string) => {
    const textAreaElement = document.querySelector('.reply-form textarea') as HTMLTextAreaElement;
    if (textAreaElement) {
      const start = textAreaElement.selectionStart;
      const end = textAreaElement.selectionEnd;
      const text = textAreaElement.value;
      const before = text.substring(0, start);
      const after = text.substring(end, text.length);
      
      setReplyText(before + emoji + after);
      
      // Focus the textarea and set cursor position after the inserted emoji
      setTimeout(() => {
        textAreaElement.focus();
        textAreaElement.selectionStart = start + emoji.length;
        textAreaElement.selectionEnd = start + emoji.length;
      }, 10);
    } else {
      setReplyText(prevText => prevText + emoji);
    }
    setShowReplyEmojiPicker(false);
  };
  
  // Helper function to check if text contains a sticker reference
  const hasStickerReference = (text: string) => {
    return text.includes('![sticker](');
  };
  
  // Helper function to extract sticker URL from markdown-like syntax
  const extractStickerUrl = (text: string): string[] => {
    const regex = /!\[sticker\]\(([^)]+)\)/g;
    const matches: string[] = [];
    let match;
    
    while ((match = regex.exec(text)) !== null) {
      matches.push(match[1]);
    }
    
    return matches;
  };
  
  // Helper function to get text without sticker references
  const getTextWithoutStickers = (text: string) => {
    return text.replace(/!\[sticker\]\([^)]+\)/g, '');
  };
  
  // Edit comment function
  const handleEditComment = (commentId: number) => {
    alert(`Edit comment functionality would be implemented here for comment #${commentId}`);
    setShowCommentMoreOptions(null);
  };
  
  // Forward comment function
  const handleForwardComment = (commentId: number) => {
    alert(`Forward comment functionality would be implemented here for comment #${commentId}`);
    setShowCommentMoreOptions(null);
  };
  
  // Report comment function
  const handleReportComment = (commentId: number) => {
    alert(`Report comment functionality would be implemented here for comment #${commentId}`);
    setShowCommentMoreOptions(null);
  };
  
  // Delete comment function
  const handleDeleteComment = (commentId: number) => {
    // Confirm deletion with user
    if (!window.confirm('Are you sure you want to delete this comment? This action cannot be undone.')) {
      return;
    }
    
    if (!post) return;
    
    // Helper to count total comments and replies that will be deleted
    const countDeletedComments = (commentTree: Comment[], idToDelete: number): number => {
      let count = 0;
      
      for (const comment of commentTree) {
        if (comment.id === idToDelete) {
          // Count this comment
          count += 1;
          // Also count all nested replies
          count += countAllReplies(comment.replies);
          return count;
        }
        
        if (comment.replies && comment.replies.length > 0) {
          count += countDeletedComments(comment.replies, idToDelete);
        }
      }
      
      return count;
    };
    
    // Helper to count all replies in a comment tree
    const countAllReplies = (replies: Comment[]): number => {
      let count = 0;
      
      for (const reply of replies) {
        // Count this reply
        count += 1;
        // Count nested replies recursively
        if (reply.replies && reply.replies.length > 0) {
          count += countAllReplies(reply.replies);
        }
      }
      
      return count;
    };
    
    // Remove the comment from state
    const removeCommentFromTree = (commentTree: Comment[], idToDelete: number): [Comment[], boolean] => {
      let wasDeleted = false;
      
      // Filter out the comment to delete
      const filteredComments = commentTree.filter(comment => {
        if (comment.id === idToDelete) {
          wasDeleted = true;
          return false; // Remove this comment
        }
        return true;
      });
      
      // Process remaining comments to check for the comment in replies
      const processedComments = filteredComments.map(comment => {
        if (comment.replies && comment.replies.length > 0) {
          const [updatedReplies, deletedInReplies] = removeCommentFromTree(comment.replies, idToDelete);
          if (deletedInReplies) {
            wasDeleted = true;
          }
          return { ...comment, replies: updatedReplies };
        }
        return comment;
      });
      
      return [processedComments, wasDeleted];
    };
    
    // Count how many comments will be deleted (including replies)
    const deletedCount = countDeletedComments(comments, commentId);
    
    if (deletedCount === 0) {
      console.error('Could not find comment to delete:', commentId);
      showToast('Error: Could not find the comment to delete');
      setShowCommentMoreOptions(null);
      return;
    }
    
    const [updatedComments, deleted] = removeCommentFromTree(comments, commentId);
    
    if (deleted) {
      // Update UI state
      setComments(updatedComments);
      
      // Update localStorage - remove the comment and all its replies
      const allComments = getStoredComments();
      
      // Get IDs of all comments to be deleted
      const getCommentAndReplyIds = (commentTree: Comment[], targetId: number): number[] => {
        const result: number[] = [];
        
        const findAndCollect = (comments: Comment[], id: number) => {
          for (const comment of comments) {
            if (comment.id === id) {
              // Add this comment
              result.push(comment.id);
              
              // Add all replies recursively
              const addReplies = (replies: Comment[]) => {
                for (const reply of replies) {
                  result.push(reply.id);
                  if (reply.replies && reply.replies.length > 0) {
                    addReplies(reply.replies);
                  }
                }
              };
              
              if (comment.replies && comment.replies.length > 0) {
                addReplies(comment.replies);
              }
              
              return true;
            }
            
            if (comment.replies && comment.replies.length > 0) {
              if (findAndCollect(comment.replies, id)) {
                return true;
              }
            }
          }
          
          return false;
        };
        
        findAndCollect(commentTree, targetId);
        return result;
      };
      
      const idsToDelete = getCommentAndReplyIds(comments, commentId);
      const filteredComments = allComments.filter(c => !idsToDelete.includes(c.id));
      saveCommentsToStorage(filteredComments);
      
      // Update post comment count
      const allPosts = getStoredPosts();
      const updatedPosts = allPosts.map(p => {
        if (p.id === post.id) {
          return { ...p, comments: Math.max(0, p.comments - deletedCount) };
        }
        return p;
      });
      localStorage.setItem('forumPosts', JSON.stringify(updatedPosts));
      
      // Update post state
      setPost(prev => prev ? { ...prev, comments: Math.max(0, prev.comments - deletedCount) } : null);
      
      // Show success message
      const message = deletedCount > 1 
        ? `Comment and ${deletedCount - 1} replies deleted` 
        : 'Comment deleted successfully';
      showToast(message);
    } else {
      console.error('Failed to delete comment:', commentId);
      showToast('Error: Failed to delete the comment');
    }
    
    // Close the options menu
    setShowCommentMoreOptions(null);
  };
  
  // Render comment function with nesting support
  const renderComment = (comment: Comment, depth = 0) => (
    <div className="comment" key={comment.id}>
      <div className="comment-header">
        <div className="comment-author">{comment.author}</div>
        <div className="comment-time">{comment.timeAgo}</div>
      </div>
      <div className="comment-content">
        {hasStickerReference(comment.content) 
          ? renderCommentContent(comment.content)
          : comment.content
        }
        
        {/* Display GIF if present */}
        {comment.gifUrl && (
          <div className="comment-gif">
            <img 
              src={comment.gifUrl} 
              alt="GIF" 
              className="comment-media"
              title="Click to view full size" 
              onClick={() => window.open(comment.gifUrl, '_blank')} 
              style={{ cursor: 'pointer' }}
            />
          </div>
        )}
        
        {/* Display image if present */}
        {comment.imageUrl && (
          <div className="comment-image">
            <img 
              src={comment.imageUrl} 
              alt="User provided image" 
              className="comment-media"
              title="Click to view full size" 
              onClick={() => window.open(comment.imageUrl, '_blank')}
              style={{ cursor: 'pointer' }} 
            />
          </div>
        )}
        
        {/* Display links if present */}
        {comment.links && comment.links.length > 0 && (
          <div className="comment-links">
            {comment.links.map((link, index) => (
              <a 
                key={index} 
                href={link.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="comment-link"
              >
                <i className="fas fa-link"></i> {link.title || link.url}
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Display comment reactions if any */}
      {comment.reactions && Object.keys(comment.reactions).length > 0 && (
        <div className="comment-reactions">
          {Object.values(comment.reactions).map((reaction) => (
            <button 
              key={reaction.emoji} 
              className={`reaction-badge ${reaction.users && reaction.users.includes('CurrentUser') ? 'user-reacted' : ''}`}
              onClick={() => handleCommentReaction(comment.id, reaction.emoji)}
            >
              {reaction.emoji} {reaction.count}
            </button>
          ))}
        </div>
      )}
      
      {/* Comment actions */}
      <div className="comment-actions">
        <div className="action-buttons">
          {/* Reaction button - moved to appear first */}
          <div ref={commentReactionRef} className="reaction-picker-wrapper">
            <button 
              className="comment-action-btn"
              onClick={() => setShowCommentReactionPicker(
                showCommentReactionPicker === comment.id ? null : comment.id
              )}
            >
              <i className="fas fa-smile"></i> React
            </button>
            
            {showCommentReactionPicker === comment.id && (
              <div className="reaction-picker-popup">
                {reactionEmojis.map(emoji => (
                  <button
                    key={emoji}
                    className="reaction-emoji-btn"
                    onClick={() => handleCommentReaction(comment.id, emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Reply button */}
          <button 
            className="comment-action-btn"
            onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
          >
            <i className="fas fa-reply"></i> Reply
          </button>
          
          {/* More options button */}
          <div className="more-options-wrapper">
            <button 
              className="comment-action-btn"
              onClick={() => setShowCommentMoreOptions(
                showCommentMoreOptions === comment.id ? null : comment.id
              )}
            >
              <i className="fas fa-ellipsis-h"></i> More
            </button>
            
            {showCommentMoreOptions === comment.id && (
              <div className="more-options-popup">
                <button 
                  className="more-option-btn" 
                  onClick={() => handleEditComment(comment.id)}
                >
                  <i className="fas fa-pencil-alt"></i> Edit
                </button>
                <button 
                  className="more-option-btn" 
                  onClick={() => handleForwardComment(comment.id)}
                >
                  <i className="fas fa-share"></i> Forward
                </button>
                <button 
                  className="more-option-btn" 
                  onClick={() => handleReportComment(comment.id)}
                >
                  <i className="fas fa-flag"></i> Report
                </button>
                <button 
                  className="more-option-btn" 
                  onClick={() => handleDeleteComment(comment.id)}
                >
                  <i className="fas fa-trash"></i> Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Show reply form when replying to this comment */}
      {replyingTo === comment.id && (
        <div className="reply-form-container">
          <form onSubmit={handleAddReply} className="reply-form">
            <textarea 
              placeholder={`Reply to ${comment.author}...`}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              required={!selectedGifUrl && !replyImageUrl}
            ></textarea>
            
            {/* Preview selected GIF */}
            {selectedGifUrl && (
              <div className="selected-gif-preview">
                <img src={selectedGifUrl} alt="Selected GIF" />
                <button 
                  type="button" 
                  className="remove-media-btn"
                  onClick={() => setSelectedGifUrl(null)}
                >
                  &times;
                </button>
              </div>
            )}
            
            {/* Image preview */}
            {replyImageUrl && (
              <div className="selected-image-preview">
                <img src={replyImageUrl} alt="Image preview" />
                <button 
                  type="button" 
                  className="remove-media-btn"
                  onClick={cleanupReplyImage}
                >
                  &times;
                </button>
              </div>
            )}
            
            {/* Hidden file input for replies */}
            <input
              type="file"
              ref={replyFileInputRef}
              style={{ display: 'none' }}
              accept="image/*"
              onChange={handleReplyFileChange}
            />
            
            <div className="reply-form-actions">
              <div className="reply-tools">
                <div ref={replyMediaOptionsRef} className="plus-button-wrapper">
                  <button 
                    type="button" 
                    className="tool-btn plus-btn"
                    onClick={() => setShowReplyMediaOptions(!showReplyMediaOptions)}
                  >
                    <i className="fas fa-plus"></i>
                  </button>
                  {showReplyMediaOptions && (
                    <div className="media-options-popup">
                      <button 
                        type="button" 
                        className="media-option-btn"
                        onClick={() => {
                          setShowGifPicker(true);
                          setShowReplyMediaOptions(false);
                        }}
                      >
                        <i className="fas fa-image"></i> GIF
                      </button>
                      <button 
                        type="button" 
                        className="media-option-btn"
                        onClick={() => {
                          triggerReplyFileInput();
                          setShowReplyMediaOptions(false);
                        }}
                      >
                        <i className="fas fa-camera"></i> Photo
                      </button>
                    </div>
                  )}
                </div>
                <button 
                  ref={replyEmojiButtonRef}
                  type="button" 
                  className="tool-btn emoji-btn"
                  onClick={() => setShowReplyEmojiPicker(!showReplyEmojiPicker)}
                >
                  <i className="fas fa-smile"></i>
                </button>
                {showReplyEmojiPicker && (
                  <EmojiPicker 
                    onEmojiSelect={insertReplyEmoji} 
                    onClose={() => setShowReplyEmojiPicker(false)} 
                  />
                )}
              </div>
              <div className="reply-buttons">
                <button 
                  type="button" 
                  className="cancel-reply-btn"
                  onClick={() => {
                    setReplyingTo(null);
                    setReplyText('');
                    setSelectedGifUrl(null);
                    cleanupReplyImage();
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="submit-reply-btn">Reply</button>
              </div>
            </div>
          </form>
        </div>
      )}
      
      {/* Display replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className={`comment-replies ${expandedComments[comment.id] ? 'expanded' : ''}`}>
          {/* Only show a limited number of replies initially unless expanded */}
          {(expandedComments[comment.id] ? comment.replies : comment.replies.slice(0, MAX_VISIBLE_REPLIES)).map(reply => {
            // If we've reached max nesting depth, show a "Continue thread" link instead
            if (depth >= MAX_NESTED_COMMENTS_DEPTH) {
              return (
                <div className="nested-limit-reached" key={reply.id}>
                  <button 
                    className="view-thread-btn"
                    onClick={() => viewThread(comment.id)}
                  >
                    Continue this thread <i className="fas fa-arrow-right"></i>
                  </button>
                </div>
              );
            }
            
            // Otherwise, render the reply as a nested comment
            return renderComment(reply, depth + 1);
          })}
          
          {/* Show "View more replies" button if there are more than the initial display limit */}
          {!expandedComments[comment.id] && comment.replies.length > MAX_VISIBLE_REPLIES && (
            <button 
              className="view-more-replies-btn"
              onClick={() => toggleExpandComment(comment.id)}
            >
              View {comment.replies.length - MAX_VISIBLE_REPLIES} more {comment.replies.length - MAX_VISIBLE_REPLIES === 1 ? 'reply' : 'replies'}
            </button>
          )}
          
          {/* Show "Hide replies" button if expanded */}
          {expandedComments[comment.id] && comment.replies.length > MAX_VISIBLE_REPLIES && (
            <button 
              className="hide-replies-btn"
              onClick={() => toggleExpandComment(comment.id)}
            >
              Hide replies
            </button>
          )}
        </div>
      )}
    </div>
  );
  
  // Common reaction emojis
  const reactionEmojis = ['👍', '❤️', '😂', '😮', '😢', '😡', '🎉', '👏'];
  
  // Add a reaction to a post
  const handlePostReaction = (emoji: string) => {
    if (!post) return;
    
    // Get current post from storage
    const allPosts = getStoredPosts();
    const updatedPosts = allPosts.map(p => {
      if (p.id === post.id) {
        // Initialize reactions object if it doesn't exist
        const reactions = p.reactions || {};
        
        // Initialize this emoji reaction if it doesn't exist
        if (!reactions[emoji]) {
          reactions[emoji] = {
            emoji,
            count: 0,
            users: []
          };
        }
        
        // Check if user already reacted with this emoji
        const currentUser = 'CurrentUser'; // In a real app, this would be from auth
        const alreadyReacted = reactions[emoji].users.includes(currentUser);
        
        if (alreadyReacted) {
          // Remove the reaction
          reactions[emoji].count = Math.max(0, reactions[emoji].count - 1);
          reactions[emoji].users = reactions[emoji].users.filter(user => user !== currentUser);
          
          // Remove the emoji object if count reaches 0
          if (reactions[emoji].count === 0) {
            delete reactions[emoji];
          }
        } else {
          // Add the reaction
          reactions[emoji].count += 1;
          reactions[emoji].users.push(currentUser);
        }
        
        // Return a new object with all the original properties plus the updated reactions
        return { ...p, reactions };
      }
      return p;
    });
    
    // Save to localStorage
    localStorage.setItem('forumPosts', JSON.stringify(updatedPosts));
    
    // Update post in state
    const updatedPost = updatedPosts.find(p => p.id === post.id);
    if (updatedPost) {
      // Create a new post object that preserves ALL properties from the original post
      // but updates the reactions
      setPost(prevPost => {
        if (!prevPost) return updatedPost;
        
        return {
          ...prevPost,
          reactions: updatedPost.reactions
        };
      });
    }
    
    // Close the reaction picker
    setShowPostReactionPicker(false);
    
    // Show visual feedback
    const isRemoving = post.reactions && 
                      post.reactions[emoji] && 
                      post.reactions[emoji].users && 
                      post.reactions[emoji].users.includes('CurrentUser');
    showToast(isRemoving 
      ? `${emoji} Reaction removed` 
      : `${emoji} Reaction added`
    );
  };
  
  // Delete post function
  const handleDeletePost = () => {
    if (!post) return;
    
    // Confirm deletion with user
    if (!window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }
    
    // Get all posts from localStorage
    const allPosts = getStoredPosts();
    
    // Filter out this post
    const updatedPosts = allPosts.filter(p => p.id !== post.id);
    
    // Save updated posts to localStorage
    localStorage.setItem('forumPosts', JSON.stringify(updatedPosts));
    
    // Delete all comments related to this post
    const allComments = getStoredComments();
    const filteredComments = allComments.filter(c => c.postId !== post.id);
    saveCommentsToStorage(filteredComments);
    
    // Show success message
    showToast('Post deleted successfully');
    
    // Close the options menu
    setShowCommentMoreOptions(null);
    
    // Get the category ID to navigate back to
    const categoryId = post.categoryId || 'general'; // Use 'general' as fallback
    
    // Wait a moment to show the toast, then navigate back to the category page
    setTimeout(() => {
      navigate(`/forums/category/${categoryId}`);
    }, 1000);
  };
  
  // Save post function
  const handleSavePost = () => {
    if (!post) return;
    
    // In a real app, you'd save this to user's saved posts in localStorage or a database
    // Here we'll simulate by adding to a 'savedPosts' field in localStorage
    const savedPosts = JSON.parse(localStorage.getItem('savedPosts') || '[]');
    
    // Check if already saved
    const isAlreadySaved = savedPosts.some((savedPost: number) => savedPost === post.id);
    
    if (isAlreadySaved) {
      // Remove from saved posts
      const updatedSavedPosts = savedPosts.filter((savedPost: number) => savedPost !== post.id);
      localStorage.setItem('savedPosts', JSON.stringify(updatedSavedPosts));
      showToast('Post removed from saved posts');
      setIsPostSaved(false);
    } else {
      // Add to saved posts
      savedPosts.push(post.id);
      localStorage.setItem('savedPosts', JSON.stringify(savedPosts));
      showToast('Post saved successfully');
      setIsPostSaved(true);
    }
    
    // Close the options menu
    setShowCommentMoreOptions(null);
  };
  
  // Report post function
  const handleReportPost = () => {
    if (!post) return;
    
    // In a real app, you'd send this to your backend API
    alert(`Report functionality would be implemented for post #${post.id}`);
    
    // Show success message
    showToast('Post reported');
    
    // Close the options menu
    setShowCommentMoreOptions(null);
  };
  
  // Add a reaction to a comment
  const handleCommentReaction = (commentId: number, emoji: string) => {
    // Debug log
    console.log('Comment reaction clicked:', { commentId, emoji });
    
    // Get current comments from storage
    const allComments = getStoredComments();
    
    // Check current reaction state
    let isRemoving = false;
    const currentUser = 'CurrentUser';
    
    // Find the comment to check current state
    const targetComment = findCommentById(allComments, commentId);
    if (targetComment && 
        targetComment.reactions && 
        targetComment.reactions[emoji] && 
        targetComment.reactions[emoji].users && 
        targetComment.reactions[emoji].users.includes(currentUser)) {
      isRemoving = true;
      console.log('Will remove existing reaction');
    } else {
      console.log('Will add new reaction');
    }
    
    // Find and update the comment with the reaction
    const updatedComments = updateCommentReaction(allComments, commentId, emoji);
    
    // Save to localStorage
    saveCommentsToStorage(updatedComments);
    
    // Immediately update state so UI reflects the change
    setComments(currentComments => {
      // Deep clone the current comments to avoid mutation issues
      const updatedState = JSON.parse(JSON.stringify(currentComments));
      const newState = updateCommentReactionInTree(updatedState, commentId, emoji);
      console.log('Updated comments state:', newState);
      return newState;
    });
    
    // Close the reaction picker
    setShowCommentReactionPicker(null);
    
    // Show visual feedback
    showToast(isRemoving 
      ? `${emoji} Reaction removed` 
      : `${emoji} Reaction added`
    );
  };
  
  // Helper function to find a comment by ID in a flat array
  const findCommentById = (commentsArray: Comment[], commentId: number): Comment | null => {
    for (const comment of commentsArray) {
      if (comment.id === commentId) {
        return comment;
      }
    }
    return null;
  };
  
  // Helper function to update a comment's reaction in a flat array
  const updateCommentReaction = (commentsArray: Comment[], commentId: number, emoji: string): Comment[] => {
    return commentsArray.map(comment => {
      if (comment.id === commentId) {
        // Create a fresh copy of the reactions object or initialize if it doesn't exist
        const reactions = { ...(comment.reactions || {}) };
        
        // Initialize this emoji reaction if it doesn't exist
        if (!reactions[emoji]) {
          reactions[emoji] = {
            emoji,
            count: 0,
            users: []
          };
        }
        
        // Ensure users array exists
        if (!reactions[emoji].users) {
          reactions[emoji].users = [];
        }
        
        // Check if user already reacted with this emoji
        const currentUser = 'CurrentUser'; // In a real app, this would be from auth
        const alreadyReacted = reactions[emoji].users.includes(currentUser);
        
        console.log('Reaction state:', { 
          emoji, 
          currentCount: reactions[emoji].count,
          users: reactions[emoji].users,
          alreadyReacted 
        });
        
        if (alreadyReacted) {
          console.log('Removing existing reaction');
          // Remove the reaction
          reactions[emoji].count = Math.max(0, reactions[emoji].count - 1);
          reactions[emoji].users = reactions[emoji].users.filter(user => user !== currentUser);
          
          // Remove the emoji object if count reaches 0
          if (reactions[emoji].count === 0) {
            delete reactions[emoji];
          }
        } else {
          console.log('Adding new reaction');
          // Add the reaction
          reactions[emoji].count += 1;
          reactions[emoji].users.push(currentUser);
        }
        
        return { ...comment, reactions };
      }
      return comment;
    });
  };
  
  // Helper function to update a comment's reaction in the nested tree
  const updateCommentReactionInTree = (commentTree: Comment[], commentId: number, emoji: string): Comment[] => {
    return commentTree.map(comment => {
      if (comment.id === commentId) {
        // Create a fresh copy of the reactions object or initialize if it doesn't exist
        const reactions = { ...(comment.reactions || {}) };
        
        // Initialize this emoji reaction if it doesn't exist
        if (!reactions[emoji]) {
          reactions[emoji] = {
            emoji,
            count: 0,
            users: []
          };
        }
        
        // Ensure users array exists
        if (!reactions[emoji].users) {
          reactions[emoji].users = [];
        }
        
        // Check if user already reacted with this emoji
        const currentUser = 'CurrentUser'; // In a real app, this would be from auth
        const alreadyReacted = reactions[emoji].users.includes(currentUser);
        
        console.log('Updating reaction in UI tree:', { 
          commentId, 
          emoji, 
          alreadyReacted,
          usersBefore: [...reactions[emoji].users]
        });
        
        if (alreadyReacted) {
          // Remove the reaction
          reactions[emoji].count = Math.max(0, reactions[emoji].count - 1);
          reactions[emoji].users = reactions[emoji].users.filter(user => user !== currentUser);
          
          // Remove the emoji object if count reaches 0
          if (reactions[emoji].count === 0) {
            delete reactions[emoji];
          }
        } else {
          // Add the reaction
          reactions[emoji].count += 1;
          reactions[emoji].users.push(currentUser);
        }
        
        console.log('Updated comment reaction:', reactions);
        
        return { ...comment, reactions };
      }
      
      if (comment.replies && comment.replies.length > 0) {
        return {
          ...comment,
          replies: updateCommentReactionInTree(comment.replies, commentId, emoji)
        };
      }
      
      return comment;
    });
  };
  
  // Render comment content with stickers
  const renderCommentContent = (content: string) => {
    const stickerUrls = extractStickerUrl(content);
    
    return (
      <>
        {getTextWithoutStickers(content)}
        
        {/* Display stickers in a container */}
        {stickerUrls.length > 0 && (
          <div className="stickers-container">
            {stickerUrls.map((url, index) => (
              <div className="comment-sticker" key={index}>
                <img src={url} alt="Sticker" className="sticker-media" />
              </div>
            ))}
          </div>
        )}
      </>
    );
  };
  
  // Render post content with stickers
  const renderPostContent = () => {
    if (!post || !post.content) return null;
    
    console.log('DEBUG - renderPostContent post object:', {
      id: post.id,
      gifUrl: post.gifUrl || 'MISSING',
      imageUrl: post.imageUrl || 'MISSING',
      imageUrls: post.imageUrls || [],
      properties: Object.keys(post)
    });
    
    const content = post.content;
    const gifUrl = post.gifUrl;
    // Combine legacy imageUrl with imageUrls array (if they exist)
    const imageUrls = post.imageUrls || [];
    // Add legacy imageUrl to the array if it exists and isn't already included
    if (post.imageUrl && !imageUrls.includes(post.imageUrl)) {
      imageUrls.unshift(post.imageUrl); // Put the legacy image first
    }
    
    const stickerUrls = extractStickerUrl(content);
    
    console.log('Rendering post content with:', { 
      hasGif: !!gifUrl, 
      hasImages: imageUrls.length > 0,
      numImages: imageUrls.length,
      contentLength: content.length
    });
    
    return (
      <>
        {getTextWithoutStickers(content)}
        
        {/* Display stickers in a container */}
        {stickerUrls.length > 0 && (
          <div className="stickers-container">
            {stickerUrls.map((url, index) => (
              <div className="post-sticker" key={index}>
                <img src={url} alt="Sticker" className="post-sticker-media" />
              </div>
            ))}
          </div>
        )}
        
        {/* Display GIF if present */}
        {gifUrl && (
          <div className="post-gif">
            <img 
              src={gifUrl} 
              alt="Post GIF" 
              className="post-media"
              title="Click to view full size" 
              onClick={() => window.open(gifUrl, '_blank')}
              style={{ cursor: 'pointer' }}
              onError={(e) => {
                console.error('Failed to load GIF:', e);
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        )}
        
        {/* Display Images if present using carousel */}
        {imageUrls.length > 0 && (
          <ImageCarousel 
            images={imageUrls} 
            onImageClick={(imageUrl) => window.open(imageUrl, '_blank')}
          />
        )}
      </>
    );
  };
  
  // Show loading state
  if (loading) {
    return (
      <main className="content-area">
        <div className="loading">Loading post...</div>
      </main>
    );
  }
   
  // Show error state
  if (error || !post) {
    return (
      <main className="content-area">
        <div className="error-container">
          <h2>Error</h2>
          <p>{error || 'Post not found'}</p>
          <Link to="/forums" className="back-btn">Back to Forums</Link>
        </div>
      </main>
    );
  }
   
  // Render post content and comments
  return (
    <main className="content-area">
      {/* Breadcrumb navigation */}
      <div className="breadcrumb">
        <Link to="/forums">Forums</Link>
        <span className="breadcrumb-separator">&gt;</span>
        <Link to={`/forums/category/${post.categoryId}`}>
          {categories[post.categoryId as keyof typeof categories]?.title || 'Unknown Category'}
        </Link>
        <span className="breadcrumb-separator">&gt;</span>
        <span>{post.title}</span>
      </div>
      
      {/* Post content */}
      <div className="post-full">
        <div className="post-header">
          <div className="post-category">{post.category}</div>
          <h1 className="post-title">{post.title}</h1>
          <div className="post-meta">
            Posted by <Link to={`#`}>{post.author}</Link> • {post.timeAgo}
          </div>
        </div>
        
        <div className="post-body">
          {renderPostContent()}
        </div>
        
        {/* Display post reactions if any - moved inside post-full */}
        {post.reactions && Object.keys(post.reactions).length > 0 && (
          <div className="post-reactions">
            {Object.values(post.reactions).map((reaction) => (
              <button 
                key={reaction.emoji} 
                className={`reaction-badge ${reaction.users && reaction.users.includes('CurrentUser') ? 'user-reacted' : ''}`}
                onClick={() => {
                  console.log('Post reaction badge clicked:', reaction.emoji);
                  handlePostReaction(reaction.emoji);
                }}
              >
                {reaction.emoji} {reaction.count}
              </button>
            ))}
          </div>
        )}
        <div className="post-actions">
          {/* Reaction button moved to be the first item */}
          <div ref={postReactionRef} className="reaction-picker-wrapper">
            <button 
              className="action-btn"
              onClick={() => setShowPostReactionPicker(!showPostReactionPicker)}
            >
              <i className="fas fa-smile"></i>
            </button>
            
            {showPostReactionPicker && (
              <div className="reaction-picker-popup">
                {reactionEmojis.map(emoji => (
                  <button
                    key={emoji}
                    className="reaction-emoji-btn"
                    onClick={() => handlePostReaction(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Removed like button */}
          <button className="action-btn">
            <i className="fas fa-comment"></i> {post.comments} Comments
          </button>
          <div ref={shareOptionsRef} className="share-button-wrapper">
            <button 
              className="action-btn" 
              onClick={() => setShowShareOptions(!showShareOptions)}
            >
              <i className="fas fa-share"></i> Share
            </button>
            {showShareOptions && (
              <div className="share-options-popup">
                <button 
                  type="button" 
                  className="share-option-btn"
                  onClick={copyPostLink}
                >
                  <i className="fas fa-link"></i> Copy link
                </button>
                <button 
                  type="button" 
                  className="share-option-btn"
                  onClick={getEmbedCode}
                >
                  <i className="fas fa-code"></i> Embed
                </button>
              </div>
            )}
          </div>
          <button className="action-btn">
            <i className="fas fa-pencil-alt"></i> Edit
          </button>
          <div className="more-options-wrapper" ref={moreOptionsRef}>
            <button 
              className="action-btn"
              onClick={() => setShowCommentMoreOptions(showCommentMoreOptions === -1 ? null : -1)}
            >
              <i className="fas fa-ellipsis-h"></i> More
            </button>
            
            {showCommentMoreOptions === -1 && (
              <div className="more-options-popup">
                <button className="more-option-btn" onClick={handleSavePost}>
                  <i className={`${isPostSaved ? 'fas fa-bookmark' : 'far fa-bookmark'}`}></i> 
                  {isPostSaved ? 'Unsave' : 'Save'}
                </button>
                <button className="more-option-btn" onClick={handleReportPost}>
                  <i className="fas fa-flag"></i> Report
                </button>
                <button className="more-option-btn" onClick={handleDeletePost}>
                  <i className="fas fa-trash"></i> Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Comment form */}
      <div className="comment-form-container">
        <h3>Add a Comment</h3>
        <form onSubmit={handleAddComment} className="comment-form">
          <textarea 
            placeholder="What are your thoughts?" 
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            required={!selectedGifUrl && !imageUrl.trim()}
          ></textarea>
          
          {/* Preview selected GIF */}
          {selectedGifUrl && (
            <div className="selected-gif-preview">
              <img src={selectedGifUrl} alt="Selected GIF" />
              <button 
                type="button" 
                className="remove-media-btn"
                onClick={() => setSelectedGifUrl(null)}
              >
                &times;
              </button>
            </div>
          )}
          
          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept="image/*"
            onChange={handleFileChange}
            className="file-input"
          />
          
          {/* Image URL input (no longer shown, just keeping for functionality) */}
          {showImageInput && (
            <div className="media-input-container" style={{ display: 'none' }}>
              <div className="media-input-actions">
                <button 
                  type="button" 
                  className="media-input-btn cancel"
                  onClick={() => {
                    setShowImageInput(false);
                    setImageUrl('');
                    setImageFile(null);
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="media-input-btn add"
                  onClick={handleImageUpload}
                >
                  Add
                </button>
              </div>
            </div>
          )}
          
          {/* Image preview */}
          {imageUrl.trim() && (
            <div className="selected-image-preview">
              <img src={imageUrl} alt="Image preview" onError={(e) => e.currentTarget.style.display = 'none'} />
              <button 
                type="button" 
                className="remove-media-btn"
                onClick={cleanupImage}
              >
                &times;
              </button>
            </div>
          )}
          
          {/* Link input */}
          {showLinkInput && (
            <div className="media-input-container">
              <input
                type="text"
                placeholder="Enter URL"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className="media-input"
              />
              <input
                type="text"
                placeholder="Enter link text (optional)"
                value={linkTitle}
                onChange={(e) => setLinkTitle(e.target.value)}
                className="media-input"
              />
              <div className="media-input-actions">
                <button 
                  type="button" 
                  className="media-input-btn cancel"
                  onClick={() => setShowLinkInput(false)}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="media-input-btn add"
                  onClick={handleLinkSubmit}
                >
                  Add
                </button>
              </div>
            </div>
          )}
          
          {/* Link preview */}
          {linkUrl.trim() && (
            <div className="link-preview">
              <a 
                href={linkUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="comment-link-preview"
              >
                <i className="fas fa-link"></i> {linkTitle || linkUrl}
              </a>
              <button 
                type="button" 
                className="remove-link-btn"
                onClick={() => {
                  setLinkUrl('');
                  setLinkTitle('');
                }}
              >
                &times;
              </button>
            </div>
          )}
          
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
            <button type="submit" className="submit-comment-btn">Comment</button>
          </div>
        </form>
      </div>
      
      {/* GIF Picker Modal */}
      {showGifPicker && (
        <LocalGifPicker 
          onSelect={handleGifSelect} 
          onClose={() => setShowGifPicker(false)} 
        />
      )}
      
      {/* Comments section */}
      <div className="comments-section">
        <div className="comments-header">
          <h3>{post.comments} Comments</h3>
          <div className="comment-sort-controls">
            <span>Sort by:</span>
            <button 
              className={`sort-btn ${commentSorting === 'latest' ? 'active' : ''}`}
              onClick={() => setCommentSorting('latest')}
            >
              Latest
            </button>
            <button 
              className={`sort-btn ${commentSorting === 'popular' ? 'active' : ''}`}
              onClick={() => setCommentSorting('popular')}
            >
              Popular
            </button>
          </div>
        </div>
        <div className="comments-list">
          {sortComments(comments).map(comment => renderComment(comment))}
        </div>
      </div>
      
      {/* Toast notification */}
      {toastMessage && (
        <div className="toast-notification">
          <span>{toastMessage}</span>
        </div>
      )}
    </main>
  );
};

export default PostPage; 