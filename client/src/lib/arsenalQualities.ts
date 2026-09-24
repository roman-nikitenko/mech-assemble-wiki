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

// The module card art doubles as arsenal quality art — the colours line up
// with the game's own quality colours above. Globbed like the rest of the art
// helpers; `import: "default"` yields each asset's URL string.
const frameAssets = import.meta.glob("../assets/modules/card-icon-bg/*.png", {
  eager: true,
  import: "default",
}) as Record<string, string>;
const headerAssets = import.meta.glob("../assets/modules/card-header-bg/*.png", {
  eager: true,
  import: "default",
}) as Record<string, string>;
// One diamond, repeated once per "+N" step. `pink.png` and `sacred.png` sit
// unused in that folder: they look like the marks for a Supreme+N ladder the
// game has not shown us yet.
const markAssets = import.meta.glob("../assets/quality-ladder-marks/*.png", {
  eager: true,
  import: "default",
}) as Record<string, string>;

/** "…/card-icon-gold.png" -> "gold", keyed by the colour in the file name. */
function byColour(assets: Record<string, string>, prefix: string): Map<string, string> {
  return new Map(
    Object.entries(assets).map(([path, url]) => [
      (path.split("/").pop() ?? "").replace(prefix, "").replace(/\.png$/, ""),
      url,
    ])
  );
}

const FRAME_BY_COLOUR = byColour(frameAssets, "card-icon-");
const HEADER_BY_COLOUR = byColour(headerAssets, "card-header-");
const MARK_BY_COLOUR = byColour(markAssets, "");

/** Which frame colour each quality wears, matched to ARSENAL_QUALITIES' own
    colours: Crude is the plain one, Mythic and its +1…+4 steps all share gold,
    and Supreme gets the mythic frame. */
function frameColour(quality: number): string | undefined {
  if (quality >= 8 && quality <= 12) return "gold";
  return { 1: "white", 2: "green", 3: "blue", 4: "purple", 5: "orange", 6: "red", 7: "turquoise", 13: "mythic" }[
    quality
  ];
}

/** The frame image behind an arsenal icon at this quality, or undefined when
    the quality is off the ladder or its art is missing. */
export function arsenalQualityFrame(quality: number): string | undefined {
  if (!Number.isInteger(quality)) return undefined;
  const colour = frameColour(quality);
  return colour === undefined ? undefined : FRAME_BY_COLOUR.get(colour);
}

/** The art a quality wears on a gear card: the header strip, the icon frame,
    and the "+N" marks under the icon. Any piece may be undefined when its file
    is missing, so callers fall back rather than paint a broken image. */
export interface ArsenalQualityArt {
  header?: string;
  iconFrame?: string;
  /** The mark to repeat; undefined when this quality wears none. */
  mark?: string;
  /** How many times to repeat it: Mythic+2 shows two. */
  markCount: number;
}

// Mythic (8) through Mythic+4 (12) share the gold frame; the number after the
// plus is how many marks the card shows, so Mythic itself shows none.
const MYTHIC_QUALITY = 8;
const MYTHIC_TOP_QUALITY = 12;

export function arsenalQualityArt(quality: number): ArsenalQualityArt {
  const colour = Number.isInteger(quality) ? frameColour(quality) : undefined;
  if (colour === undefined) return { markCount: 0 };
  const marked = quality > MYTHIC_QUALITY && quality <= MYTHIC_TOP_QUALITY;
  return {
    header: HEADER_BY_COLOUR.get(colour),
    iconFrame: FRAME_BY_COLOUR.get(colour),
    mark: marked ? MARK_BY_COLOUR.get("gold") : undefined,
    markCount: marked ? quality - MYTHIC_QUALITY : 0,
  };
}
