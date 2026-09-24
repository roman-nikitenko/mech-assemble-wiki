import type { ArsenalSlot } from "../api/types";

/* Final Raid arsenal stats and affixes, generated from the game config
   (content 8.53.3, pulled 2026-09-24) and committed rather than stored in the
   database: it is fixed reference data with no admin screen, like the quality
   ladder in arsenalQualities.ts. Regenerate this file from a fresh extract
   when the game patches the numbers.

   TWO KNOWN GAPS, deliberately not papered over:
   1. Many affix entries carry no number in the config (the whole elemental
      "Ice Mech DMG +N%" family among them). Those have `value: null` and are
      shown as a name with no range — nothing is invented.
   2. The "… Rune" items do NOT follow the common ladder at qualities 5 and 6
      (3,600 vs 3,500, and a placeholder 100/100/100 at quality 6). Every other
      piece agrees, so QUALITY_STATS holds the majority values and a Rune reads
      slightly high at those two rungs. A per-piece override can fix it if it
      ever matters. */

export interface QualityStats {
  hp: number;
  atk: number;
  def: number;
  /** A piece rolls between this percentage of the base stats and 100%. */
  rollFloorPct: number;
  /** How many bonus affixes roll, and how likely each count is. */
  extraAffixes: { count: number; chancePct: number }[];
}

export interface AffixEntry {
  /** The whole thing as the game words it, e.g. "Ice Mech DMG +5%.". */
  name: string;
  /** Just the part that names it ("Ice Mech DMG"), or null for an effect the
      game states as a sentence ("Release 3 Ice Storms every 60s."). */
  label: string | null;
  /** The value at a 100% roll, or null for those same sentence effects. */
  value: number | null;
  /** "%" or "" — the unit that follows the number. */
  unit: string;
  chancePct: number;
  rollFloorPct: number;
}

// Base HP/ATK/DEF and the roll floor at each quality, plus how many
// bonus affixes roll. Numbers are the base; a piece lands between
// base x floor and base.
export const QUALITY_STATS: Record<number, QualityStats> = {
  1: { hp: 100, atk: 20, def: 10, rollFloorPct: 50.0, extraAffixes: [] },
  2: { hp: 300, atk: 60, def: 30, rollFloorPct: 50.0, extraAffixes: [] },
  3: { hp: 800, atk: 160, def: 80, rollFloorPct: 50.0, extraAffixes: [{ count: 0, chancePct: 70.0 }, { count: 1, chancePct: 30.0 }] },
  4: { hp: 1800, atk: 360, def: 180, rollFloorPct: 50.0, extraAffixes: [{ count: 0, chancePct: 30.0 }, { count: 1, chancePct: 70.0 }] },
  5: { hp: 3500, atk: 700, def: 350, rollFloorPct: 60.0, extraAffixes: [{ count: 0, chancePct: 30.0 }, { count: 1, chancePct: 60.0 }, { count: 2, chancePct: 10.0 }] },
  6: { hp: 7000, atk: 1400, def: 700, rollFloorPct: 60.0, extraAffixes: [{ count: 0, chancePct: 20.0 }, { count: 1, chancePct: 60.0 }, { count: 2, chancePct: 20.0 }] },
  7: { hp: 12500, atk: 2500, def: 1250, rollFloorPct: 65.0, extraAffixes: [{ count: 1, chancePct: 70.0 }, { count: 2, chancePct: 30.0 }] },
  8: { hp: 20000, atk: 4000, def: 2000, rollFloorPct: 70.0, extraAffixes: [{ count: 1, chancePct: 60.0 }, { count: 2, chancePct: 30.0 }, { count: 3, chancePct: 10.0 }] },
  9: { hp: 32000, atk: 6400, def: 3200, rollFloorPct: 70.0, extraAffixes: [{ count: 1, chancePct: 60.0 }, { count: 2, chancePct: 30.0 }, { count: 3, chancePct: 10.0 }] },
  10: { hp: 50000, atk: 10000, def: 5000, rollFloorPct: 70.0, extraAffixes: [{ count: 1, chancePct: 60.0 }, { count: 2, chancePct: 30.0 }, { count: 3, chancePct: 10.0 }] },
  11: { hp: 70000, atk: 14000, def: 7000, rollFloorPct: 75.0, extraAffixes: [{ count: 1, chancePct: 60.0 }, { count: 2, chancePct: 30.0 }, { count: 3, chancePct: 10.0 }] },
  12: { hp: 100000, atk: 20000, def: 10000, rollFloorPct: 75.0, extraAffixes: [{ count: 1, chancePct: 60.0 }, { count: 2, chancePct: 30.0 }, { count: 3, chancePct: 10.0 }] },
  13: { hp: 140000, atk: 28000, def: 14000, rollFloorPct: 80.0, extraAffixes: [{ count: 1, chancePct: 60.0 }, { count: 2, chancePct: 30.0 }, { count: 3, chancePct: 10.0 }] },
};

