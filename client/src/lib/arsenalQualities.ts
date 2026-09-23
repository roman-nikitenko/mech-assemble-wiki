/** One rung of the Final Raid arsenal quality ladder. */
export interface ArsenalQuality {
  /** 1 (Crude) … 13 (Supreme) — what the database stores. */
  quality: number;
  name: string;
  /** The game's own colour for this quality (from its qualities table). */
  colour: string;
}

// Copied from the game config (final-raid-data/data/qualities.json, content
// 8.53.1). The server only stores the NUMBER, so this list is the one place
// names and colours live; a future build editor reuses it too.
export const ARSENAL_QUALITIES: readonly ArsenalQuality[] = [
  { quality: 1, name: "Crude", colour: "#8d6a46" },
  { quality: 2, name: "Common", colour: "#00be3f" },
  { quality: 3, name: "Uncommon", colour: "#1587be" },
  { quality: 4, name: "Excellent", colour: "#F35FFD" },
  { quality: 5, name: "Rare", colour: "#EE6928" },
  { quality: 6, name: "Epic", colour: "#FF2020" },
  { quality: 7, name: "Legendary", colour: "#01E8B4" },
  { quality: 8, name: "Mythic", colour: "#E8C301" },
  { quality: 9, name: "Mythic+1", colour: "#E8C301" },
  { quality: 10, name: "Mythic+2", colour: "#E8C301" },
  { quality: 11, name: "Mythic+3", colour: "#E8C301" },
  { quality: 12, name: "Mythic+4", colour: "#E8C301" },
  // The game writes this one with an alpha byte (#RRGGBBAA); CSS accepts it.
  { quality: 13, name: "Supreme", colour: "#FF69EBFF" },
];

/** The rung for a quality number, or undefined when it's off the ladder. */
export function arsenalQuality(quality: number): ArsenalQuality | undefined {
  return ARSENAL_QUALITIES.find((q) => q.quality === quality);
}

/** "Mythic+3" for 11. Unknown numbers fall back to "Q<n>" so a bad value
    still renders something readable instead of an empty label. */
export function arsenalQualityName(quality: number): string {
  return arsenalQuality(quality)?.name ?? `Q${quality}`;
}
