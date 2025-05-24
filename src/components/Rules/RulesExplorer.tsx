import React, { useState } from 'react';
import './RulesExplorer.css';

// Import the rules data that was previously in data.js
import { rulesData } from './rulesData';

type TabType = 'rules' | 'history' | 'glossary';

interface RuleSubsection {
  name: string;
  content: string;
  subrules: { [key: string]: string };
  related: number[];
}

interface RulesSection {
  name: string;
  subsections: { [key: string]: RuleSubsection };
}

interface RulesVersion {
  name: string;
  date: string;
  version: string;
  sections: { [key: string]: RulesSection };
}

const RulesExplorer: React.FC = () => {
  const [selectedVersion, setSelectedVersion] = useState<string>('current');
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [selectedSubsection, setSelectedSubsection] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const currentRules = rulesData[selectedVersion as keyof typeof rulesData] as RulesVersion;

  // Function to find which section a rule belongs to
  const findRuleLocation = (ruleNumber: string): {sectionId: string, subsectionId: string} | null => {
    // Extract subsection from rule number (e.g., "104.3a" -> "104")
    const subsectionMatch = ruleNumber.match(/^(\d{3})/);
    if (!subsectionMatch) return null;
    
    const subsectionId = subsectionMatch[1];
    
    // Find which section contains this subsection
    for (const [sectionId, section] of Object.entries(currentRules.sections)) {
      if (section.subsections[subsectionId]) {
        return { sectionId, subsectionId };
      }
    }
    return null;
  };

  // Function to navigate to a specific rule
  const navigateToRule = (ruleNumber: string) => {
    const location = findRuleLocation(ruleNumber);
    if (location) {
      setSelectedSection(location.sectionId);
      setSelectedSubsection(location.subsectionId);
      setSearchResults([]);
      setSearchQuery('');
      
      // Expand the section if not already expanded
      setExpandedSections(prev => new Set([...Array.from(prev), location.sectionId]));
      
      // Scroll to top of content
      setTimeout(() => {
        const contentArea = document.querySelector('.rules-content');
        if (contentArea) {
          contentArea.scrollTop = 0;
        }
      }, 100);
    }
  };

  // Function to parse rule text and make rule references clickable
  const parseRuleText = (text: string): React.ReactNode => {
    // Regex to match rule references like "rule 104.3a", "rule 605", "See rule 704", etc.
    const ruleRefRegex = /((?:See\s+)?rule\s+(\d{3}(?:\.\d+[a-z]*)?))(?:[.,]\s*"[^"]*")?/gi;
    
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;
    
    while ((match = ruleRefRegex.exec(text)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      
      // Add the clickable rule reference
      const fullMatch = match[1]; // "rule 104.3a" or "See rule 704"
      const ruleNumber = match[2]; // "104.3a" or "704"
      
      parts.push(
        <span
          key={`rule-${match.index}-${ruleNumber}`}
          className="rule-reference"
          onClick={() => navigateToRule(ruleNumber)}
          title={`Navigate to rule ${ruleNumber}`}
        >
          {fullMatch}
        </span>
      );
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }
    
    return parts.length > 0 ? parts : text;
  };

  // Search functionality
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const results: any[] = [];
    const searchTerm = query.toLowerCase();

    Object.entries(currentRules.sections).forEach(([sectionId, section]) => {
      Object.entries(section.subsections).forEach(([subsectionId, subsection]) => {
        // Search in subsection name and content
        if (subsection.name.toLowerCase().includes(searchTerm) || 
            subsection.content.toLowerCase().includes(searchTerm)) {
          results.push({
            type: 'subsection',
            sectionId,
            subsectionId,
            title: `${subsectionId}. ${subsection.name}`,
            content: subsection.content,
            relevance: subsection.name.toLowerCase().includes(searchTerm) ? 2 : 1
          });
        }

        // Search in subrules
        Object.entries(subsection.subrules).forEach(([ruleId, ruleText]) => {
          if (ruleText.toLowerCase().includes(searchTerm)) {
            results.push({
              type: 'rule',
              sectionId,
              subsectionId,
              ruleId,
              title: `Rule ${ruleId}`,
              content: ruleText,
              relevance: ruleId.toLowerCase().includes(searchTerm) ? 3 : 1
            });
          }
        });
      });
    });

    // Sort by relevance
    results.sort((a, b) => b.relevance - a.relevance);
    setSearchResults(results);
  };

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const selectSubsection = (sectionId: string, subsectionId: string) => {
    setSelectedSection(sectionId);
    setSelectedSubsection(subsectionId);
    setSearchResults([]);
    setSearchQuery('');
  };

  const selectSearchResult = (result: any) => {
    setSelectedSection(result.sectionId);
    setSelectedSubsection(result.subsectionId);
    setSearchResults([]);
    setSearchQuery('');
    
    // Expand the section if not already expanded
    setExpandedSections(prev => new Set([...Array.from(prev), result.sectionId]));
  };

  const getRelatedRules = (subsection: RuleSubsection) => {
    const related: Array<{id: string, name: string}> = [];
    
    subsection.related.forEach(relatedId => {
      // Find the related subsection
      Object.entries(currentRules.sections).forEach(([sectionId, section]) => {
        Object.entries(section.subsections).forEach(([subsectionId, sub]) => {
          if (parseInt(subsectionId) === relatedId) {
            related.push({
              id: subsectionId,
              name: sub.name
            });
          }
        });
      });
    });

    return related;
  };

  const currentSubsection = selectedSection && selectedSubsection 
    ? currentRules.sections[selectedSection]?.subsections[selectedSubsection]
    : null;

  return (
    <div className="rules-explorer" data-theme="dark">
      <div className="rules-sidebar">
        <div className="sidebar-search">
          <input
            type="text"
            placeholder="Search rules..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="version-selector">
          <label htmlFor="version-select">Rules Version:</label>
          <select
            id="version-select"
            value={selectedVersion}
            onChange={(e) => setSelectedVersion(e.target.value)}
          >
            <option value="current">Current ({currentRules.date})</option>
            <option value="previous">Previous</option>
          </select>
        </div>

        <nav className="rules-nav">
          <ul>
            {Object.entries(currentRules.sections).map(([sectionId, section]) => (
              <li key={sectionId} className={`section-header ${expandedSections.has(sectionId) ? 'expanded' : ''}`}>
                <div 
                  className="section-toggle"
                  onClick={() => toggleSection(sectionId)}
                >
                  <span className="section-arrow">
                    ›
                  </span>
                  {sectionId}. {section.name}
                </div>
                <ul className={`subsection-list ${expandedSections.has(sectionId) ? 'expanded' : ''}`}>
                  {Object.entries(section.subsections).map(([subsectionId, subsection]) => (
                    <li 
                      key={subsectionId}
                      className={selectedSubsection === subsectionId ? 'active' : ''}
                      onClick={() => selectSubsection(sectionId, subsectionId)}
                    >
                      {subsectionId}. {subsection.name}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="rules-content">
        <div className="breadcrumbs">
          <span>Home</span>
          {selectedSection && currentRules.sections[selectedSection] && (
            <>
              <span className="breadcrumb-separator"> / </span>
              <span>{selectedSection}. {currentRules.sections[selectedSection].name}</span>
            </>
          )}
          {selectedSubsection && currentSubsection && (
            <>
              <span className="breadcrumb-separator"> / </span>
              <span>{selectedSubsection}. {currentSubsection.name}</span>
            </>
          )}
        </div>

        {searchResults.length > 0 ? (
          <div className="search-results">
            <h2>Search Results</h2>
            <div className="result-count">
              <span>{searchResults.length}</span> results found
            </div>
            <ul className="search-results-list">
              {searchResults.map((result, index) => (
                <li 
                  key={index}
                  className="search-result-item"
                  onClick={() => selectSearchResult(result)}
                >
                  <h3 className="search-result-title">{result.title}</h3>
                  <p className="search-result-excerpt">{parseRuleText(result.content)}</p>
                </li>
              ))}
            </ul>
          </div>
        ) : currentSubsection ? (
          <div className="rule-display">
            <div className="rule-title-container">
              <h2 className="rule-title">{selectedSubsection}. {currentSubsection.name}</h2>
            </div>
            <div className="rule-content">
              <p>{parseRuleText(currentSubsection.content)}</p>
            </div>
            
            <div className="subrules">
              {Object.entries(currentSubsection.subrules).map(([ruleId, ruleText]) => (
                <div key={ruleId} className="subrule">
                  <strong>{ruleId}</strong> {parseRuleText(ruleText)}
                </div>
              ))}
            </div>

            {getRelatedRules(currentSubsection).length > 0 && (
              <div className="related-rules">
                <h3>Related Rules</h3>
                <ul>
                  {getRelatedRules(currentSubsection).map((related) => (
                    <li key={related.id}>
                      <div 
                        onClick={() => {
                          // Find which section this rule belongs to
                          Object.entries(currentRules.sections).forEach(([sectionId, section]) => {
                            if (section.subsections[related.id]) {
                              selectSubsection(sectionId, related.id);
                            }
                          });
                        }}
                        className="related-rule-link"
                      >
                        {related.id}. {related.name}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="welcome-message">
            <h2>Magic: The Gathering Comprehensive Rules</h2>
            <p>Browse the complete official MTG rules with search functionality and cross-references.</p>
            <p>Select a section from the sidebar or use the search function to get started.</p>
            <div className="copyright-notice">
              <p>© 2025 Wizards of the Coast LLC. All rights reserved.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RulesExplorer; 