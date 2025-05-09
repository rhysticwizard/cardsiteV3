// MTG Comprehensive Rules Data
const RULES_VERSIONS = {
  current: {
    name: "Current",
    date: "November 8, 2024",
    version: "Magic: The Gathering Foundations",
    sections: {
      1: {
        name: "Game Concepts",
        subsections: {
          100: {
            name: "General",
            content: "This section covers fundamental game concepts.",
            subrules: {
              "100.1": "These Magic rules apply to any Magic game with two or more players, including two-player games and multiplayer games.",
              "100.2": "To play, each player needs their own deck of traditional Magic cards, small items to represent any tokens and counters, and some way to clearly track life totals.",
              "100.3": "Some casual variants require additional items, such as specially designated cards, nontraditional Magic cards, and dice."
            },
            related: [101, 102, 103]
          },
          101: {
            name: "The Magic Golden Rules",
            content: "The Golden Rules of Magic are rules that override all other rules.",
            subrules: {
              "101.1": "Whenever a card's text directly contradicts these rules, the card takes precedence. The card overrides only the rule that applies to that specific situation.",
              "101.2": "When a rule or effect says something can't happen and another effect says it can happen, the 'can't' effect takes precedence.",
              "101.3": "If an instruction requires taking an impossible action, it's ignored. (In many cases the card will specify consequences for this; if it doesn't, there's no effect.)"
            },
            related: [100, 113, 609]
          },
          102: {
            name: "Players",
            content: "This section covers player-related rules.",
            subrules: {
              "102.1": "A player is one of the people in the game. The active player is the player whose turn it is. The other players are nonactive players.",
              "102.2": "In a two-player game, a player's opponent is the other player.",
              "102.3": "In a multiplayer game between teams, a player's teammates are the other players on their team, and the player's opponents are all players not on their team."
            },
            related: [103, 104, 119]
          },
          103: {
            name: "Starting the Game",
            content: "This section covers the procedures for starting a game.",
            subrules: {
              "103.1": "At the start of a game, the players determine which one of them will choose who takes the first turn. In the first game of a match, the players may use any mutually agreeable method (flipping a coin, rolling dice, etc.) to do so.",
              "103.2": "After the starting player has been determined, each player shuffles their deck so that the cards are in a random order."
            },
            related: [102, 104]
          }
        }
      },
      2: {
        name: "Parts of a Card",
        subsections: {
          200: {
            name: "General",
            content: "This section covers the physical components of a card.",
            subrules: {
              "200.1": "The parts of a card are name, mana cost, illustration, color indicator, type line, expansion symbol, text box, power and toughness, loyalty, hand modifier, life modifier, illustration credit, legal text, and collector number.",
              "200.2": "Some parts of a card are also characteristics of the object that has them. See rule 109.3."
            },
            related: [201, 202, 205]
          },
          201: {
            name: "Name",
            content: "This section covers the name of a card.",
            subrules: {
              "201.1": "The name of a card is printed on its upper left corner.",
              "201.2": "A card's name is always considered to be the English version of its name, regardless of printed language."
            },
            related: [200, 706]
          }
        }
      },
      3: {
        name: "Card Types",
        subsections: {
          300: {
            name: "General",
            content: "This section covers card types.",
            subrules: {
              "300.1": "The card types are artifact, battle, conspiracy, creature, dungeon, enchantment, instant, land, phenomenon, plane, planeswalker, scheme, sorcery, tribal, and vanguard.",
              "300.2": "Some objects have more than one card type (for example, an artifact creature). Such objects combine the aspects of each of those card types, and are subject to spells and abilities that affect either or all of those card types."
            },
            related: [301, 302, 303, 304, 305]
          }
        }
      },
      4: {
        name: "Zones",
        subsections: {
          400: {
            name: "General",
            content: "This section covers zones in the game.",
            subrules: {
              "400.1": "A zone is a place where objects can be during a game. There are normally seven zones: library, hand, battlefield, graveyard, stack, exile, and command.",
              "400.2": "Public zones are zones in which all players can see the cards' faces, except for those cards that some rule or effect specifically allow to be face down. The battlefield, graveyard, stack, exile, ante, and command zones are public zones. Hidden zones are zones in which not all players can be expected to see the cards' faces. The library and hand are hidden zones, even if all the cards in one such zone happen to be revealed."
            },
            related: [401, 403, 404]
          }
        }
      },
      5: {
        name: "Turn Structure",
        subsections: {
          500: {
            name: "General",
            content: "This section covers the structure of a turn.",
            subrules: {
              "500.1": "A turn consists of five phases, in this order: beginning, precombat main, combat, postcombat main, and ending. Each of these phases takes place every turn, even if nothing happens during the phase.",
              "500.2": "A phase or step in which players receive priority ends when the stack is empty and all players pass in succession."
            },
            related: [501, 505, 506]
          }
        }
      },
      6: {
        name: "Spells, Abilities, and Effects",
        subsections: {
          600: {
            name: "General",
            content: "This section covers spells, abilities, and effects.",
            subrules: {
              "600.1": "This section covers rules for spells, abilities, and effects.",
              "600.2": "Spells, abilities, and effects can affect objects and players they refer to. They can also affect the rules of the game, as long as they don't affect the rules for spells, abilities, and effects themselves."
            },
            related: [601, 602, 603]
          }
        }
      },
      7: {
        name: "Additional Rules",
        subsections: {
          700: {
            name: "General",
            content: "This section covers additional rules.",
            subrules: {
              "700.1": "Anything that happens in a game is an event. Multiple events may take place during the resolution of a spell or ability.",
              "700.2": "A spell or ability is modal if it has two or more options in a bulleted list preceded by instructions to choose a number of those options, such as 'Choose one —'."
            },
            related: [701, 702, 703]
          }
        }
      },
      8: {
        name: "Multiplayer Rules",
        subsections: {
          800: {
            name: "General",
            content: "This section covers rules for multiplayer games.",
            subrules: {
              "800.1": "A multiplayer game is a game that begins with more than two players. This section contains additional optional rules that can be used for multiplayer play.",
              "800.2": "These rules consist of a series of options that can be added to a multiplayer game and a number of variant styles of multiplayer play."
            },
            related: [801, 806, 810]
          }
        }
      },
      9: {
        name: "Casual Variants",
        subsections: {
          900: {
            name: "General",
            content: "This section covers casual variants.",
            subrules: {
              "900.1": "This section contains additional optional rules that can be used for certain casual game variants. It is by no means comprehensive.",
              "900.2": "The casual variants detailed here use supplemental zones, rules, cards, and other game implements not used in traditional Magic games."
            },
            related: [901, 903, 904]
          }
        }
      }
    }
  },
  previous: {
    name: "Previous",
    date: "August 11, 2023",
    version: "Wilds of Eldraine",
    sections: {
      // This would contain previous version data
      // For demo purposes, we're keeping this empty
    }
  }
};

