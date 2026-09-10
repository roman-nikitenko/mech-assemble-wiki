export interface AircraftQuality {
  /** The ladder position as the game labels it: Q1 … Q13. */
  tier: string;
  name: string;
  levelCap: number;
  shards: number;
  // Flat stats are kept apart rather than as one pre-written string, so the
  // display can format the thousands separators and skip the tiers that grant
  // nothing (Q1). null = this tier grants none of that stat.
  hp: number | null;
  atk: number | null;
  def: number | null;
}

// Fixed game reference data, deliberately hardcoded rather than admin-managed:
// the ladder is the same for every aircraft, so there is nothing to enter per
// row. If the game rebalances these numbers, edit them here.
//
// Lives in lib/ rather than beside the table that renders it because
// aircraftGrade.ts derives the letter ladder from this array — a pure module
// shouldn't have to import a React component to reach it.
export const AIRCRAFT_QUALITIES: AircraftQuality[] = [
  { tier: "Q1", name: "Crude", levelCap: 1, shards: 5, hp: null, atk: null, def: null },
  { tier: "Q2", name: "Common", levelCap: 1, shards: 10, hp: 50, atk: 10, def: 5 },
  { tier: "Q3", name: "Uncommon", levelCap: 1, shards: 20, hp: 100, atk: 20, def: 10 },
  { tier: "Q4", name: "Excellent", levelCap: 20, shards: 50, hp: 200, atk: 40, def: 20 },
  { tier: "Q5", name: "Rare", levelCap: 40, shards: 100, hp: 500, atk: 100, def: 50 },
  { tier: "Q6", name: "Epic", levelCap: 80, shards: 200, hp: 1000, atk: 200, def: 100 },
  { tier: "Q7", name: "Legendary", levelCap: 140, shards: 400, hp: 2000, atk: 400, def: 200 },
  { tier: "Q8", name: "Mythic", levelCap: 200, shards: 600, hp: 3000, atk: 600, def: 300 },
  { tier: "Q9", name: "Mythic+1", levelCap: 260, shards: 1000, hp: 6000, atk: 1200, def: 600 },
  { tier: "Q10", name: "Mythic+2", levelCap: 320, shards: 1400, hp: 9000, atk: 1800, def: 900 },
  { tier: "Q11", name: "Mythic+3", levelCap: 380, shards: 1800, hp: 12000, atk: 2400, def: 1200 },
  { tier: "Q12", name: "Mythic+4", levelCap: 440, shards: 2200, hp: 15000, atk: 3000, def: 1500 },
  { tier: "Q13", name: "Supreme", levelCap: 500, shards: 3000, hp: 20000, atk: 4000, def: 2000 },
];
