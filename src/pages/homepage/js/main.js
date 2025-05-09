document.addEventListener('DOMContentLoaded', function() {
    // Sample data for creators (in a real app, this would come from an API)
    const creatorsData = {
        twitch: [
            {
                name: "MTGNerdGirl",
                description: "Limited specialist streaming draft and sealed events",
                image: "images/creator-placeholder1.jpg",
                social: {
                    twitch: "https://twitch.tv/mtgnerdgirl",
                    twitter: "https://twitter.com/mtgnerdgirl",
                    youtube: "https://youtube.com/mtgnerdgirl"
                }
            },
            {
                name: "NumotTheNummy",
                description: "Pro player streaming competitive constructed and limited",
                image: "images/creator-placeholder2.jpg",
                social: {
                    twitch: "https://twitch.tv/numotthenummy",
                    twitter: "https://twitter.com/numotthenummy",
                    youtube: "https://youtube.com/numotthenummy"
                }
            },
            {
                name: "LoadingReadyRun",
                description: "Variety MTG content and comedy",
                image: "images/creator-placeholder3.jpg",
                social: {
                    twitch: "https://twitch.tv/loadingreadyrun",
                    twitter: "https://twitter.com/loadingreadyrun",
                    youtube: "https://youtube.com/loadingreadyrun"
                }
            },
            {
                name: "CalebDMTG",
                description: "Competitive player focusing on Modern and Legacy",
                image: "images/creator-placeholder4.jpg",
                social: {
                    twitch: "https://twitch.tv/calebdmtg",
                    twitter: "https://twitter.com/calebdmtg"
                }
            }
        ],
        youtube: [
            {
                name: "The Command Zone",
                description: "Commander format focused content and gameplay",
                image: "images/creator-placeholder5.jpg",
                social: {
                    youtube: "https://youtube.com/commandzone",
                    twitter: "https://twitter.com/commandcast"
                }
            },
            {
                name: "Tolarian Community College",
                description: "Product reviews and MTG education",
                image: "images/creator-placeholder6.jpg",
                social: {
                    youtube: "https://youtube.com/tolariancommunity",
                    twitter: "https://twitter.com/tolariantutor"
                }
            },
            {
                name: "MTG Goldfish",
                description: "Budget decks and metagame analysis",
                image: "images/creator-placeholder7.jpg",
                social: {
                    youtube: "https://youtube.com/mtggoldfish",
                    twitter: "https://twitter.com/mtggoldfish"
                }
            },
            {
                name: "Pleasant Kenobi",
                description: "Modern format content with humor",
                image: "images/creator-placeholder8.jpg",
                social: {
                    youtube: "https://youtube.com/pleasantkenobi",
                    twitter: "https://twitter.com/pleasantkenobi",
                    twitch: "https://twitch.tv/pleasantkenobi"
                }
            }
        ],
        blogs: [
            {
                name: "Star City Games",
                description: "Strategy articles from top players",
                image: "images/creator-placeholder9.jpg",
                social: {
                    website: "https://starcitygames.com",
                    twitter: "https://twitter.com/starcitygames"
                }
            },
            {
                name: "Channel Fireball",
                description: "Pro player articles and strategy",
                image: "images/creator-placeholder10.jpg",
                social: {
                    website: "https://channelfireball.com",
                    twitter: "https://twitter.com/channelfireball"
                }
            },
            {
                name: "MTG Salvation",
                description: "Community-driven MTG content and forums",
                image: "images/creator-placeholder11.jpg",
                social: {
                    website: "https://mtgsalvation.com",
                    twitter: "https://twitter.com/mtgsalvation"
                }
            },
            {
                name: "EDHREC",
                description: "Commander data and deck recommendations",
                image: "images/creator-placeholder12.jpg",
                social: {
                    website: "https://edhrec.com",
                    twitter: "https://twitter.com/edhrec"
                }
            }
        ],
        merch: [
            {
                name: "Card Kingdom",
                description: "Singles, sealed product, and accessories",
                image: "images/creator-placeholder13.jpg",
                social: {
                    website: "https://cardkingdom.com",
                    twitter: "https://twitter.com/cardkingdom"
                }
            },
            {
                name: "Ultra PRO",
                description: "Premium MTG accessories and protection",
                image: "images/creator-placeholder14.jpg",
                social: {
                    website: "https://ultrapro.com",
                    twitter: "https://twitter.com/ultraproIntl"
                }
            },
            {
                name: "Inked Gaming",
                description: "Custom playmats and accessories",
                image: "images/creator-placeholder15.jpg",
                social: {
                    website: "https://inkedgaming.com",
                    twitter: "https://twitter.com/inkedgaming"
                }
            },
            {
                name: "Dragon Shield",
                description: "High-quality card sleeves and boxes",
                image: "images/creator-placeholder16.jpg",
                social: {
                    website: "https://dragonshield.com",
                    twitter: "https://twitter.com/dragonshieldusa"
                }
            }
        ]
    };

    // Function to create creator cards
    function createCreatorCard(creator) {
        const card = document.createElement('div');
        card.className = 'creator-card';
        
        let socialLinks = '';
        for (const [platform, url] of Object.entries(creator.social)) {
            let icon;
            switch(platform) {
                case 'twitch':
                    icon = 'fa-brands fa-twitch';
                    break;
                case 'twitter':
                    icon = 'fa-brands fa-twitter';
                    break;
                case 'youtube':
                    icon = 'fa-brands fa-youtube';
                    break;
                case 'website':
                    icon = 'fa-solid fa-globe';
                    break;
                default:
                    icon = 'fa-solid fa-link';
            }
            socialLinks += `<a href="${url}" target="_blank"><i class="${icon}"></i></a>`;
        }
        
        card.innerHTML = `
            <div class="creator-image">
                <img src="${creator.image}" alt="${creator.name}">
            </div>
            <div class="creator-content">
                <h3>${creator.name}</h3>
                <p>${creator.description}</p>
                <div class="creator-social">
                    ${socialLinks}
                </div>
            </div>
        `;
        
        return card;
    }

    // Function to display creators based on selected platform
    function displayCreators(platform) {
        const creatorsContainer = document.getElementById('creators-container');
        creatorsContainer.innerHTML = '';
        
        const creators = creatorsData[platform];
        if (creators && creators.length > 0) {
            creators.forEach(creator => {
                const card = createCreatorCard(creator);
                creatorsContainer.appendChild(card);
            });
        } else {
            creatorsContainer.innerHTML = '<p class="no-results">No creators found for this platform.</p>';
        }
    }

    // Set up tab functionality
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            tabButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Display creators for the selected platform
            const platform = this.getAttribute('data-platform');
            displayCreators(platform);
        });
    });

    // Display Twitch creators by default
    displayCreators('twitch');

    // Add smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId !== '#') {
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    window.scrollTo({
                        top: targetElement.offsetTop,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });
}); 