// The affix pools, straight from the game config. `label`/`value` are
// null for effects the game words as a sentence rather than a stat.
export const AFFIX_POOLS: Record<number, AffixEntry[]> = {
  60101: [
    { name: "Attack +40", label: "Attack", value: 40, unit: "", chancePct: 16.67, rollFloorPct: 50.0 },
    { name: "Attack +5%", label: "Attack", value: 5, unit: "%", chancePct: 16.67, rollFloorPct: 50.0 },
    { name: "Defense +20", label: "Defense", value: 20, unit: "", chancePct: 16.67, rollFloorPct: 50.0 },
    { name: "Defense +5%", label: "Defense", value: 5, unit: "%", chancePct: 16.67, rollFloorPct: 50.0 },
    { name: "HP +200", label: "HP", value: 200, unit: "", chancePct: 16.67, rollFloorPct: 50.0 },
    { name: "HP +5%", label: "HP", value: 5, unit: "%", chancePct: 16.67, rollFloorPct: 50.0 },
  ],
  60102: [
    { name: "Attack +160", label: "Attack", value: 160, unit: "", chancePct: 16.67, rollFloorPct: 50.0 },
    { name: "Attack +10%", label: "Attack", value: 10, unit: "%", chancePct: 16.67, rollFloorPct: 50.0 },
    { name: "Defense +80", label: "Defense", value: 80, unit: "", chancePct: 16.67, rollFloorPct: 50.0 },
    { name: "Defense +10%", label: "Defense", value: 10, unit: "%", chancePct: 16.67, rollFloorPct: 50.0 },
    { name: "HP +800", label: "HP", value: 800, unit: "", chancePct: 16.67, rollFloorPct: 50.0 },
    { name: "HP +10%", label: "HP", value: 10, unit: "%", chancePct: 16.67, rollFloorPct: 50.0 },
  ],
  60103: [
    { name: "Attack +400", label: "Attack", value: 400, unit: "", chancePct: 16.67, rollFloorPct: 66.0 },
    { name: "Attack +15%", label: "Attack", value: 15, unit: "%", chancePct: 16.67, rollFloorPct: 66.0 },
    { name: "Defense +200", label: "Defense", value: 200, unit: "", chancePct: 16.67, rollFloorPct: 66.0 },
    { name: "Defense +15%", label: "Defense", value: 15, unit: "%", chancePct: 16.67, rollFloorPct: 66.0 },
    { name: "HP +2000", label: "HP", value: 2000, unit: "", chancePct: 16.67, rollFloorPct: 66.0 },
    { name: "HP +15%", label: "HP", value: 15, unit: "%", chancePct: 16.67, rollFloorPct: 66.0 },
  ],
  60104: [
    { name: "Attack +3000", label: "Attack", value: 3000, unit: "", chancePct: 16.67, rollFloorPct: 75.0 },
    { name: "Attack +20%", label: "Attack", value: 20, unit: "%", chancePct: 16.67, rollFloorPct: 75.0 },
    { name: "Defense +1500", label: "Defense", value: 1500, unit: "", chancePct: 16.67, rollFloorPct: 75.0 },
    { name: "Defense +20%", label: "Defense", value: 20, unit: "%", chancePct: 16.67, rollFloorPct: 75.0 },
    { name: "HP +15000", label: "HP", value: 15000, unit: "", chancePct: 16.67, rollFloorPct: 75.0 },
    { name: "HP +20%", label: "HP", value: 20, unit: "%", chancePct: 16.67, rollFloorPct: 75.0 },
  ],
  60201: [
    { name: "Ice Mech DMG +5%.", label: "Ice Mech DMG", value: 5, unit: "%", chancePct: 8.33, rollFloorPct: 50.0 },
    { name: "Fire Mech DMG +5%.", label: "Fire Mech DMG", value: 5, unit: "%", chancePct: 8.33, rollFloorPct: 50.0 },
    { name: "Thunder Mech DMG +5%.", label: "Thunder Mech DMG", value: 5, unit: "%", chancePct: 8.33, rollFloorPct: 50.0 },
    { name: "Energy Type Mech DMG +5%.", label: "Energy Type Mech DMG", value: 5, unit: "%", chancePct: 8.33, rollFloorPct: 50.0 },
    { name: "Physical Type Mech DMG +5%.", label: "Physical Type Mech DMG", value: 5, unit: "%", chancePct: 8.33, rollFloorPct: 50.0 },
    { name: "Explosive Type Mech DMG +5%.", label: "Explosive Type Mech DMG", value: 5, unit: "%", chancePct: 8.33, rollFloorPct: 50.0 },
    { name: "Ice Weapons DMG +5%.", label: "Ice Weapons DMG", value: 5, unit: "%", chancePct: 8.33, rollFloorPct: 50.0 },
    { name: "Fire Weapons DMG +5%.", label: "Fire Weapons DMG", value: 5, unit: "%", chancePct: 8.33, rollFloorPct: 50.0 },
    { name: "Thunder Weapons DMG +5%.", label: "Thunder Weapons DMG", value: 5, unit: "%", chancePct: 8.33, rollFloorPct: 50.0 },
    { name: "Energy Type Weapons DMG +5%.", label: "Energy Type Weapons DMG", value: 5, unit: "%", chancePct: 8.33, rollFloorPct: 50.0 },
    { name: "Physical Type Weapons DMG +5%.", label: "Physical Type Weapons DMG", value: 5, unit: "%", chancePct: 8.33, rollFloorPct: 50.0 },
    { name: "Explosive Type Weapons DMG +5%.", label: "Explosive Type Weapons DMG", value: 5, unit: "%", chancePct: 8.33, rollFloorPct: 50.0 },
  ],
  60202: [
    { name: "Ice Mech DMG +10%.", label: "Ice Mech DMG", value: 10, unit: "%", chancePct: 8.33, rollFloorPct: 50.0 },
    { name: "Fire Mech DMG +10%.", label: "Fire Mech DMG", value: 10, unit: "%", chancePct: 8.33, rollFloorPct: 50.0 },
    { name: "Thunder Mech DMG +10%.", label: "Thunder Mech DMG", value: 10, unit: "%", chancePct: 8.33, rollFloorPct: 50.0 },
    { name: "Energy Type Mech DMG +10%.", label: "Energy Type Mech DMG", value: 10, unit: "%", chancePct: 8.33, rollFloorPct: 50.0 },
    { name: "Physical Type Mech DMG +10%.", label: "Physical Type Mech DMG", value: 10, unit: "%", chancePct: 8.33, rollFloorPct: 50.0 },
    { name: "Explosive Type Mech DMG +10%.", label: "Explosive Type Mech DMG", value: 10, unit: "%", chancePct: 8.33, rollFloorPct: 50.0 },
    { name: "Ice Weapons DMG +10%.", label: "Ice Weapons DMG", value: 10, unit: "%", chancePct: 8.33, rollFloorPct: 50.0 },
    { name: "Fire Weapons DMG +10%.", label: "Fire Weapons DMG", value: 10, unit: "%", chancePct: 8.33, rollFloorPct: 50.0 },
    { name: "Thunder Weapons DMG +10%.", label: "Thunder Weapons DMG", value: 10, unit: "%", chancePct: 8.33, rollFloorPct: 50.0 },
    { name: "Energy Type Weapons DMG +10%.", label: "Energy Type Weapons DMG", value: 10, unit: "%", chancePct: 8.33, rollFloorPct: 50.0 },
    { name: "Physical Type Weapons DMG +10%.", label: "Physical Type Weapons DMG", value: 10, unit: "%", chancePct: 8.33, rollFloorPct: 50.0 },
    { name: "Explosive Type Weapons DMG +10%.", label: "Explosive Type Weapons DMG", value: 10, unit: "%", chancePct: 8.33, rollFloorPct: 50.0 },
  ],
  60203: [
    { name: "Ice Mech DMG +15%.", label: "Ice Mech DMG", value: 15, unit: "%", chancePct: 8.33, rollFloorPct: 66.0 },
    { name: "Fire Mech DMG +15%.", label: "Fire Mech DMG", value: 15, unit: "%", chancePct: 8.33, rollFloorPct: 66.0 },
    { name: "Thunder Mech DMG +15%.", label: "Thunder Mech DMG", value: 15, unit: "%", chancePct: 8.33, rollFloorPct: 66.0 },
    { name: "Energy Type Mech DMG +15%.", label: "Energy Type Mech DMG", value: 15, unit: "%", chancePct: 8.33, rollFloorPct: 66.0 },
    { name: "Physical Type Mech DMG +15%.", label: "Physical Type Mech DMG", value: 15, unit: "%", chancePct: 8.33, rollFloorPct: 66.0 },
    { name: "Explosive Type Mech DMG +15%.", label: "Explosive Type Mech DMG", value: 15, unit: "%", chancePct: 8.33, rollFloorPct: 66.0 },
    { name: "Ice Weapons DMG +15%.", label: "Ice Weapons DMG", value: 15, unit: "%", chancePct: 8.33, rollFloorPct: 66.0 },
    { name: "Fire Weapons DMG +15%.", label: "Fire Weapons DMG", value: 15, unit: "%", chancePct: 8.33, rollFloorPct: 66.0 },
    { name: "Thunder Weapons DMG +15%.", label: "Thunder Weapons DMG", value: 15, unit: "%", chancePct: 8.33, rollFloorPct: 66.0 },
    { name: "Energy Type Weapons DMG +15%.", label: "Energy Type Weapons DMG", value: 15, unit: "%", chancePct: 8.33, rollFloorPct: 66.0 },
    { name: "Physical Type Weapons DMG +15%.", label: "Physical Type Weapons DMG", value: 15, unit: "%", chancePct: 8.33, rollFloorPct: 66.0 },
    { name: "Explosive Type Weapons DMG +15%.", label: "Explosive Type Weapons DMG", value: 15, unit: "%", chancePct: 8.33, rollFloorPct: 66.0 },
  ],
  60204: [
    { name: "Ice Mech DMG +20%.", label: "Ice Mech DMG", value: 20, unit: "%", chancePct: 8.33, rollFloorPct: 75.0 },
    { name: "Fire Mech DMG +20%.", label: "Fire Mech DMG", value: 20, unit: "%", chancePct: 8.33, rollFloorPct: 75.0 },
    { name: "Thunder Mech DMG +20%.", label: "Thunder Mech DMG", value: 20, unit: "%", chancePct: 8.33, rollFloorPct: 75.0 },
    { name: "Energy Type Mech DMG +20%.", label: "Energy Type Mech DMG", value: 20, unit: "%", chancePct: 8.33, rollFloorPct: 75.0 },
    { name: "Physical Type Mech DMG +20%.", label: "Physical Type Mech DMG", value: 20, unit: "%", chancePct: 8.33, rollFloorPct: 75.0 },
    { name: "Explosive Type Mech DMG +20%.", label: "Explosive Type Mech DMG", value: 20, unit: "%", chancePct: 8.33, rollFloorPct: 75.0 },
    { name: "Ice Weapons DMG +20%.", label: "Ice Weapons DMG", value: 20, unit: "%", chancePct: 8.33, rollFloorPct: 75.0 },
    { name: "Fire Weapons DMG +20%.", label: "Fire Weapons DMG", value: 20, unit: "%", chancePct: 8.33, rollFloorPct: 75.0 },
    { name: "Thunder Weapons DMG +20%.", label: "Thunder Weapons DMG", value: 20, unit: "%", chancePct: 8.33, rollFloorPct: 75.0 },
    { name: "Energy Type Weapons DMG +20%.", label: "Energy Type Weapons DMG", value: 20, unit: "%", chancePct: 8.33, rollFloorPct: 75.0 },
    { name: "Physical Type Weapons DMG +20%.", label: "Physical Type Weapons DMG", value: 20, unit: "%", chancePct: 8.33, rollFloorPct: 75.0 },
    { name: "Explosive Type Weapons DMG +20%.", label: "Explosive Type Weapons DMG", value: 20, unit: "%", chancePct: 8.33, rollFloorPct: 75.0 },
  ],
  60303: [
    { name: "Mech Fire Rate +30%.", label: "Mech Fire Rate", value: 30, unit: "%", chancePct: 25.0, rollFloorPct: 50.0 },
    { name: "Crit Rate +5%.", label: "Crit Rate", value: 5, unit: "%", chancePct: 25.0, rollFloorPct: 50.0 },
    { name: "Crit DMG +20%.", label: "Crit DMG", value: 20, unit: "%", chancePct: 25.0, rollFloorPct: 50.0 },
    { name: "Final DMG Boost +10%", label: "Final DMG Boost", value: 10, unit: "%", chancePct: 25.0, rollFloorPct: 50.0 },
  ],
  60304: [
    { name: "Mech Fire Rate +60%.", label: "Mech Fire Rate", value: 60, unit: "%", chancePct: 25.0, rollFloorPct: 50.0 },
    { name: "Crit Rate +10%.", label: "Crit Rate", value: 10, unit: "%", chancePct: 25.0, rollFloorPct: 50.0 },
    { name: "Crit DMG +40%.", label: "Crit DMG", value: 40, unit: "%", chancePct: 25.0, rollFloorPct: 50.0 },
    { name: "Final DMG Boost +20%", label: "Final DMG Boost", value: 20, unit: "%", chancePct: 25.0, rollFloorPct: 50.0 },
  ],
  60403: [
    { name: "Minions DMG Reduction +20%.", label: "Minions DMG Reduction", value: 20, unit: "%", chancePct: 33.33, rollFloorPct: 50.0 },
    { name: "Final DMG Immunity +15%", label: "Final DMG Immunity", value: 15, unit: "%", chancePct: 33.33, rollFloorPct: 50.0 },
    { name: "DMG to Minions +10%", label: "DMG to Minions", value: 10, unit: "%", chancePct: 33.33, rollFloorPct: 50.0 },
  ],
  60404: [
    { name: "Minions DMG Reduction +40%.", label: "Minions DMG Reduction", value: 40, unit: "%", chancePct: 33.33, rollFloorPct: 50.0 },
    { name: "Final DMG Immunity +30%", label: "Final DMG Immunity", value: 30, unit: "%", chancePct: 33.33, rollFloorPct: 50.0 },
    { name: "DMG to Minions +20%", label: "DMG to Minions", value: 20, unit: "%", chancePct: 33.33, rollFloorPct: 50.0 },
  ],
  60503: [
    { name: "Shield Effect +20%.", label: "Shield Effect", value: 20, unit: "%", chancePct: 33.33, rollFloorPct: 50.0 },
    { name: "Rescue Speed +50%.", label: "Rescue Speed", value: 50, unit: "%", chancePct: 33.33, rollFloorPct: 50.0 },
    { name: "DMG to monsters +10%.", label: "DMG to monsters", value: 10, unit: "%", chancePct: 33.33, rollFloorPct: 50.0 },
  ],
  60504: [
    { name: "Shield Effect +40%.", label: "Shield Effect", value: 40, unit: "%", chancePct: 33.33, rollFloorPct: 50.0 },
    { name: "Rescue Speed +100%.", label: "Rescue Speed", value: 100, unit: "%", chancePct: 33.33, rollFloorPct: 50.0 },
    { name: "DMG to monsters +20%.", label: "DMG to monsters", value: 20, unit: "%", chancePct: 33.33, rollFloorPct: 50.0 },
  ],
  70101: [
    { name: "For every 200 monsters killed, Mech DMG +10%, up to 200%.", label: null, value: null, unit: "", chancePct: 100.0, rollFloorPct: 100.0 },
  ],
  70201: [
    { name: "50% chance to trigger Ice Burst when slowed.", label: null, value: null, unit: "", chancePct: 100.0, rollFloorPct: 100.0 },
  ],
  70301: [
    { name: "Release 3 Ice Storms that slow enemies every 60s, lasting 15s.", label: null, value: null, unit: "", chancePct: 100.0, rollFloorPct: 100.0 },
  ],
  70401: [
    { name: "Gain Frost Domain when Zombie Wave incoming, lasting 10s.", label: null, value: null, unit: "", chancePct: 100.0, rollFloorPct: 100.0 },
  ],
  70501: [
    { name: "Release Energy Purification every 20s to clear venom traps.", label: null, value: null, unit: "", chancePct: 100.0, rollFloorPct: 100.0 },
  ],
  70601: [
    { name: "Gain an Energy Shield equal to 15% max HP when HP drops below 50% for the first time.", label: null, value: null, unit: "", chancePct: 100.0, rollFloorPct: 100.0 },
  ],
};

