// Version History JavaScript

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const historySearch = document.getElementById('history-search');
  const historySearchButton = document.getElementById('history-search-button');
  const historyList = document.getElementById('history-list');
  const versionFilter = document.getElementById('version-filter');
  const darkModeToggle = document.getElementById('dark-mode-toggle');
  
  // Initialize
  populateVersionFilter();
  displayVersionHistory('all');
  initializeDarkMode();
  
  // Event Listeners
  historySearchButton.addEventListener('click', searchHistory);
  historySearch.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') searchHistory();
  });
  
  versionFilter.addEventListener('change', (e) => {
    displayVersionHistory(e.target.value);
  });
  
  darkModeToggle.addEventListener('click', toggleDarkMode);
  
  /**
   * Populate the version dropdown filter
   */
  function populateVersionFilter() {
    // Get versions from history data
    const versions = VERSION_HISTORY.map(entry => {
      return {
        value: entry.version,
        label: `${entry.version} (${entry.date})`
      };
    });
    
    // Add options to select
    versions.forEach(version => {
      const option = document.createElement('option');
      option.value = version.value;
      option.textContent = version.label;
      versionFilter.appendChild(option);
    });
  }
  
  /**
   * Display version history with optional filter
   */
  function displayVersionHistory(filter) {
    // Clear existing history
    historyList.innerHTML = '';
    
    // Filter history by version if needed
    let filteredHistory = VERSION_HISTORY;
    if (filter !== 'all') {
      filteredHistory = VERSION_HISTORY.filter(entry => entry.version === filter);
    }
    
    if (filteredHistory.length === 0) {
      historyList.innerHTML = '<p>No version history available.</p>';
      return;
    }
    
    // Create HTML for each version
    filteredHistory.forEach(version => {
      const versionEntry = document.createElement('div');
      versionEntry.className = 'version-entry';
      
      const versionHeader = document.createElement('div');
      versionHeader.className = 'version-header';
      
      const versionTitle = document.createElement('h3');
      versionTitle.textContent = version.version;
      
      const versionDate = document.createElement('span');
      versionDate.className = 'version-date';
      versionDate.textContent = version.date;
      
      versionHeader.appendChild(versionTitle);
      versionHeader.appendChild(versionDate);
      versionEntry.appendChild(versionHeader);
      
      // Add rule changes
      if (version.changes && version.changes.length > 0) {
        const changesList = document.createElement('div');
        changesList.className = 'changes-list';
        
        version.changes.forEach(change => {
          const changeEntry = document.createElement('div');
          changeEntry.className = 'change-entry';
          
          const ruleTitle = document.createElement('h4');
          ruleTitle.innerHTML = `Rule <a href="index.html?rule=${change.rule.split('.')[0]}" class="rule-link">${change.rule}</a>`;
          
          const changeContent = document.createElement('div');
          changeContent.className = 'change-content';
          
          const oldText = document.createElement('div');
          oldText.className = 'old-text';
          oldText.innerHTML = `<strong>Old:</strong> <span>${change.old}</span>`;
          
          const newText = document.createElement('div');
          newText.className = 'new-text';
          newText.innerHTML = `<strong>New:</strong> <span>${change.new}</span>`;
          
          changeContent.appendChild(oldText);
          changeContent.appendChild(newText);
          
          changeEntry.appendChild(ruleTitle);
          changeEntry.appendChild(changeContent);
          changesList.appendChild(changeEntry);
        });
        
        versionEntry.appendChild(changesList);
      } else {
        const noChanges = document.createElement('p');
        noChanges.className = 'no-changes';
        noChanges.textContent = 'No specific rule changes recorded for this version.';
        versionEntry.appendChild(noChanges);
      }
      
      historyList.appendChild(versionEntry);
    });
  }
  
  /**
   * Search through version history
   */
  function searchHistory() {
    const query = historySearch.value.trim().toLowerCase();
    
    if (query.length < 2) {
      alert('Please enter at least 2 characters to search.');
      return;
    }
    
    // Clear existing history
    historyList.innerHTML = '';
    
    // Search through all versions and changes
    const matches = [];
    
    VERSION_HISTORY.forEach(version => {
      // Check if there are any matching changes in this version
      const matchingChanges = version.changes.filter(change => 
        change.rule.toLowerCase().includes(query) ||
        change.old.toLowerCase().includes(query) ||
        change.new.toLowerCase().includes(query)
      );
      
      if (matchingChanges.length > 0) {
        matches.push({
          version: version.version,
          date: version.date,
          changes: matchingChanges
        });
      }
    });
    
    // Display search results
    if (matches.length === 0) {
      historyList.innerHTML = '<p>No matching rule changes found. Try different keywords.</p>';
      return;
    }
    
    // Create header for search results
    const searchHeader = document.createElement('h3');
    searchHeader.className = 'search-results-header';
    searchHeader.textContent = `Search Results for "${query}"`;
    historyList.appendChild(searchHeader);
    
    // Display matching versions and changes
    matches.forEach(version => {
      const versionEntry = document.createElement('div');
      versionEntry.className = 'version-entry search-result';
      
      const versionHeader = document.createElement('div');
      versionHeader.className = 'version-header';
      
      const versionTitle = document.createElement('h3');
      versionTitle.textContent = version.version;
      
      const versionDate = document.createElement('span');
      versionDate.className = 'version-date';
      versionDate.textContent = version.date;
      
      versionHeader.appendChild(versionTitle);
      versionHeader.appendChild(versionDate);
      versionEntry.appendChild(versionHeader);
      
      // Add matching rule changes
      const changesList = document.createElement('div');
      changesList.className = 'changes-list';
      
      version.changes.forEach(change => {
        const changeEntry = document.createElement('div');
        changeEntry.className = 'change-entry';
        
        const ruleTitle = document.createElement('h4');
        ruleTitle.innerHTML = `Rule <a href="index.html?rule=${change.rule.split('.')[0]}" class="rule-link">${change.rule}</a>`;
        
        const changeContent = document.createElement('div');
        changeContent.className = 'change-content';
        
        // Highlight search term in old and new text
        let oldText = change.old;
        let newText = change.new;
        
        if (query && query.length > 0) {
          const regex = new RegExp(`(${query})`, 'gi');
          oldText = oldText.replace(regex, '<span class="highlighted">$1</span>');
          newText = newText.replace(regex, '<span class="highlighted">$1</span>');
        }
        
        const oldTextDiv = document.createElement('div');
        oldTextDiv.className = 'old-text';
        oldTextDiv.innerHTML = `<strong>Old:</strong> <span>${oldText}</span>`;
        
        const newTextDiv = document.createElement('div');
        newTextDiv.className = 'new-text';
        newTextDiv.innerHTML = `<strong>New:</strong> <span>${newText}</span>`;
        
        changeContent.appendChild(oldTextDiv);
        changeContent.appendChild(newTextDiv);
        
        changeEntry.appendChild(ruleTitle);
        changeEntry.appendChild(changeContent);
        changesList.appendChild(changeEntry);
      });
      
      versionEntry.appendChild(changesList);
      historyList.appendChild(versionEntry);
    });
    
    // Reset version filter to show all results
    versionFilter.value = 'all';
  }
  
  /**
   * Initialize dark mode based on user preference
   */
  function initializeDarkMode() {
    // Check for saved preference
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
  }
  
  /**
   * Toggle dark mode
   */
  function toggleDarkMode() {
    if (document.documentElement.getAttribute('data-theme') === 'dark') {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('theme', 'light');
      darkModeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
      darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
  }
}); 