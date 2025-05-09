// TCG Rules Explorer App

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const searchInput = document.getElementById('search-input');
  const searchButton = document.getElementById('search-button');
  const searchResults = document.getElementById('search-results');
  const searchResultsList = document.getElementById('search-results-list');
  const resultCountNumber = document.getElementById('result-count-number');
  const ruleDisplay = document.getElementById('rule-display');
  const relatedRulesList = document.getElementById('related-rules-list');
  const versionSelect = document.getElementById('version-select');
  const rulesNav = document.getElementById('rules-nav');
  const breadcrumbs = document.getElementById('breadcrumbs');
  const darkModeToggle = document.getElementById('dark-mode-toggle');
  
  // Initialize the site
  initializeSidebar();
  initializeDarkMode();
  
  // Event Listeners
  searchButton.addEventListener('click', performSearch);
  searchInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') performSearch();
  });
  versionSelect.addEventListener('change', handleVersionChange);
  darkModeToggle.addEventListener('click', toggleDarkMode);
  
  /**
   * Populate the sidebar with rule sections and subsections
   */
  function initializeSidebar() {
    const currentRules = RULES_VERSIONS.current;
    const sidebarNav = document.getElementById('rules-nav');
    const sidebarList = sidebarNav.querySelector('ul');
    
    // Clear existing content
    sidebarList.innerHTML = '';
    
    // Populate sections
    Object.keys(currentRules.sections).forEach(sectionNum => {
      const section = currentRules.sections[sectionNum];
      
      // Create section header
      const sectionItem = document.createElement('li');
      sectionItem.className = 'section-header';
      sectionItem.dataset.section = sectionNum;
      
      const sectionToggle = document.createElement('span');
      sectionToggle.className = 'section-toggle';
      sectionToggle.textContent = `${sectionNum}. ${section.name}`;
      sectionToggle.addEventListener('click', toggleSection);
      
      // Create subsection list
      const subsectionList = document.createElement('ul');
      subsectionList.className = 'subsection-list';
      
      // Populate subsections
      Object.keys(section.subsections).forEach(subNum => {
        const subsection = section.subsections[subNum];
        const subsectionItem = document.createElement('li');
        subsectionItem.dataset.rule = subNum;
        subsectionItem.textContent = `${subNum}. ${subsection.name}`;
        subsectionItem.addEventListener('click', () => displayRule(subNum));
        subsectionList.appendChild(subsectionItem);
      });
      
      // Assemble and add to sidebar
      sectionItem.appendChild(sectionToggle);
      sectionItem.appendChild(subsectionList);
      sidebarList.appendChild(sectionItem);
    });
  }
  
  /**
   * Toggle section expand/collapse in sidebar
   */
  function toggleSection(e) {
    const sectionHeader = e.target.closest('.section-header');
    sectionHeader.classList.toggle('expanded');
    const subsectionList = sectionHeader.querySelector('.subsection-list');
    
    if (sectionHeader.classList.contains('expanded')) {
      subsectionList.style.display = 'block';
    } else {
      subsectionList.style.display = 'none';
    }
  }
  
  /**
   * Display a specific rule in the content area
   */
  function displayRule(ruleNum) {
    // Get the current rules version
    const currentVersion = versionSelect.value;
    const rulesData = RULES_VERSIONS[currentVersion];
    
    // Get the section and subsection
    const sectionNum = Math.floor(ruleNum / 100);
    const section = rulesData.sections[sectionNum];
    const subsection = section.subsections[ruleNum];
    
    if (!subsection) {
      ruleDisplay.innerHTML = '<p>Rule not found.</p>';
      return;
    }
    
    // Update breadcrumbs
    updateBreadcrumbs(sectionNum, ruleNum, section.name, subsection.name);
    
    // Build the rule display HTML
    let ruleHTML = `
      <div class="rule-title-container">
        <h2 class="rule-title">${ruleNum}. ${subsection.name}</h2>
        <button class="share-button" title="Copy link to rule" 
                onclick="copyRuleLink('${ruleNum}')">
          <i class="fas fa-link"></i>
        </button>
      </div>
      <div class="rule-content">
        <p>${subsection.content}</p>
    `;
    
    // Add subrules if they exist
    if (subsection.subrules) {
      Object.keys(subsection.subrules).forEach(subruleNum => {
        ruleHTML += `<div class="subrule" id="${subruleNum}">
          <strong>${subruleNum}</strong> ${subsection.subrules[subruleNum]}
        </div>`;
      });
    }
    
    ruleHTML += '</div>';
    
    // Display the rule
    ruleDisplay.innerHTML = ruleHTML;
    
    // Update related rules
    updateRelatedRules(subsection.related);
    
    // Hide search results when viewing a specific rule
    searchResults.classList.add('hidden');
    
    // Highlight the active rule in sidebar
    highlightActiveRule(ruleNum);
  }
  
  /**
   * Update breadcrumbs navigation
   */
  function updateBreadcrumbs(sectionNum, ruleNum, sectionName, ruleName) {
    breadcrumbs.innerHTML = `
      <span><a href="#" onclick="resetView(); return false;">Home</a></span>
      <span><a href="#" onclick="showSection(${sectionNum}); return false;">${sectionNum}. ${sectionName}</a></span>
      <span>${ruleNum}. ${ruleName}</span>
    `;
  }
  
  /**
   * Update related rules section
   */
  function updateRelatedRules(relatedRules) {
    // Clear existing related rules
    relatedRulesList.innerHTML = '';
    
    if (!relatedRules || relatedRules.length === 0) {
      const noRelated = document.createElement('li');
      noRelated.textContent = 'No related rules found.';
      relatedRulesList.appendChild(noRelated);
      return;
    }
    
    // Get current version
    const currentVersion = versionSelect.value;
    const rulesData = RULES_VERSIONS[currentVersion];
    
    // Add each related rule
    relatedRules.forEach(ruleNum => {
      const sectionNum = Math.floor(ruleNum / 100);
      if (!rulesData.sections[sectionNum] || 
          !rulesData.sections[sectionNum].subsections[ruleNum]) {
        return;
      }
      
      const relatedRule = rulesData.sections[sectionNum].subsections[ruleNum];
      const relatedItem = document.createElement('li');
      relatedItem.textContent = `${ruleNum}. ${relatedRule.name}`;
      relatedItem.addEventListener('click', () => displayRule(ruleNum));
      relatedRulesList.appendChild(relatedItem);
    });
  }
  
  /**
   * Perform search based on user input
   */
  function performSearch() {
    const query = searchInput.value.trim().toLowerCase();
    
    if (query.length < 2) {
      alert('Please enter at least 2 characters to search.');
      return;
    }
    
    // Clear previous results
    searchResultsList.innerHTML = '';
    
    // Perform search
    const results = SEARCH_INDEX.filter(item => 
      item.id.toLowerCase().includes(query) || 
      item.text.toLowerCase().includes(query)
    );
    
    // Update result count
    resultCountNumber.textContent = results.length;
    
    if (results.length === 0) {
      const noResults = document.createElement('li');
      noResults.textContent = 'No results found. Try different keywords.';
      searchResultsList.appendChild(noResults);
    } else {
      // Display search results
      results.forEach(result => {
        const resultItem = document.createElement('li');
        
        // Find rule section from the ID
        const ruleNum = result.id.split('.')[0];
        const sectionNum = Math.floor(ruleNum / 100);
        
        const section = RULES_VERSIONS.current.sections[sectionNum];
        const subsection = section?.subsections[ruleNum];
        
        if (!subsection) return;
        
        // Create result HTML with highlighting
        const resultTitle = document.createElement('div');
        resultTitle.className = 'search-result-title';
        resultTitle.textContent = `${result.id} - ${subsection.name}`;
        
        const resultExcerpt = document.createElement('div');
        resultExcerpt.className = 'search-result-excerpt';
        
        // Highlight matching text in excerpt
        let highlightedText = result.text;
        if (query && query.length > 0) {
          const regex = new RegExp(`(${query})`, 'gi');
          highlightedText = result.text.replace(regex, '<span class="highlighted">$1</span>');
        }
        
        resultExcerpt.innerHTML = highlightedText;
        
        resultItem.appendChild(resultTitle);
        resultItem.appendChild(resultExcerpt);
        resultItem.addEventListener('click', () => {
          const ruleId = result.id.split('.')[0];
          displayRule(ruleId);
          
          // If it's a subrule, scroll to it
          if (result.id.includes('.')) {
            setTimeout(() => {
              const subruleElement = document.getElementById(result.id);
              if (subruleElement) {
                subruleElement.scrollIntoView({ behavior: 'smooth' });
                subruleElement.classList.add('highlight-temp');
                setTimeout(() => {
                  subruleElement.classList.remove('highlight-temp');
                }, 2000);
              }
            }, 300);
          }
        });
        
        searchResultsList.appendChild(resultItem);
      });
    }
    
    // Show search results
    searchResults.classList.remove('hidden');
    
    // Hide welcome message if it's visible
    document.querySelector('.welcome-message')?.classList.add('hidden');
  }
  
  /**
   * Handle version change in dropdown
   */
  function handleVersionChange() {
    // Reinitialize sidebar with selected version
    initializeSidebar();
    
    // Reset view to welcome screen
    resetView();
  }
  
  /**
   * Reset view to welcome screen
   */
  function resetView() {
    // Show welcome message
    ruleDisplay.innerHTML = `
      <div class="welcome-message">
        <h2>Welcome to TCG Rules Explorer</h2>
        <p>Browse, search, and reference comprehensive rules in an intuitive way.</p>
        <p>Select a section from the sidebar or use the search function to get started.</p>
      </div>
    `;
    
    // Hide search results
    searchResults.classList.add('hidden');
    
    // Clear related rules
    relatedRulesList.innerHTML = '';
    
    // Reset breadcrumbs
    breadcrumbs.innerHTML = '<span>Home</span>';
    
    // Remove any active highlighting in sidebar
    document.querySelectorAll('.subsection-list li').forEach(item => {
      item.classList.remove('active');
    });
  }
  
  /**
   * Show a specific section
   */
  function showSection(sectionNum) {
    // Implement if needed for section view
    resetView();
    
    // Expand the section in sidebar
    const sectionHeader = document.querySelector(`.section-header[data-section="${sectionNum}"]`);
    if (sectionHeader && !sectionHeader.classList.contains('expanded')) {
      sectionHeader.querySelector('.section-toggle').click();
    }
  }
  
  /**
   * Highlight active rule in the sidebar
   */
  function highlightActiveRule(ruleNum) {
    // Remove previous highlighting
    document.querySelectorAll('.subsection-list li').forEach(item => {
      item.classList.remove('active');
    });
    
    // Add highlighting to current rule
    const ruleItem = document.querySelector(`.subsection-list li[data-rule="${ruleNum}"]`);
    if (ruleItem) {
      ruleItem.classList.add('active');
      
      // Ensure the section is expanded
      const sectionHeader = ruleItem.closest('.section-header');
      if (sectionHeader && !sectionHeader.classList.contains('expanded')) {
        sectionHeader.querySelector('.section-toggle').click();
      }
      
      // Scroll the rule into view if needed
      ruleItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
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

/**
 * Copy a link to a specific rule
 */
function copyRuleLink(ruleNum) {
  const url = `${window.location.origin}${window.location.pathname}?rule=${ruleNum}`;
  navigator.clipboard.writeText(url)
    .then(() => {
      alert('Link copied to clipboard!');
    })
    .catch(err => {
      console.error('Failed to copy link: ', err);
    });
}

/**
 * Global functions that need to be accessible from HTML
 */
function resetView() {
  // This will be called from the breadcrumbs
  const appContainer = document.querySelector('main');
  const event = new CustomEvent('resetView');
  appContainer.dispatchEvent(event);
}

function showSection(sectionNum) {
  // This will be called from the breadcrumbs
  const appContainer = document.querySelector('main');
  const event = new CustomEvent('showSection', { detail: { section: sectionNum } });
  appContainer.dispatchEvent(event);
} 