// Which pools feed effect slots 1-3, per quality and gear slot, for ordinary
// gear. An empty list means that effect slot does not exist at that quality.
export const POOLS_BY_QUALITY_SLOT: Record<number, Partial<Record<ArsenalSlot, number[][]>>> = {
  1: {
    Breastplate: [[], [], []],
    Greaves: [[], [], []],
    Boots: [[], [], []],
    Gauntlets: [[], [], []],
    Belt: [[], [], []],
    Helmet: [[], [], []],
  },
  2: {
    Breastplate: [[], [], []],
    Greaves: [[], [], []],
    Boots: [[], [], []],
    Gauntlets: [[], [], []],
    Belt: [[], [], []],
    Helmet: [[], [], []],
  },
  3: {
    Breastplate: [[], [], []],
    Greaves: [[], [], []],
    Boots: [[], [], []],
    Gauntlets: [[], [], []],
    Belt: [[], [], []],
    Helmet: [[], [], []],
  },
  4: {
    Breastplate: [[60101], [], []],
    Greaves: [[60101], [], []],
    Boots: [[60101], [], []],
    Gauntlets: [[60101], [], []],
    Belt: [[60101], [], []],
    Helmet: [[60101], [], []],
  },
  5: {
    Breastplate: [[60101], [60201], []],
    Greaves: [[60101], [60201], []],
    Boots: [[60101], [60201], []],
    Gauntlets: [[60101], [60201], []],
    Belt: [[60101], [60201], []],
    Helmet: [[60101], [60201], []],
  },
  6: {
    Breastplate: [[60102], [60202], []],
    Greaves: [[60102], [60202], []],
    Boots: [[60102], [60202], []],
    Gauntlets: [[60102], [60202], []],
    Belt: [[60102], [60202], []],
    Helmet: [[60102], [60202], []],
  },
  7: {
    Breastplate: [[60102], [60202], []],
    Greaves: [[60102], [60202], []],
    Boots: [[60102], [60202], []],
    Gauntlets: [[60102], [60202], []],
    Belt: [[60102], [60202], []],
    Helmet: [[60102], [60202], []],
  },
  8: {
    Breastplate: [[60103], [60203], [60303, 70101]],
    Greaves: [[60103], [60203], [60303, 70201]],
    Boots: [[60103], [60203], [60403, 70301]],
    Gauntlets: [[60103], [60203], [60403, 70401]],
    Belt: [[60103], [60203], [60503, 70501]],
    Helmet: [[60103], [60203], [60503, 70601]],
  },
  9: {
    Breastplate: [[60103], [60203], [60303, 70101]],
    Greaves: [[60103], [60203], [60303, 70201]],
    Boots: [[60103], [60203], [60403, 70301]],
    Gauntlets: [[60103], [60203], [60403, 70401]],
    Belt: [[60103], [60203], [60503, 70501]],
    Helmet: [[60103], [60203], [60503, 70601]],
  },
  10: {
    Breastplate: [[60103], [60203], [60303, 70101]],
    Greaves: [[60103], [60203], [60303, 70201]],
    Boots: [[60103], [60203], [60403, 70301]],
    Gauntlets: [[60103], [60203], [60403, 70401]],
    Belt: [[60103], [60203], [60503, 70501]],
    Helmet: [[60103], [60203], [60503, 70601]],
  },
  11: {
    Breastplate: [[60103], [60203], [60303, 70101]],
    Greaves: [[60103], [60203], [60303, 70201]],
    Boots: [[60103], [60203], [60403, 70301]],
    Gauntlets: [[60103], [60203], [60403, 70401]],
    Belt: [[60103], [60203], [60503, 70501]],
    Helmet: [[60103], [60203], [60503, 70601]],
  },
  12: {
    Breastplate: [[60103], [60203], [60303, 70101]],
    Greaves: [[60103], [60203], [60303, 70201]],
    Boots: [[60103], [60203], [60403, 70301]],
    Gauntlets: [[60103], [60203], [60403, 70401]],
    Belt: [[60103], [60203], [60503, 70501]],
    Helmet: [[60103], [60203], [60503, 70601]],
  },
  13: {
    Breastplate: [[60104], [60204], [60304, 70101]],
    Greaves: [[60104], [60204], [60304, 70201]],
    Boots: [[60104], [60204], [60404, 70301]],
    Gauntlets: [[60104], [60204], [60404, 70401]],
    Belt: [[60104], [60204], [60504, 70501]],
    Helmet: [[60104], [60204], [60504, 70601]],
  },
};

