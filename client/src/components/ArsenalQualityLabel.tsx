import { arsenalQuality, arsenalQualityName } from "../lib/arsenalQualities";

/** A quality name in the game's colour for that quality, e.g. "Mythic+3" in
    gold. The colour goes on the text and a thin border, so it stays readable
    on the dark admin background. */
export function ArsenalQualityLabel({ quality }: { quality: number }) {
  const colour = arsenalQuality(quality)?.colour;
  return (
    <span
      className="inline-block rounded border px-1.5 py-0.5 text-xs font-semibold whitespace-nowrap"
      // Inline style, not a Tailwind class: the 13 colours come from game
      // data, and Tailwind can only generate classes it sees written out.
      style={colour ? { color: colour, borderColor: colour } : undefined}
    >
      {arsenalQualityName(quality)}
    </span>
  );
}

/** "Crude → Epic", or a single label when a piece exists at one quality. */
export function ArsenalQualityRange({ min, max }: { min: number; max: number }) {
  if (min === max) return <ArsenalQualityLabel quality={min} />;
  return (
    <span className="inline-flex items-center gap-1">
      <ArsenalQualityLabel quality={min} />
      <span className="text-ink-dim" aria-label="to">
        →
      </span>
      <ArsenalQualityLabel quality={max} />
    </span>
  );
}
