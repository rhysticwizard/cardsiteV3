import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faArrowRight, faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import { timelineData, getAllEvents, Event } from './timelineData';
import '../../styles/lore/LoreDetail.css';

interface EventWithEra extends Omit<Event, 'id'> {
  id: string;
  era: string;
  significance?: string;
  source?: string;
}

const LoreDetail: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  
  const [event, setEvent] = useState<EventWithEra | null>(null);
  const [relatedEvents, setRelatedEvents] = useState<EventWithEra[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [allEvents, setAllEvents] = useState<EventWithEra[]>([]);
  const [currentEventIndex, setCurrentEventIndex] = useState<number>(-1);
  
  // Load event data
  useEffect(() => {
    setLoading(true);
    setError(null);
    
    try {
      // Get all events
      const events = getAllEvents();
      const eventsWithRequiredId = events
        .filter(e => e.id !== undefined)
        .map(e => ({
          ...e,
          id: e.id as string // Safe assertion because we filtered out undefined ids
        })) as EventWithEra[];
        
      setAllEvents(eventsWithRequiredId);
      
      // Find the current event
      const currentEvent = eventsWithRequiredId.find(e => e.id === eventId);
      
      if (!currentEvent) {
        setError('Event not found');
        setLoading(false);
        return;
      }
      
      setEvent(currentEvent);
      
      // Find the index of the current event for navigation
      const eventIndex = eventsWithRequiredId.findIndex(e => e.id === eventId);
      setCurrentEventIndex(eventIndex);
      
      // Find related events (same era, excluding current event)
      const sameEraEvents = eventsWithRequiredId.filter(e => 
        e.era === currentEvent.era && e.id !== currentEvent.id
      );
      
      // Get up to 4 related events
      setRelatedEvents(sameEraEvents.slice(0, 4));
      
      setLoading(false);
    } catch (err) {
      setError('Failed to load event details');
      setLoading(false);
    }
  }, [eventId]);
  
  // Navigate to previous event
  const navigateToPrevEvent = () => {
    if (currentEventIndex > 0) {
      const prevEvent = allEvents[currentEventIndex - 1];
      navigate(`/lore/${prevEvent.id}`);
    }
  };
  
  // Navigate to next event
  const navigateToNextEvent = () => {
    if (currentEventIndex < allEvents.length - 1) {
      const nextEvent = allEvents[currentEventIndex + 1];
      navigate(`/lore/${nextEvent.id}`);
    }
  };
  
  // Format description text with paragraphs
  const formatDescription = (text: string) => {
    if (text.includes('\n\n')) {
      return text.split('\n\n').map((p, i) => <p key={i}>{p}</p>);
    }
    
    return <p>{text}</p>;
  };
  
  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Left arrow key for previous event
      if (e.key === 'ArrowLeft' && currentEventIndex > 0) {
        navigateToPrevEvent();
      }
      
      // Right arrow key for next event
      if (e.key === 'ArrowRight' && currentEventIndex < allEvents.length - 1) {
        navigateToNextEvent();
      }
      
      // Escape key to go back to timeline
      if (e.key === 'Escape') {
        navigate('/lore');
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentEventIndex, allEvents, navigate]);
  
  // Display loading state
  if (loading) {
    return (
      <div className="detail-container">
        <div className="loading">Loading event details...</div>
      </div>
    );
  }
  
  // Display error state
  if (error || !event) {
    return (
      <div className="detail-container">
        <div className="error-message">
          <h2>Error</h2>
          <p>{error || 'Event not found'}</p>
          <Link to="/lore" className="back-link">Return to Timeline</Link>
        </div>
      </div>
    );
  }
  
  // Find the era title
  const eraData = timelineData.find(e => e.era === event.era);
  const eraTitle = eraData ? eraData.title : event.era;
  
  return (
    <div className="detail-container">
      <header>
        <div className="navigation-header">
          <Link to="/lore" className="back-link">
            <FontAwesomeIcon icon={faChevronLeft} />
            Back to Timeline
          </Link>
          <div className="navigation-controls">
            <button 
              className="nav-btn" 
              onClick={navigateToPrevEvent} 
              disabled={currentEventIndex <= 0}
            >
              <FontAwesomeIcon icon={faArrowLeft} />
              Previous Event
            </button>
            <button 
              className="nav-btn" 
              onClick={navigateToNextEvent} 
              disabled={currentEventIndex >= allEvents.length - 1}
            >
              Next Event
              <FontAwesomeIcon icon={faArrowRight} />
            </button>
          </div>
        </div>
      </header>

      <main>
        <div className="lore-detail">
          <div className="event-header">
            <div className="event-category">{eraTitle}</div>
            <div className="event-date">{event.date}</div>
            <h1 className="event-title">{event.title}</h1>
          </div>
          <div className="event-content">
            {formatDescription(event.description)}
            {event.significance && (
              <>
                <h3>Significance</h3>
                {formatDescription(event.significance)}
              </>
            )}
            {event.source && (
              <div className="event-source">Source: {event.source}</div>
            )}
          </div>
        </div>
        
        {relatedEvents.length > 0 && (
          <div className="related-events">
            <h3>Related Events</h3>
            <div className="related-events-grid">
              {relatedEvents.map(relatedEvent => (
                <Link 
                  key={relatedEvent.id} 
                  to={`/lore/${relatedEvent.id}`} 
                  className="related-event-card"
                >
                  <div className="related-event-date">{relatedEvent.date}</div>
                  <div className="related-event-title">{relatedEvent.title}</div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer>
        <div className="footer-content">
          <p>Data sourced from <a href="https://mtg.fandom.com/wiki/Timeline" target="_blank" rel="noopener noreferrer">MTG Wiki Timeline</a></p>
          <p className="copyright">Magic: The Gathering © Wizards of the Coast</p>
        </div>
      </footer>
    </div>
  );
};

export default LoreDetail; 