// The "… Rune" items are the exception: below quality 8 they roll from richer
// pools than ordinary gear (at 8 and above the two agree). Kept separate rather
// than averaged away, so a Rune's card is right at every quality.
export const RUNE_POOLS_BY_QUALITY_SLOT: Record<number, Partial<Record<ArsenalSlot, number[][]>>> = {
  1: {
    Breastplate: [[], [], []],
    Greaves: [[], [], []],
    Boots: [[], [], []],
    Gauntlets: [[], [], []],
    Belt: [[], [], []],
    Helmet: [[], [], []],
  },
  2: {
    Breastplate: [[], [], []],
    Greaves: [[], [], []],
    Boots: [[], [], []],
    Gauntlets: [[], [], []],
    Belt: [[], [], []],
    Helmet: [[], [], []],
  },
  3: {
    Breastplate: [[60101], [], []],
    Greaves: [[60101], [], []],
    Boots: [[60101], [], []],
    Gauntlets: [[60101], [], []],
    Belt: [[60101], [], []],
    Helmet: [[60101], [], []],
  },
  4: {
    Breastplate: [[60102], [60202], []],
    Greaves: [[60102], [60202], []],
    Boots: [[60102], [60202], []],
    Gauntlets: [[60102], [60202], []],
    Belt: [[60102], [60202], []],
    Helmet: [[60102], [60202], []],
  },
  5: {
    Breastplate: [[60103], [60203], [60303, 70101]],
    Greaves: [[60103], [60203], [60303, 70201]],
    Boots: [[60103], [60203], [60403, 70301]],
    Gauntlets: [[60103], [60203], [60403, 70401]],
    Belt: [[60103], [60203], [60503, 70501]],
    Helmet: [[60103], [60203], [60503, 70601]],
  },
  6: {
    Breastplate: [[], [], []],
    Greaves: [[], [], []],
    Boots: [[], [], []],
    Gauntlets: [[], [], []],
    Belt: [[], [], []],
    Helmet: [[], [], []],
  },
};

