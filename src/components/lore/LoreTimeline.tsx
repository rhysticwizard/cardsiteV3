import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { timelineData, Event as TimelineEventType } from './timelineData'; // Renamed Event to avoid conflict
import '../../styles/lore/LoreTimeline.css';
import Storyline from './Storyline';
import Characters from './Characters';
import Locations from './Locations';

interface FormattedEvent {
  id: string;
  date: string;
  title: string;
  description: string;
}

interface FormattedStep {
  id: string;
  title: string;
  events: FormattedEvent[]; // Changed from single description to array of events
  dotColor: string;
}

const formatMtgTimelineData = (): FormattedStep[] => {
  const steps: FormattedStep[] = timelineData.map((era, index) => {
    const eraEvents: FormattedEvent[] = era.events.map(event => ({
      id: event.id!, // Assert id is present as it's assigned in timelineData.ts
      date: event.date,
      title: event.title,
      description: event.description,
    }));

    return {
      id: era.era,
      title: era.title.split('(')[0].trim(),
      events: eraEvents, 
      dotColor: 'white' // All dots are white
    };
  });
  return steps;
};

const LoreTimeline: React.FC = () => {
  const mtgTimelineSteps = formatMtgTimelineData();
  const [activeTopNav, setActiveTopNav] = useState<string>('Timeline');

  useEffect(() => {
    console.log("Rendering LoreTimeline component");
  }, []);

  const topNavItems = ['Timeline', 'Storyline', 'Characters', 'Locations'];
  
  const renderTimeline = () => {
    return (
      <div className="timeline">
        {mtgTimelineSteps.map((step, index) => (
          <div key={step.id} className="process-step">
            <div className={`timeline-dot ${step.dotColor === 'white' ? 'white-dot' : ''}`}></div>
            
            <div className="left-content">
              <h2 className="step-title">{step.title}</h2>
            </div>
            
            <div className="right-content">
              <div className="step-description">
                {step.events.map((event) => (
                  <div key={event.id} className="event-item">
                    <Link to={`/lore/${event.id}`} className="event-link">
                      <em>{event.date}</em>: <strong>{event.title}</strong>
                    </Link>
                    <p className="event-text">{event.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTopNav) {
      case 'Timeline':
        return renderTimeline();
      case 'Storyline':
        return <Storyline />;
      case 'Characters':
        return <Characters />;
      case 'Locations':
        return <Locations />;
      default:
        return renderTimeline();
    }
  };

  return (
    <div className="lore-container">
      <div className="top-nav-bar">
        {topNavItems.map(item => (
          <button 
            key={item}
            className={`top-nav-btn ${activeTopNav === item ? 'active' : ''}`}
            onClick={() => setActiveTopNav(item)}
          >
            {item}
          </button>
        ))}
      </div>
      <main>
        {renderContent()}
      </main>
    </div>
  );
};

export default LoreTimeline; 