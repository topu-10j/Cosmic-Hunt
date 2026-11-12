const DATA = [
  {
    "id": "proxima-centauri-b",
    "name": "Proxima Centauri b",
    "type": "Rocky Exoplanet",
    "details": {
      "distance": "4.24 Light Years",
      "mass": "≥1.07 Earths",
      "radius": "~1.1 Earths (estimated)",
      "orbitalPeriod": "11.2 Days",
      "temperature": "234 K (-39°C)",
      "discoveryYear": 2016,
      "description": "The closest known exoplanet to our Solar System. It orbits the red dwarf Proxima Centauri inside the habitable zone, but its star sends out strong flares."
    },
    "infrared": {
      "heatLevel": "Moderate",
      "colorCode": "#FF8C00"
    },
    "structure": [
      {
        "layerId": "core",
        "layerName": "Iron Core",
        "description": "A dense metal core, likely rich in iron. It may or may not generate a magnetic field.",
        "color": "#FF3B30"
      },
      {
        "layerId": "mantle",
        "layerName": "Silicate Mantle",
        "description": "A thick layer of hot rock that slowly churns beneath the surface.",
        "color": "#FF9500"
      },
      {
        "layerId": "crust",
        "layerName": "Rocky Crust",
        "description": "A thin solid shell that may be scorched on one side and frozen on the other.",
        "color": "#A67C52"
      }
    ],
    "clues": [
      "My star is the closest one to our Sun.",
      "A year on my world lasts only about 11 Earth days.",
      "I orbit a small red dwarf that often throws flares."
    ]
  },

  {
    "id": "trappist-1e",
    "name": "TRAPPIST-1e",
    "type": "Rocky Exoplanet",
    "details": {
      "distance": "40.7 Light Years",
      "mass": "0.69 Earths",
      "radius": "0.92 Earths",
      "orbitalPeriod": "6.1 Days",
      "temperature": "251 K (-22°C)",
      "discoveryYear": 2017,
      "description": "One of seven Earth-sized planets circling the ultracool dwarf star TRAPPIST-1. It sits in the habitable zone, where liquid water could exist."
    },
    "infrared": {
      "heatLevel": "Moderate",
      "colorCode": "#FF8C00"
    },
    "structure": [
      {
        "layerId": "core",
        "layerName": "Iron Core",
        "description": "A compact, dense core. TRAPPIST-1e is slightly less dense than Earth, so the core may be smaller.",
        "color": "#FF3B30"
      },
      {
        "layerId": "mantle",
        "layerName": "Silicate Mantle",
        "description": "A deep rocky layer that stores most of the planet's heat.",
        "color": "#FF9500"
      },
      {
        "layerId": "crust",
        "layerName": "Rocky Crust",
        "description": "A solid surface that could hold oceans, ice, or thick clouds.",
        "color": "#5E8CA8"
      }
    ],
    "clues": [
      "I am one of seven worlds circling the same tiny star.",
      "My star is about 40 light years away.",
      "I may sit where liquid water could exist."
    ]
  },

  {
    "id": "kepler-452b",
    "name": "Kepler-452b",
    "type": "Super-Earth",
    "details": {
      "distance": "1402 Light Years",
      "mass": "~5 Earths",
      "radius": "1.6 Earths",
      "orbitalPeriod": "384.8 Days",
      "temperature": "265 K (-8°C)",
      "discoveryYear": 2015,
      "description": "Kepler-452b orbits the Sun-like star Kepler-452. It was the first potentially rocky super-Earth found in the habitable zone of a Sun-like star."
    },
    "infrared": {
      "heatLevel": "Moderate",
      "colorCode": "#FF8C00"
    },
    "structure": [
      {
        "layerId": "core",
        "layerName": "Iron Core",
        "description": "A dense, solid iron core similar to Earth's, possibly generating a magnetic field.",
        "color": "#FF0000"
      },
      {
        "layerId": "mantle",
        "layerName": "Silicate Mantle",
        "description": "A thick layer of rocky silicates, slowly churning with heat.",
        "color": "#FFA500"
      },
      {
        "layerId": "crust",
        "layerName": "Rocky Crust",
        "description": "The outermost solid shell, possibly covered in water or thick clouds.",
        "color": "#8B4513"
      }
    ],
    "clues": [
      "I am about 1.6 times the size of Earth.",
      "My star is about 6 billion years old, older than our Sun.",
      "I am located in the habitable zone of my solar system."
    ]
  },

  {
    "id": "55-cancri-e",
    "name": "55 Cancri e",
    "type": "Lava Super-Earth",
    "details": {
      "distance": "41 Light Years",
      "mass": "8.0 Earths",
      "radius": "1.88 Earths",
      "orbitalPeriod": "0.74 Days (17.7 hours)",
      "temperature": "1950 K (~1677°C)",
      "discoveryYear": 2004,
      "description": "A super-Earth so close to its star that a year lasts under 18 hours. Its surface is hot enough to be covered in molten rock."
    },
    "infrared": {
      "heatLevel": "Extreme",
      "colorCode": "#FF0000"
    },
    "structure": [
      {
        "layerId": "core",
        "layerName": "Molten Iron Core",
        "description": "A heavy metal core under enormous pressure.",
        "color": "#FFD60A"
      },
      {
        "layerId": "mantle",
        "layerName": "Magma Mantle",
        "description": "A deep layer of partly molten rock heated by the nearby star.",
        "color": "#FF5A1F"
      },
      {
        "layerId": "crust",
        "layerName": "Lava Surface",
        "description": "A glowing surface of molten rock, with possible carbon-rich material.",
        "color": "#B3260E"
      }
    ],
    "clues": [
      "I am a scorching hot lava planet.",
      "A year on my planet lasts less than 18 hours.",
      "I orbit a star that is visible to the naked eye."
    ]
  },

  {
    "id": "wasp-12b",
    "name": "WASP-12b",
    "type": "Hot Jupiter (Gas Giant)",
    "details": {
      "distance": "~1410 Light Years",
      "mass": "~467 Earths (1.47 Jupiters)",
      "radius": "~21 Earths (1.9 Jupiters)",
      "orbitalPeriod": "1.09 Days",
      "temperature": "2580 K (~2307°C)",
      "discoveryYear": 2008,
      "description": "A giant planet so close to its star that it is stretched into an egg shape and slowly losing gas to the star."
    },
    "infrared": {
      "heatLevel": "Extreme",
      "colorCode": "#FF0000"
    },
    "structure": [
      {
        "layerId": "core",
        "layerName": "Dense Core",
        "description": "A small, dense core of rock and iron, if one exists.",
        "color": "#FF3B30"
      },
      {
        "layerId": "metallic",
        "layerName": "Metallic Hydrogen Layer",
        "description": "Hydrogen squeezed so hard it behaves like a liquid metal.",
        "color": "#C77DFF"
      },
      {
        "layerId": "envelope",
        "layerName": "Gas Envelope",
        "description": "A huge, puffed-up atmosphere of hydrogen and helium.",
        "color": "#D9A066"
      }
    ],
    "clues": [
      "I am a gas giant puffed up by intense heat.",
      "My star is slowly pulling gas away from me.",
      "I am about 1.9 times the width of Jupiter."
    ]
  },

  {
    "id": "planet-x",
    "name": "Planet X",
    "type": "Unknown Mystery Object",
    "details": {
      "distance": "Unknown",
      "mass": "Unknown",
      "radius": "Unknown",
      "orbitalPeriod": "Unknown",
      "temperature": "Unknown",
      "discoveryYear": "TBD",
      "description": "A mysterious object hidden in the infrared spectrum, detected by NASA's SPHEREx telescope."
    },
    "infrared": {
      "heatLevel": "Extreme",
      "colorCode": "#8A2BE2"
    },
    "structure": [
      {
        "layerId": "core",
        "layerName": "Unknown Core",
        "description": "Data encrypted. Needs further SPHEREx analysis.",
        "color": "#333333"
      }
    ],
    "clues": [
      "I am hidden in the infrared light.",
      "SPHEREx telescope detected my signature at 3.3 µm.",
      "I am the ultimate mystery of the universe."
    ]
  }
];