// content 8.53.3, pulled 2026-09-24

/** A stat's span at one quality: the roll floor through the full value. */
export interface StatRange {
  label: string;
  min: number;
  max: number;
}

/** HP, ATK and DEF at `quality`, each as [floor, full]. Empty for a quality
    off the ladder, so callers render nothing rather than NaNs. */
export function arsenalStatRanges(quality: number): StatRange[] {
  const stats = QUALITY_STATS[quality];
  if (!stats) return [];
  const span = (label: string, max: number): StatRange => ({
    label,
    // Floors are whole percentages of round numbers, but round anyway so a
    // future fractional floor can't show "899.9999".
    min: Math.round((max * stats.rollFloorPct) / 100),
    max,
  });
  return [span("HP", stats.hp), span("ATK", stats.atk), span("DEF", stats.def)];
}

/** One effect slot of a piece: everything it could roll there. */
export interface AffixSlot {
  /** 1, 2 or 3 — what the game calls Effect 1/2/3. */
  index: number;
  options: AffixEntry[];
}

/** Which pool table a piece draws from. "rune" is the handful of "… Rune"
    items, which roll richer affixes than ordinary gear below quality 8. */
export type ArsenalVariant = "standard" | "rune";

/** Whether a piece is one of the Runes, decided by its name — the only signal
    we have, since the database stores no such flag. Add one to the admin form
    if the game ever ships a Rune that isn't called one. */
