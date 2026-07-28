// Hexagonal gems ("rombs") used as level/rank markers across the site. Each
// gem is a saturated outer hexagon with a lighter inner core. Palettes are
// ordered lists of {outer, inner}; the Gem picks by position and cycles.
type GemColor = { outer: string; inner: string };

// Default palette (pilot level bonuses 1-4).
export const GEMS: GemColor[] = [
  { outer: "#e0483f", inner: "#f6b3ad" }, // 1 · red
  { outer: "#38bfe6", inner: "#bdeefb" }, // 2 · cyan
  { outer: "#eca61f", inner: "#fbe39c" }, // 3 · gold
  { outer: "#5b6ee0", inner: "#a98fd8" }, // 4 · blue/purple
];

// Rank-up preview palette — matches the in-game order top to bottom (7 ranks).
export const RANK_GEMS: GemColor[] = [
  { outer: "#4a7fe0", inner: "#bcd4fb" }, // 1 · blue
  { outer: "#b854d8", inner: "#f2c8f4" }, // 2 · purple
  { outer: "#f0862a", inner: "#fcd6a2" }, // 3 · orange
  { outer: "#e0483f", inner: "#f6b3ad" }, // 4 · red
  { outer: "#3fcfe6", inner: "#c8f4fb" }, // 5 · cyan
  { outer: "#eca61f", inner: "#fbe39c" }, // 6 · gold
  { outer: "#5b6ee0", inner: "#a98fd8" }, // 7 · blue/purple
];

// Flat-top hexagon as SVG so the proportions stay correct at any size (a
// clip-path in a square box stretches the shape). The viewBox is 24x21, the
// natural width:height of a regular hexagon; the inner core is the same
// hexagon scaled to 50% about the center.
export function Gem({ index, palette = GEMS }: { index: number; palette?: GemColor[] }) {
  const { outer, inner } = palette[index % palette.length];
  return (
    <svg viewBox="0 0 24 21" className="h-5 w-[23px] shrink-0" aria-hidden>
      <polygon points="6,0 18,0 24,10.5 18,21 6,21 0,10.5" fill={outer} />
      <polygon points="9,5.25 15,5.25 18,10.5 15,15.75 9,15.75 6,10.5" fill={inner} />
    </svg>
  );
}
