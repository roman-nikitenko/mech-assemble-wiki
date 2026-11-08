import type { ChipCategory } from "../api/types";
import { CHIP_CATEGORIES, CHIP_QUALITY_IDS } from "./chipQualities";

// Art globbed from the folders (same approach as achievementQuality.ts), so
// dropping in a new file needs no code change. `import: "default"` = the URL.
const gems = import.meta.glob("../assets/chips/chips-icons/*.webp", { eager: true, import: "default" }) as Record<string, string>;
const parts = import.meta.glob("../assets/chips/chips-section-icons/*.webp", { eager: true, import: "default" }) as Record<string, string>;

const byFile = (files: Record<string, string>) =>
  new Map(Object.entries(files).map(([path, url]) => [(path.split("/").pop() ?? "").replace(/\.webp$/, ""), url]));
const GEMS = byFile(gems);
const PARTS = byFile(parts);

const partId = (category: ChipCategory) => CHIP_CATEGORIES.find((c) => c.category === category)?.part;

/** The gem for a part + quality id (1-8, 13). The files number the nine
    qualities 1-9 (Supreme is `_9`), so the id is converted by its position.
    Undefined when there's no art, so callers can skip the image. */
export function chipIcon(category: ChipCategory, quality: number): string | undefined {
  const part = partId(category);
  const index = CHIP_QUALITY_IDS.indexOf(quality) + 1;
  if (!part || index === 0) return undefined;
  return GEMS.get(`UI_GemIcon_${part}_${index}`);
}

/** The small body-part icon used on the tabs. */
export function chipPartIcon(category: ChipCategory): string | undefined {
  const part = partId(category);
  return part ? PARTS.get(`UI_Gem_Part_0${part}`) : undefined;
}