export function arsenalVariant(pieceName: string): ArsenalVariant {
  return /\brune\b/i.test(pieceName) ? "rune" : "standard";
}

/** The effect slots a piece has at `quality`, in order. Slots the game leaves
    empty at that quality are left out entirely, so low-quality gear shows one
    tab and top-quality gear shows three. */
export function arsenalAffixSlots(
  quality: number,
  slot: ArsenalSlot,
  variant: ArsenalVariant = "standard"
): AffixSlot[] {
  // The Rune table only covers the qualities Runes exist at (1-6), and its
  // quality-6 rows are the config's placeholder junk (no pools at all, next to
  // the 100/100/100 stats noted above). Fall back to ordinary gear's pools
  // whenever the Rune table has nothing real to say, rather than showing a
  // piece with no attributes at all.
  const runeTriples = variant === "rune" ? RUNE_POOLS_BY_QUALITY_SLOT[quality]?.[slot] : undefined;
  const hasRunePools = runeTriples?.some((ids) => ids.length > 0) ?? false;
  const triples = hasRunePools ? runeTriples : POOLS_BY_QUALITY_SLOT[quality]?.[slot];
  if (!triples) return [];
  const slots: AffixSlot[] = [];
  triples.forEach((poolIds, i) => {
    // A slot can draw from more than one pool (e.g. the top qualities mix a
    // common pool with a slot-specific special effect) — merge them.
    const options = poolIds.flatMap((id) => AFFIX_POOLS[id] ?? []);
    if (options.length > 0) slots.push({ index: i + 1, options });
  });
  return slots;
}

