// Glossary Page JavaScript

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const glossarySearch = document.getElementById('glossary-search');
  const glossarySearchButton = document.getElementById('glossary-search-button');
  const glossaryTermsContainer = document.getElementById('glossary-terms');
  const letterLinks = document.querySelectorAll('.letter-link');
  const darkModeToggle = document.getElementById('dark-mode-toggle');
  
  // Initialize
  populateGlossary('all');
  initializeDarkMode();
  
  // Event Listeners
  glossarySearchButton.addEventListener('click', searchGlossary);
  glossarySearch.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') searchGlossary();
  });
  
  letterLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      // Remove active class from all links
      letterLinks.forEach(l => l.classList.remove('active'));
      
      // Add active class to clicked link
      e.target.classList.add('active');
      
      // Filter glossary by letter
      const letter = e.target.dataset.letter;
      populateGlossary(letter);
    });
  });
  
  darkModeToggle.addEventListener('click', toggleDarkMode);
  
  /**
   * Populate glossary with terms
   */
  function populateGlossary(filter) {
    // Clear existing terms
    glossaryTermsContainer.innerHTML = '';
    
    // Get all terms
    const terms = Object.keys(GLOSSARY).sort();
    
    if (terms.length === 0) {
      glossaryTermsContainer.innerHTML = '<p>No glossary terms available.</p>';
      return;
    }
    
    // Filter terms by letter if needed
    let filteredTerms = terms;
    if (filter !== 'all') {
      filteredTerms = terms.filter(term => term.charAt(0).toUpperCase() === filter);
    }
    
    if (filteredTerms.length === 0) {
      glossaryTermsContainer.innerHTML = `<p>No terms found starting with '${filter}'.</p>`;
      return;
    }
    
    // Group terms by first letter
    const groupedTerms = {};
    
    filteredTerms.forEach(term => {
      const firstLetter = term.charAt(0).toUpperCase();
      if (!groupedTerms[firstLetter]) {
        groupedTerms[firstLetter] = [];
      }
      groupedTerms[firstLetter].push(term);
    });
    
    // Create HTML for each group
    Object.keys(groupedTerms).sort().forEach(letter => {
      const letterGroup = document.createElement('div');
      letterGroup.className = 'letter-group';
      
      const letterHeader = document.createElement('h3');
      letterHeader.className = 'letter-header';
      letterHeader.textContent = letter;
      letterGroup.appendChild(letterHeader);
      
      const termsList = document.createElement('dl');
      termsList.className = 'terms-list';
      
      groupedTerms[letter].forEach(term => {
        const termItem = document.createElement('dt');
        termItem.className = 'term';
        termItem.textContent = term;
        
        const termDefinition = document.createElement('dd');
        termDefinition.className = 'definition';
        
        // Add rule references if they exist in the definition
        let definition = GLOSSARY[term];
        
        // Replace rule references with links
        definition = definition.replace(/rule (\d+(?:\.\d+)*)/g, 
          (match, ruleNum) => {
            return `<a href="index.html?rule=${ruleNum.split('.')[0]}" 
                      class="rule-reference">${match}</a>`;
          }
        );
        
        termDefinition.innerHTML = definition;
        
        termsList.appendChild(termItem);
        termsList.appendChild(termDefinition);
      });
      
      letterGroup.appendChild(termsList);
      glossaryTermsContainer.appendChild(letterGroup);
    });
  }
  
  /**
   * Search glossary terms
   */
  function searchGlossary() {
    const query = glossarySearch.value.trim().toLowerCase();
    
    if (query.length < 2) {
      alert('Please enter at least 2 characters to search.');
      return;
    }
    
    // Clear existing terms
    glossaryTermsContainer.innerHTML = '';
    
    // Search for matching terms
    const matchingTerms = Object.keys(GLOSSARY).filter(term => 
      term.toLowerCase().includes(query) || 
      GLOSSARY[term].toLowerCase().includes(query)
    );
    
    if (matchingTerms.length === 0) {
      glossaryTermsContainer.innerHTML = '<p>No matching terms found. Try different keywords.</p>';
      return;
    }
    
    // Create search results
    const resultsList = document.createElement('dl');
    resultsList.className = 'terms-list search-results';
    
    matchingTerms.sort().forEach(term => {
      const termItem = document.createElement('dt');
      termItem.className = 'term';
      termItem.textContent = term;
      
      const termDefinition = document.createElement('dd');
      termDefinition.className = 'definition';
      
      // Add rule references if they exist in the definition
      let definition = GLOSSARY[term];
      
      // Replace rule references with links
      definition = definition.replace(/rule (\d+(?:\.\d+)*)/g, 
        (match, ruleNum) => {
          return `<a href="index.html?rule=${ruleNum.split('.')[0]}" 
                    class="rule-reference">${match}</a>`;
        }
      );
      
      // Highlight search term in definition
      const regex = new RegExp(`(${query})`, 'gi');
      definition = definition.replace(regex, '<span class="highlighted">$1</span>');
      
      termDefinition.innerHTML = definition;
      
      resultsList.appendChild(termItem);
      resultsList.appendChild(termDefinition);
    });
    
    // Add search results to container
    const resultsHeader = document.createElement('h3');
    resultsHeader.textContent = `Search Results (${matchingTerms.length})`;
    
    glossaryTermsContainer.appendChild(resultsHeader);
    glossaryTermsContainer.appendChild(resultsList);
    
    // Remove active class from letter links
    letterLinks.forEach(link => link.classList.remove('active'));
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