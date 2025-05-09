import React, { useState } from 'react';
import './ImageCarousel.css';

interface ImageCarouselProps {
  images: string[];
  onImageClick?: (imageUrl: string) => void;
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({ images, onImageClick }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  if (!images || images.length === 0) {
    return null;
  }
  
  // If there's only one image, display it without navigation controls
  if (images.length === 1) {
    return (
      <div className="image-carousel single-image">
        <img 
          src={images[0]} 
          alt="Post content" 
          className="carousel-image"
          onClick={() => onImageClick && onImageClick(images[0])}
          style={{ cursor: onImageClick ? 'pointer' : 'default' }}
          title={onImageClick ? "Click to view full size" : ""}
        />
      </div>
    );
  }
  
  const goToPrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev === 0 ? images.length - 1 : prev - 1));
  };
  
  const goToNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev === images.length - 1 ? 0 : prev + 1));
  };
  
  const goToIndex = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(index);
  };
  
  return (
    <div className="image-carousel">
      <div className="carousel-content">
        <img 
          src={images[currentIndex]} 
          alt={`Image ${currentIndex + 1} of ${images.length}`} 
          className="carousel-image"
          onClick={() => onImageClick && onImageClick(images[currentIndex])}
          style={{ cursor: onImageClick ? 'pointer' : 'default' }}
          title={onImageClick ? "Click to view full size" : ""}
        />
        
        <button 
          className="carousel-arrow prev"
          onClick={goToPrevious}
          aria-label="Previous image"
        >
          <i className="fas fa-chevron-left"></i>
        </button>
        
        <button 
          className="carousel-arrow next"
          onClick={goToNext}
          aria-label="Next image"
        >
          <i className="fas fa-chevron-right"></i>
        </button>
        
        <div className="carousel-pagination">
          <div className="carousel-counter">
            {currentIndex + 1} / {images.length}
          </div>
          <div className="carousel-dots">
            {images.map((_, index) => (
              <button
                key={index}
                className={`carousel-dot ${index === currentIndex ? 'active' : ''}`}
                onClick={(e) => goToIndex(index, e)}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageCarousel; 