import type { QualityTier } from "../api/types";
import { QUALITY_TIERS } from "../api/types";

// User-supplied art per tier, dropped into these folders as
// card-header-{tier}.<ext> and card-icon-{tier}.<ext> (tier lowercased).
// Globbed eagerly so a missing tier doesn't break the build and new files are
// picked up automatically. `import: "default"` yields each asset's URL string.
const headerAssets = import.meta.glob("../assets/modules/card-header-bg/*", {
  eager: true,
  import: "default",
}) as Record<string, string>;
const iconAssets = import.meta.glob("../assets/modules/card-icon-bg/*", {
  eager: true,
  import: "default",
}) as Record<string, string>;

function byTier(assets: Record<string, string>, prefix: string): Partial<Record<QualityTier, string>> {
  const map: Partial<Record<QualityTier, string>> = {};
  for (const [path, url] of Object.entries(assets)) {
    const file = path.split("/").pop() ?? "";
    // e.g. "card-header-orange.png" -> "orange"
    const stem = file.replace(/\.[^.]+$/, "").replace(`${prefix}-`, "").toLowerCase();
    const tier = QUALITY_TIERS.find((t) => t.toLowerCase() === stem);
    if (tier) map[tier] = url;
  }
  return map;
}

const HEADER_BY_TIER = byTier(headerAssets, "card-header");
const ICON_BY_TIER = byTier(iconAssets, "card-icon");

export interface QualityCardStyle {
  header?: string;
  iconBorder?: string;
}

/** Background-image URLs (header + icon frame) for a quality tier. Undefined
    for any tier whose art file isn't present yet — callers fall back. */
export function qualityCardStyle(tier: QualityTier): QualityCardStyle {
  return { header: HEADER_BY_TIER[tier], iconBorder: ICON_BY_TIER[tier] };
}
