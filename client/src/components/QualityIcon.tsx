import type { QualityTier } from "../api/types";

/** Per-tier colors for the quality ladder. Tunable / swappable for game assets. */
export const QUALITY_COLORS: Record<QualityTier, string> = {
  Blue: "#3b82f6",
  Purple: "#a855f7",
  Orange: "#f97316",
  Red: "#ef4444",
  Turquoise: "#2dd4bf",
  Gold: "#eab308",
  Mythic: "#e11d48",
};

/** Colored hexagon marking a quality tier. Swap the SVG for a game asset later
    (like skin-start.svg) if desired. */
export function QualityIcon({ tier, size = 20 }: { tier: QualityTier; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      role="img"
      aria-label={tier}
      className="shrink-0"
    >
      <path
        d="M12 2l8.66 5v10L12 22l-8.66-5V7z"
        fill={QUALITY_COLORS[tier]}
        stroke="rgba(255,255,255,0.35)"
        strokeWidth="1"
      />
    </svg>
  );
}
