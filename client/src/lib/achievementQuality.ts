/** The four hidden-achievement qualities (the game's difficulty tiers). */
export const ACHIEVEMENT_TIERS = [1, 2, 3, 4] as const;

// Art globbed straight from the folder — same approach as aircraftGradeImage,
// so adding or renaming a file needs no edit here. `import: "default"` gives
// each asset's URL string.
const tierAssets = import.meta.glob("../assets/achivments-quality/*.png", {
  eager: true,
  import: "default",
}) as Record<string, string>;

// ".../3.png" -> "3". The folder also holds the game's ui_taskIcon*_bg files,
// which simply never match a tier lookup.
const BY_TIER = new Map<string, string>(
  Object.entries(tierAssets).map(([path, url]) => [(path.split("/").pop() ?? "").replace(/\.png$/, ""), url])
);

/** The quality image for a tier (1-4), or undefined when there's no art for
    it — callers then fall back to plain text instead of a broken image. */
export function achievementQualityImage(tier: number): string | undefined {
  if (!Number.isInteger(tier)) return undefined;
  return BY_TIER.get(String(tier));
}
