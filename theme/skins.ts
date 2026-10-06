/** Valorem game skins. Lumen pattern: one skin object per installed game id. */
export const gameSkins = [
  {
    gameId: "slots",
    displayName: "Valorem Reels",
    symbols: [
      {
        id: "wild",
        label: "Wild",
        art: {
          kind: "glyph",
          value: "◆",
        },
      },
      {
        id: "s1",
        label: "Pearl",
        art: {
          kind: "glyph",
          value: "○",
        },
      },
      {
        id: "s2",
        label: "Stone",
        art: {
          kind: "glyph",
          value: "◇",
        },
      },
      {
        id: "s3",
        label: "Ingot",
        art: {
          kind: "glyph",
          value: "△",
        },
      },
      {
        id: "s4",
        label: "Coin",
        art: {
          kind: "glyph",
          value: "●",
        },
      },
      {
        id: "s5",
        label: "Plaque",
        art: {
          kind: "glyph",
          value: "□",
        },
      },
      {
        id: "s6",
        label: "Star",
        art: {
          kind: "glyph",
          value: "✶",
        },
      }
    ],
    colors: {
      felt: "#07140e",
      surface: "#123024",
      text: "#eef3ee",
      muted: "#c5d1c6",
      accent: "#d9b75f",
      win: "#24301a",
      danger: "#f08080",
      feltDeep: "#06110c",
      line: "rgba(217,183,95,0.55)",
    },
    fonts: {
      body: "\"Jost\", system-ui, sans-serif",
      display: "\"Cormorant Garamond\", Georgia, serif",
    },
    sounds: [
      {
        id: "spin",
        src: "",
      },
      {
        id: "win",
        src: "",
      },
      {
        id: "lose",
        src: "",
      },
      {
        id: "click",
        src: "",
      }
    ],
    copy: {
      intro: "Five reels. Valorem play is settled on the server.",
      "wild-rule": "The diamond stands in for any other symbol.",
      "no-win": "No aligned line on this sample round.",
    },
  },
  {
    gameId: "plinko",
    displayName: "Valorem Drop",
    symbols: [],
    colors: {
      felt: "#07140e",
      surface: "#123024",
      text: "#eef3ee",
      muted: "#c5d1c6",
      accent: "#d9b75f",
      win: "#24301a",
      danger: "#f08080",
      line: "rgba(238,243,238,0.16)",
      peg: "#d9b75f",
      ball: "#c3cad6",
    },
    fonts: {
      body: "\"Jost\", system-ui, sans-serif",
      display: "\"Cormorant Garamond\", Georgia, serif",
    },
    sounds: [
      {
        id: "spin",
        src: "",
      },
      {
        id: "win",
        src: "",
      },
      {
        id: "lose",
        src: "",
      },
      {
        id: "click",
        src: "",
      }
    ],
    copy: {
      "aim-note": "Aim is shown as a sample control. The path in this prototype is a fixed sequence.",
    },
  },
  {
    gameId: "vault-stack",
    displayName: "Valorem Stack",
    symbols: [],
    colors: {
      felt: "#07140e",
      surface: "#123024",
      text: "#eef3ee",
      muted: "#c5d1c6",
      accent: "#d9b75f",
      win: "#24301a",
      danger: "#f08080",
      feltDeep: "#06110c",
      coin0: "#8a6a1c",
      coin1: "#c9a145",
      coin2: "#d9b75f",
      coin3: "#f3dc94",
      coin4: "#c3cad6",
      coin5: "#eef3ee",
      coin6: "#9fd7b8",
      coin7: "#1a3d2e",
      coin8: "#f08080",
    },
    fonts: {
      body: "\"Jost\", system-ui, sans-serif",
      display: "\"Cormorant Garamond\", Georgia, serif",
    },
    sounds: [
      {
        id: "spin",
        src: "",
      },
      {
        id: "win",
        src: "",
      },
      {
        id: "lose",
        src: "",
      },
      {
        id: "click",
        src: "",
      }
    ],
    copy: {
      "empty-board": "A board starts at 25 Valorem. Each mint is 10 Valorem.",
      "select-tray": "Mint follows a fixed sample sequence. No board value is calculated here.",
    },
  },
  {
    gameId: "keno",
    displayName: "Valorem Draw",
    symbols: [
      {
        id: "spot",
        label: "Spot",
        art: {
          kind: "glyph",
          value: "○",
        },
      },
      {
        id: "hit",
        label: "Hit",
        art: {
          kind: "glyph",
          value: "●",
        },
      },
      {
        id: "draw",
        label: "Draw",
        art: {
          kind: "glyph",
          value: "◆",
        },
      }
    ],
    colors: {
      felt: "#07140e",
      surface: "#123024",
      text: "#eef3ee",
      muted: "#c5d1c6",
      accent: "#d9b75f",
      win: "#24301a",
      danger: "#f08080",
    },
    fonts: {
      body: "\"Jost\", system-ui, sans-serif",
      display: "\"Cormorant Garamond\", Georgia, serif",
    },
    sounds: [
      {
        id: "spin",
        src: "",
      },
      {
        id: "win",
        src: "",
      },
      {
        id: "lose",
        src: "",
      },
      {
        id: "click",
        src: "",
      }
    ],
    copy: {
      intro: "Pick spots. The draw is decided on the server.",
      "pay-note": "Package figures run about 95.00 to 96.05 percent by pick count. Not a certified PAR sheet. This prototype does not calculate a return.",
      "no-win": "No matching spots on this sample round.",
    },
  },
  {
    gameId: "scratch",
    displayName: "Valorem Card",
    symbols: [
      {
        id: "m1",
        label: "One",
        art: {
          kind: "glyph",
          value: "1",
        },
      },
      {
        id: "m2",
        label: "Two",
        art: {
          kind: "glyph",
          value: "2",
        },
      },
      {
        id: "m5",
        label: "Five",
        art: {
          kind: "glyph",
          value: "5",
        },
      },
      {
        id: "m10",
        label: "Ten",
        art: {
          kind: "glyph",
          value: "10",
        },
      },
      {
        id: "m25",
        label: "Twenty-five",
        art: {
          kind: "glyph",
          value: "25",
        },
      },
      {
        id: "m50",
        label: "Fifty",
        art: {
          kind: "glyph",
          value: "50",
        },
      },
      {
        id: "m100",
        label: "Hundred",
        art: {
          kind: "glyph",
          value: "100",
        },
      }
    ],
    colors: {
      felt: "#07140e",
      surface: "#123024",
      text: "#eef3ee",
      muted: "#c5d1c6",
      accent: "#d9b75f",
      win: "#24301a",
      danger: "#f08080",
    },
    fonts: {
      body: "\"Jost\", system-ui, sans-serif",
      display: "\"Cormorant Garamond\", Georgia, serif",
    },
    sounds: [
      {
        id: "spin",
        src: "",
      },
      {
        id: "win",
        src: "",
      },
      {
        id: "lose",
        src: "",
      },
      {
        id: "click",
        src: "",
      }
    ],
    copy: {
      intro: "Reveal the card. The result is decided on the server.",
      "match-rule": "Three matching marks settle on the server.",
      "no-win": "No match on this sample round.",
    },
  },
  {
    gameId: "roulette",
    displayName: "Valorem Wheel",
    symbols: [
      {
        id: "red",
        label: "Red",
        art: {
          kind: "glyph",
          value: "R",
        },
      },
      {
        id: "black",
        label: "Black",
        art: {
          kind: "glyph",
          value: "B",
        },
      },
      {
        id: "green",
        label: "Green",
        art: {
          kind: "glyph",
          value: "0",
        },
      }
    ],
    colors: {
      felt: "#07140e",
      surface: "#123024",
      text: "#eef3ee",
      muted: "#c5d1c6",
      accent: "#d9b75f",
      win: "#24301a",
      danger: "#f08080",
      chip: "#d9b75f",
    },
    fonts: {
      body: "\"Jost\", system-ui, sans-serif",
      display: "\"Cormorant Garamond\", Georgia, serif",
    },
    sounds: [
      {
        id: "spin",
        src: "",
      },
      {
        id: "win",
        src: "",
      },
      {
        id: "lose",
        src: "",
      },
      {
        id: "click",
        src: "",
      }
    ],
    copy: {
      intro: "Single-zero wheel. The pocket is decided on the server.",
      "odds-note": "Package figure 97.30 percent. Not a certified PAR sheet. This prototype does not price a bet.",
      "no-win": "The sample pocket is outside the marked set.",
    },
  },
  {
    gameId: "blackjack",
    displayName: "Valorem Table",
    symbols: [
      {
        id: "spade",
        label: "Spade",
        art: {
          kind: "glyph",
          value: "♠",
        },
      },
      {
        id: "heart",
        label: "Heart",
        art: {
          kind: "glyph",
          value: "♥",
        },
      },
      {
        id: "diamond",
        label: "Diamond",
        art: {
          kind: "glyph",
          value: "♦",
        },
      },
      {
        id: "club",
        label: "Club",
        art: {
          kind: "glyph",
          value: "♣",
        },
      }
    ],
    colors: {
      felt: "#07140e",
      surface: "#123024",
      text: "#eef3ee",
      muted: "#c5d1c6",
      accent: "#d9b75f",
      win: "#24301a",
      danger: "#f08080",
      feltDeep: "#06110c",
    },
    fonts: {
      body: "\"Jost\", system-ui, sans-serif",
      display: "\"Cormorant Garamond\", Georgia, serif",
    },
    sounds: [
      {
        id: "spin",
        src: "",
      },
      {
        id: "win",
        src: "",
      },
      {
        id: "lose",
        src: "",
      },
      {
        id: "click",
        src: "",
      }
    ],
    copy: {
      intro: "Played with Valorem. The hand is dealt on the server.",
      insurance: "Insurance is offered on the server when the dealer shows an ace.",
      even: "Even money is a server choice when the dealer shows an ace.",
    },
  },
  {
    gameId: "hold-the-span",
    displayName: "Valorem Span",
    symbols: [
      {
        id: "mark",
        label: "Mark",
        art: {
          kind: "glyph",
          value: "◆",
        },
      }
    ],
    colors: {
      felt: "#07140e",
      surface: "#123024",
      text: "#eef3ee",
      muted: "#c5d1c6",
      accent: "#d9b75f",
      win: "#24301a",
      danger: "#f08080",
    },
    fonts: {
      body: "\"Jost\", system-ui, sans-serif",
      display: "\"Cormorant Garamond\", Georgia, serif",
    },
    sounds: [
      {
        id: "spin",
        src: "",
      },
      {
        id: "win",
        src: "",
      },
      {
        id: "lose",
        src: "",
      },
      {
        id: "click",
        src: "",
      }
    ],
    copy: {
      intro: "Free play. Steer the squad. No wager.",
      free: "Scores stay in the game. Nothing is paid.",
    },
  },
  {
    gameId: "precinct-rumble",
    displayName: "Valorem Beat",
    symbols: [
      {
        id: "mark",
        label: "Mark",
        art: {
          kind: "glyph",
          value: "◆",
        },
      }
    ],
    colors: {
      felt: "#07140e",
      surface: "#123024",
      text: "#eef3ee",
      muted: "#c5d1c6",
      accent: "#d9b75f",
      win: "#24301a",
      danger: "#f08080",
    },
    fonts: {
      body: "\"Jost\", system-ui, sans-serif",
      display: "\"Cormorant Garamond\", Georgia, serif",
    },
    sounds: [
      {
        id: "spin",
        src: "",
      },
      {
        id: "win",
        src: "",
      },
      {
        id: "lose",
        src: "",
      },
      {
        id: "click",
        src: "",
      }
    ],
    copy: {
      intro: "Free play. A side-scrolling brawler. No wager.",
      free: "Scores stay in the game. Nothing is paid.",
    },
  },
  {
    gameId: "skyline-siege",
    displayName: "Valorem Siege",
    symbols: [
      {
        id: "mark",
        label: "Mark",
        art: {
          kind: "glyph",
          value: "◆",
        },
      }
    ],
    colors: {
      felt: "#07140e",
      surface: "#123024",
      text: "#eef3ee",
      muted: "#c5d1c6",
      accent: "#d9b75f",
      win: "#24301a",
      danger: "#f08080",
    },
    fonts: {
      body: "\"Jost\", system-ui, sans-serif",
      display: "\"Cormorant Garamond\", Georgia, serif",
    },
    sounds: [
      {
        id: "spin",
        src: "",
      },
      {
        id: "win",
        src: "",
      },
      {
        id: "lose",
        src: "",
      },
      {
        id: "click",
        src: "",
      }
    ],
    copy: {
      intro: "Free play. A run-and-gun. No wager.",
      free: "Scores stay in the game. Nothing is paid.",
    },
  }
];