// Cross-references for rules
const RULE_CROSS_REFERENCES = {
  "100.1": ["102", "800"],
  "101.2": ["101.3", "613"],
  "102.1": ["500", "505"],
  "300.1": ["301", "302", "303", "304", "305", "306", "307", "308", "309", "310", "311", "312", "313", "314", "315"],
  "400.1": ["401", "402", "403", "404", "405", "406", "407", "408"],
  "500.1": ["501", "505", "506", "512"],
  "600.1": ["601", "602", "603", "604", "608", "609"],
  "700.1": ["701", "702", "703", "704"]
};

// Glossary of MTG terms
const GLOSSARY = {
  "Active Player": "The player whose turn it is. See rule 102.1.",
  "Ability": "1. Text on an object that explains what that object does or can do. 2. An activated or triggered ability on the stack. This kind of ability is an object. See rule 113, \"Abilities,\" and section 6, \"Spells, Abilities, and Effects.\"",
  "Activated Ability": "A kind of ability. Activated abilities are written as \"[Cost]: [Effect].\" See rule 113, \"Abilities,\" and rule 602, \"Activating Activated Abilities.\"",
  "Combat Phase": "Part of the turn. This phase is the fourth phase of the turn. See rule 506, \"Combat Phase.\"",
  "Deck": "The collection of cards a player starts the game with; it becomes that player's library. See rule 100, \"General,\" and rule 103, \"Starting the Game.\""
};

// Version history for tracking rule changes
const VERSION_HISTORY = [
  {
    date: "November 8, 2024",
    version: "Magic: The Gathering Foundations",
    changes: [
      {
        rule: "700.2",
        old: "A spell or ability is modal if it has two or more options preceded by 'Choose one —,' 'Choose two —,' 'Choose one or both —,' 'Choose one or more —,' or similar.",
        new: "A spell or ability is modal if it has two or more options in a bulleted list preceded by instructions to choose a number of those options, such as 'Choose one —'."
      }
    ]
  },
  {
    date: "August 11, 2023",
    version: "Wilds of Eldraine",
    changes: [
      {
        rule: "102.1",
        old: "A player is one of the people in the game. The active player is the player whose turn it is.",
        new: "A player is one of the people in the game. The active player is the player whose turn it is. The other players are nonactive players."
      }
    ]
  }
];

// Search index for quick rule lookup
const SEARCH_INDEX = [
  { id: "100.1", text: "These Magic rules apply to any Magic game with two or more players, including two-player games and multiplayer games." },
  { id: "100.2", text: "To play, each player needs their own deck of traditional Magic cards, small items to represent any tokens and counters, and some way to clearly track life totals." },
  { id: "101.1", text: "Whenever a card's text directly contradicts these rules, the card takes precedence. The card overrides only the rule that applies to that specific situation." },
  { id: "101.2", text: "When a rule or effect says something can't happen and another effect says it can happen, the 'can't' effect takes precedence." },
  { id: "102.1", text: "A player is one of the people in the game. The active player is the player whose turn it is. The other players are nonactive players." },
  { id: "200.1", text: "The parts of a card are name, mana cost, illustration, color indicator, type line, expansion symbol, text box, power and toughness, loyalty, hand modifier, life modifier, illustration credit, legal text, and collector number." },
  { id: "300.1", text: "The card types are artifact, battle, conspiracy, creature, dungeon, enchantment, instant, land, phenomenon, plane, planeswalker, scheme, sorcery, tribal, and vanguard." },
  { id: "400.1", text: "A zone is a place where objects can be during a game. There are normally seven zones: library, hand, battlefield, graveyard, stack, exile, and command." },
  { id: "500.1", text: "A turn consists of five phases, in this order: beginning, precombat main, combat, postcombat main, and ending. Each of these phases takes place every turn, even if nothing happens during the phase." },
  { id: "600.1", text: "This section covers rules for spells, abilities, and effects." },
  { id: "700.1", text: "Anything that happens in a game is an event. Multiple events may take place during the resolution of a spell or ability." },
  { id: "800.1", text: "A multiplayer game is a game that begins with more than two players. This section contains additional optional rules that can be used for multiplayer play." },
  { id: "900.1", text: "This section contains additional optional rules that can be used for certain casual game variants. It is by no means comprehensive." }
]; 