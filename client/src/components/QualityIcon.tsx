import type { QualityTier } from "../api/types";
import { QUALITY_TIERS } from "../api/types";
import quality1 from "../assets/qualities/quality-1.png";
import quality2 from "../assets/qualities/quality-2.png";
import quality3 from "../assets/qualities/quality-3.png";
import quality4 from "../assets/qualities/quality-4.png";
import quality5 from "../assets/qualities/quality-5.png";
import quality6 from "../assets/qualities/quality-6.png";
import quality7 from "../assets/qualities/quality-7.png";

const QUALITY_IMAGES = Object.fromEntries(
  QUALITY_TIERS.map((tier, i) => [tier, [quality1, quality2, quality3, quality4, quality5, quality6, quality7][i]]),
) as Record<QualityTier, string>;

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
