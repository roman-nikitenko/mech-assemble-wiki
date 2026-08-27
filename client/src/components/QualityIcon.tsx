import type { QualityTier } from "../api/types";
import { QUALITY_TIERS } from "../api/types";

// All quality images, loaded straight from the folder (no hardcoded imports) so
// a new pool of art is picked up automatically. `import: "default"` yields each
// asset's URL string.
const qualityAssets = import.meta.glob("../assets/qualities-new/*.png", {
  eager: true,
  import: "default",
}) as Record<string, string>;

// The numeric suffix, e.g. ".../quality-8.png" -> 8.
function suffix(path: string): number {
  return Number(path.match(/quality-(\d+)/)?.[1] ?? 0);
}
const bySuffix = new Map<number, string>(
  Object.entries(qualityAssets).map(([path, url]) => [suffix(path), url])
);

// The 7 default tiers map to quality-2 … quality-8 (Blue … Mythic). The rarely
// used files (quality-0, quality-1, quality-9) sit outside this range and are
// left for callers that opt into them explicitly.
const TIER_START = 2;
const QUALITY_IMAGES = Object.fromEntries(
  QUALITY_TIERS.map((tier, i) => [tier, bySuffix.get(TIER_START + i)])
) as Record<QualityTier, string>;

/** A quality image by its raw file number (quality-<n>.png), for callers that
    need a specific one outside the default Blue…Mythic tier range — e.g. the
    rarely-used 0/1/9. Renders nothing if that file isn't present. */
export function QualityGem({ n, size = 24 }: { n: number; size?: number }) {
  const src = bySuffix.get(n);
  if (!src) return null;
  return (
    <img src={src} alt="" aria-hidden width={size} height={size} className="shrink-0 object-contain" />
  );
}

/** Game asset for a quality tier (Blue → Mythic). */
export function QualityIcon({ tier, size = 20 }: { tier: QualityTier; size?: number }) {
  return (
    <img
      src={QUALITY_IMAGES[tier]}
      alt=""
      role="img"
      aria-label={tier}
      width={size}
      height={size}
      className="shrink-0 object-contain"
    />
  );
}
