// The frame art drawn around a drone square, one file per quality gem
// (quality-0.png … quality-9.png). Globbed eagerly — like the module card art
// and the quality gems themselves — so new or missing files are picked up
// without touching this file. `import: "default"` yields each asset's URL.
const borderAssets = import.meta.glob("../assets/dron-quality-border/*.png", {
  eager: true,
  import: "default",
}) as Record<string, string>;

// ".../quality-7.png" -> 7
const BY_QUALITY = new Map<number, string>(
  Object.entries(borderAssets).map(([path, url]) => [
    Number(path.match(/quality-(\d+)/)?.[1] ?? NaN),
    url,
  ])
);

/** Background-image URL of the border frame for a drone quality (0-9).
    Undefined when that quality has no art file, so callers can fall back to a
    plain CSS border instead of painting nothing. */
export function droneQualityBorder(quality: number): string | undefined {
  return BY_QUALITY.get(quality);
}
