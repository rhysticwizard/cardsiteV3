// Timeline data from https://mtg.fandom.com/wiki/Timeline
export interface Event {
  date: string;
  title: string;
  description: string;
  id?: string;
}

export interface Era {
  era: string;
  title: string;
  events: Event[];
}

export const timelineData: Era[] = [
  // Pre-History (before -20,000 AR)
  {
    era: 'pre-history',
    title: 'Pre-History (before -20,000 AR)',
    events: [
      {
        date: 'Unknown',
        title: 'The Elder Dragon War',
        description: 'A conflict between Elder Dragons and other ancient races of Dominaria.'
      },
      {
        date: 'Unknown',
        title: 'Ancient Viashino Civilization',
        description: 'An early civilization of viashino rises and falls on Dominaria.'
      }
    ]
  },
  
  // Mythohistory (-20,000 AR to -15,000 AR)
  {
    era: 'mythohistory',
    title: 'Mythohistory (-20,000 AR to -15,000 AR)',
    events: [
      {
        date: 'c. -20,000 AR',
        title: 'The Time of Dragons',
        description: 'Elder Dragons rule Dominaria, with the five Primeval Dragons as the most powerful.'
      },
      {
        date: 'c. -15,000 AR',
        title: 'The Dragon War',
        description: 'A war between the Elder Dragons that nearly extinguishes their race.'
      },
      {
        date: 'c. -15,000 AR',
        title: 'The Fall of the Primevals',
        description: 'The five Primeval Dragons disappear after the Elder Dragon War.'
      }
    ]
  },
  
  // Time of the Thran (Up to c. -5000 AR)
  {
    era: 'thran',
    title: 'Time of the Thran (Up to c. -5000 AR)',
    events: [
      {
        date: 'c. -5000 AR',
        title: 'The Thran Empire',
        description: 'A powerful, technologically advanced civilization spans Dominaria.'
      },
      {
        date: 'c. -5000 AR',
        title: 'Thran Civil War',
        description: 'Yawgmoth leads a faction against the Thran establishment.'
      },
      {
        date: 'c. -5000 AR',
        title: 'Creation of Phyrexia',
        description: 'Yawgmoth transforms the artificial plane of Phyrexia into a mechanical hell.'
      },
      {
        date: 'c. -5000 AR',
        title: 'Fall of the Thran',
        description: 'The once-mighty empire collapses after Yawgmoth releases a plague.'
      }
    ]
  },
  
  // Time of Legends (-5000 AR to 0 AR)
  {
    era: 'legends',
    title: 'Time of Legends (-5000 AR to 0 AR)',
    events: [
      {
        date: 'c. -4500 AR',
        title: 'Rise of the First Minotaur Empire',
        description: 'A powerful minotaur civilization emerges in the Hurloon Mountains.'
      },
      {
        date: 'c. -2000 AR',
        title: 'Civilization in Terisiare',
        description: 'Human civilization flourishes on the continent of Terisiare.'
      },
      {
        date: '0 AR',
        title: 'Birth of Urza and Mishra',
        description: 'The brothers who would change Dominaria\'s history are born.'
      }
    ]
  },
  
  // The Brothers' War (20 AR to 64 AR)
  {
    era: 'brothers-war',
    title: 'The Brothers\' War (20 AR to 64 AR)',
    events: [
      {
        date: '20 AR',
        title: 'Urza and Mishra Discover the Thran Mightstone and Weakstone',
        description: 'The brothers uncover powerful Thran artifacts that would drive them apart.'
      },
      {
        date: '30-64 AR',
        title: 'Antiquities War',
        description: 'The devastating war between brothers Urza and Mishra consumes Dominaria.'
      },
      {
        date: '64 AR',
        title: 'The Sylex Blast',
        description: 'Urza detonates the Golgothian Sylex, ending the war but devastating Dominaria.'
      },
      {
        date: '64 AR',
        title: 'Ice Age Begins',
        description: 'The Sylex Blast triggers climate change, beginning Dominaria\'s Ice Age.'
      },
      {
        date: '64 AR',
        title: 'Urza\'s Ascension',
        description: 'Urza becomes a planeswalker following the Sylex Blast.'
      }
    ]
  },
  
  // Dark Age (64 AR to 450 AR)
  {
    era: 'dark-age',
    title: 'Dark Age (64 AR to 450 AR)',
    events: [
      {
        date: '64-450 AR',
        title: 'The Dark',
        description: 'A period of anti-magic sentiment and scattered civilization on Dominaria.'
      },
      {
        date: 'c. 170 AR',
        title: 'Rise of the Church of Tal',
        description: 'An anti-magic religion gains prominence in Terisiare.'
      },
      {
        date: 'c. 200 AR',
        title: 'Ith is Imprisoned',
        description: 'The wizard Ith is imprisoned by the Church of Tal.'
      }
    ]
  },
  
  // Ice Age (450 AR to 2934 AR)
  {
    era: 'ice-age',
    title: 'Ice Age (450 AR to 2934 AR)',
    events: [
      {
        date: '450 AR',
        title: 'Beginning of the Ice Age',
        description: 'The official start of the prolonged winter on Dominaria.'
      },
      {
        date: 'c. 2500 AR',
        title: 'Lim-Dûl\'s Rise to Power',
        description: 'The necromancer gains considerable power in Terisiare.'
      },
      {
        date: '2934 AR',
        title: 'The World Spell',
        description: 'Freyalise casts the World Spell, ending the Ice Age.'
      }
    ]
  },
  
  // The Thaw (2934 AR to 3285 AR)
  {
    era: 'thaw',
    title: 'The Thaw (2934 AR to 3285 AR)',
    events: [
      {
        date: '2934-3000 AR',
        title: 'The Flood Age',
        description: 'As ice melts, sea levels rise significantly across Dominaria.'
      },
      {
        date: '3000-3285 AR',
        title: 'The Empty Quarter',
        description: 'A period of history with limited records, when civilizations rebuiled after the Ice Age.'
      }
    ]
  },
  
  // War with Phyrexia (3285 AR to 4206 AR)
  {
    era: 'phyrexia',
    title: 'War with Phyrexia (3285 AR to 4206 AR)',
    events: [
      {
        date: '3285 AR',
        title: 'The Tolarian Academy is Founded',
        description: 'Urza establishes a school for wizards to prepare for war with Phyrexia.'
      },
      {
        date: 'c. 3307 AR',
        title: 'The Tolarian Time Disaster',
        description: 'An experiment goes wrong, creating time rifts and bubbles around the academy.'
      },
      {
        date: 'c. 3400 AR',
        title: 'Creation of the Legacy Weapon',
        description: 'Urza begins creating the weapon intended to destroy Phyrexia.'
      },
      {
        date: '4205 AR',
        title: 'Phyrexian Invasion Begins',
        description: 'Phyrexia launches its long-planned invasion of Dominaria.'
      },
      {
        date: '4205 AR',
        title: 'Coalition Forms',
        description: 'Various nations and peoples of Dominaria unite to fight the Phyrexian threat.'
      },
      {
        date: '4206 AR',
        title: 'Gerrard Activates the Legacy Weapon',
        description: 'The weapon destroys Yawgmoth, ending the Phyrexian invasion.'
      }
    ]
  },
  
  // The Rift Era (4206 AR to 4500 AR)
  {
    era: 'rift',
    title: 'The Rift Era (4206 AR to 4500 AR)',
    events: [
      {
        date: '4306 AR',
        title: 'Karona Crisis',
        description: 'The manifestation of Dominaria\'s mana causes chaos across the plane.'
      },
      {
        date: 'c. 4500 AR',
        title: 'Time Rifts Crisis',
        description: 'Temporal rifts threaten the structure of the Multiverse.'
      },
      {
        date: '4500 AR',
        title: 'The Mending',
        description: 'Planeswalkers sacrifice their godlike power to heal the rifts and save the Multiverse.'
      }
    ]
  },
  
  // The Mending Era (4500 AR to 4562 AR)
  {
    era: 'mending',
    title: 'The Mending Era (4500 AR to 4562 AR)',
    events: [
      {
        date: 'c. 4528 AR',
        title: 'Rise of the Eldrazi',
        description: 'Ancient Eldrazi titans are released from their prison on Zendikar.'
      },
      {
        date: 'c. 4560 AR',
        title: 'The Gatewatch Forms',
        description: 'A group of planeswalkers forms an alliance to protect the Multiverse.'
      },
      {
        date: 'c. 4561 AR',
        title: 'War of the Spark',
        description: 'Nicol Bolas attempts to harvest planeswalker sparks but is defeated on Ravnica.'
      },
      {
        date: '4562 AR',
        title: 'New Phyrexian Invasion',
        description: 'The Phyrexians, led by Elesh Norn, launch an invasion of the Multiverse.'
      },
      {
        date: '4562 AR',
        title: 'March of the Machine',
        description: 'Planeswalkers unite to fight the Phyrexian threat across multiple planes.'
      }
    ]
  },
  
  // The Omenpath Era (4562 AR - present)
  {
    era: 'omenpath',
    title: 'The Omenpath Era (4562 AR - present)',
    events: [
      {
        date: '4562 AR',
        title: 'Aftermath of the Phyrexian War',
        description: 'Planes begin to recover from the Phyrexian invasion.'
      },
      {
        date: '4562 AR',
        title: 'Omenpath Network Forms',
        description: 'A new network of planar paths forms, connecting planes in new ways.'
      },
      {
        date: 'Current',
        title: 'The Present Day',
        description: 'Current events in the Magic multiverse.'
      }
    ]
  }
];

// Process the data to add unique IDs for each event
timelineData.forEach((era, eraIndex) => {
  era.events.forEach((event, eventIndex) => {
    event.id = `${era.era}-${eventIndex}`;
  });
});

// Utility function to get all events as a flat array
export const getAllEvents = () => {
  return timelineData.flatMap(era => 
    era.events.map(event => ({
      ...event,
      era: era.era
    }))
  );
}; 