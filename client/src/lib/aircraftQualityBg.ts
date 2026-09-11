import type { QualityTier } from "../api/types";
import { QUALITY_TIERS } from "../api/types";

// Panel art per quality, one file per tier named for the colour. Globbed
// eagerly — like moduleCardStyle and the quality gems — so a missing tier
// degrades instead of breaking the build, and new files are picked up without
// touching this file. `import: "default"` yields each asset's URL string.
const bgAssets = import.meta.glob("../assets/aircraft-quality-bg/*.png", {
  eager: true,
  import: "default",
}) as Record<string, string>;

// The folder ships more colours than aircraft use (green/white, plus the low
// Blue/Purple rungs) — aircraft only ever reach Orange→Mythic. Extra files are
// simply never looked up, exactly as QualityIcon leaves quality-0/1/9 unused.
//
// "qing" is the game's own name for the Turquoise rung (the awakening node VFX
// use the same word — see AwakenTab), so it needs an alias; every other file is
// just the lowercased tier name.
const FILE_ALIASES: Record<string, QualityTier> = { qing: "Turquoise" };

const BY_TIER: Partial<Record<QualityTier, string>> = {};
for (const [path, url] of Object.entries(bgAssets)) {
  const stem = (path.split("/").pop() ?? "").replace(/\.png$/, "").toLowerCase();
  const tier = FILE_ALIASES[stem] ?? QUALITY_TIERS.find((t) => t.toLowerCase() === stem);
  if (tier) BY_TIER[tier] = url;
}

/** Background art for an aircraft's quality, or undefined when that tier has no
    file — callers fall back to a plain surface rather than painting nothing. */
export function aircraftQualityBg(tier: QualityTier): string | undefined {
  return BY_TIER[tier];
}
