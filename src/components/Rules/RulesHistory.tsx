import React, { useState, useEffect } from 'react';
import './RulesExplorer.css';

interface HistoryEntry {
  version: string;
  date: string;
  changes: string[];
}

const RulesHistory: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedVersion, setSelectedVersion] = useState<string>('all');
  const [filteredHistory, setFilteredHistory] = useState<HistoryEntry[]>([]);

  // Mock history data - in a real app this would come from an API or data file
  const historyData: HistoryEntry[] = [
    {
      version: "Magic: The Gathering Foundations",
      date: "November 8, 2024",
      changes: [
        "Updated comprehensive rules for new mechanics",
        "Clarified interaction between new and existing abilities",
        "Added rules for Foundation set mechanics"
      ]
    },
    {
      version: "Wilds of Eldraine",
      date: "August 11, 2023",
      changes: [
        "Added Adventure mechanic rules",
        "Updated rules for Food tokens",
        "Clarified rules for Role tokens"
      ]
    }
  ];

  useEffect(() => {
    let filtered = historyData;

    // Filter by version if not "all"
    if (selectedVersion !== 'all') {
      filtered = filtered.filter(entry => entry.version === selectedVersion);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const searchTerm = searchQuery.toLowerCase();
      filtered = filtered.filter(entry => 
        entry.version.toLowerCase().includes(searchTerm) ||
        entry.changes.some(change => change.toLowerCase().includes(searchTerm))
      );
    }

    setFilteredHistory(filtered);
  }, [searchQuery, selectedVersion, historyData]);

  return (
    <div className="rules-explorer">
      <div className="rules-content" style={{ width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
        <div className="breadcrumbs">
          <span>Rules Explorer</span>
          <span> &gt; </span>
          <span>Version History</span>
        </div>

        <div className="history-container">
          <h2>Rules Version History</h2>
          <p className="history-intro">This page documents the changes made to the comprehensive rules over time.</p>
          
          <div className="search-container" style={{ marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Search rule changes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
              style={{ flex: 1 }}
            />
            
            <div className="filter-container">
              <label htmlFor="version-filter" style={{ marginRight: '8px', fontWeight: '600' }}>Filter by Version:</label>
              <select
                id="version-filter"
                value={selectedVersion}
                onChange={(e) => setSelectedVersion(e.target.value)}
                style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px' }}
              >
                <option value="all">All Versions</option>
                {historyData.map((entry, index) => (
                  <option key={index} value={entry.version}>{entry.version}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="history-list">
            {filteredHistory.length > 0 ? (
              filteredHistory.map((entry, index) => (
                <div key={index} className="history-entry" style={{
                  marginBottom: '24px',
                  padding: '20px',
                  backgroundColor: '#f6f8fa',
                  borderRadius: '8px',
                  border: '1px solid #e1e4e8'
                }}>
                  <h3 style={{ color: '#24292f', marginBottom: '8px' }}>{entry.version}</h3>
                  <p style={{ color: '#656d76', marginBottom: '16px', fontSize: '14px' }}>Released: {entry.date}</p>
                  <ul style={{ margin: 0, paddingLeft: '20px' }}>
                    {entry.changes.map((change, changeIndex) => (
                      <li key={changeIndex} style={{ marginBottom: '8px', color: '#24292f' }}>
                        {change}
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            ) : (
              <div className="no-results" style={{ textAlign: 'center', padding: '48px 0' }}>
                <h3 style={{ color: '#656d76' }}>No history entries found</h3>
                <p style={{ color: '#656d76' }}>Try adjusting your search or filter criteria.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RulesHistory; 