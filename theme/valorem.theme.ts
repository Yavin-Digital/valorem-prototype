/** Valorem theme pack. Field set matches rez-core v0.2.0 parseThemePack. */
import { gameSkins } from "./skins";

const base = {
  id: "valorem",
  appName: "Valorem",
  legalEntity: "Valorem (Yavin Digital sample operator)",
  supportEmail: "concierge@valorem.example",
  logoGlyph: "◆",
  coins: {
    GOLD: {
      name: "Valorem",
    },
    SWEEP: {
      name: "Ips",
    },
  },
  sweepPerDollar: 1,
  tokens: {
    colors: {
      background: "#07140e",
      surface: "#0c1f16",
      text: "#eef3ee",
      muted: "#c5d1c6",
      accent: "#d9b75f",
      danger: "#f08080",
    },
    spacing: {
      xs: "0.25rem",
      sm: "0.5rem",
      md: "1rem",
      lg: "1.5rem",
    },
    type: {
      fontFamily: "\"Jost\", system-ui, sans-serif",
      displayFamily: "\"Cormorant Garamond\", Georgia, serif",
    },
  },
  copy: {
    tagline: "Fine jewelry, gold and silver bullion, and live webinars.",
    seatHoldHint: "A seat hold lasts 45 seconds. Confirming burns Ips.",
  },
  layoutSlots: {
    background: "valorem-vault",
    seatMap: "valorem-tiles",
  },
  seatTiles: {
    openBg: "#123024",
    openLine: "rgba(238,243,238,0.17)",
    openText: "#eef3ee",
    other: "#8fa392",
    takenBg: "#06110c",
    takenText: "#8fa392",
    mineBg: "#c3cad6",
    mineText: "#0d111a",
    confirmed: "#d9b75f",
  },
};

export const valoremTheme = { ...base, gameSkins };
export { gameSkins };