/** An affix split into the part that names it and the part that gives its
    span, so a card can push them to opposite ends of a row. `range` is null
    for an effect the game words as a sentence — then `label` is that whole
    sentence ("50% chance to trigger Ice Burst when slowed."). */
export interface AffixParts {
  label: string;
  range: string | null;
}

/** "Attack +40" at a 50% floor -> { label: "Attack", range: "+[20-40]" }; the
    unit sits outside the bracket ("+[2.5-5]%"). Numbers are written plainly,
    with no thousands separators, to match the game. */
export function affixRangeParts(entry: AffixEntry): AffixParts {
  if (entry.label === null || entry.value === null) return { label: entry.name, range: null };
  const min = (entry.value * entry.rollFloorPct) / 100;
  // Round to two decimals, then drop a trailing zero: 2.50 -> 2.5, 20.00 -> 20.
  const fmt = (n: number) => String(Number(n.toFixed(2)));
  return { label: entry.label, range: `+[${fmt(min)}-${fmt(entry.value)}]${entry.unit}` };
}

/** The same thing on one line, for callers that don't lay the parts out
    themselves. */
export function affixRangeLabel(entry: AffixEntry): string {
  const { label, range } = affixRangeParts(entry);
  return range === null ? label : `${label} ${range}`;
}
