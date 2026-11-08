import type { ChipCategory, ChipEffectMode, ChipPoolKind } from "../api/types";

/** The nine chip qualities. The game skips Mythic+1..+4, so Supreme is id 13.
    Colours are the ones the reference page uses (they match the in-game gems). */
export const CHIP_QUALITIES = [
  { quality: 1, name: "Rough", color: "#c9ced6" },
  { quality: 2, name: "Normal", color: "#55c255" },
  { quality: 3, name: "Fine", color: "#3a8dff" },
  { quality: 4, name: "Excellent", color: "#b257f2" },
  { quality: 5, name: "Rare", color: "#ff8a2a" },
  { quality: 6, name: "Epic", color: "#e8403f" },
  { quality: 7, name: "Legendary", color: "#2fd7d2" },
  { quality: 8, name: "Mythic", color: "#f6c21c" },
  { quality: 13, name: "Supreme", color: "linear-gradient(120deg,#ff6ad5,#7d6bff 35%,#3fe0ff 70%,#9dff8a)" },
] as const;

export const CHIP_QUALITY_IDS: number[] = CHIP_QUALITIES.map((q) => q.quality);

/** Display order = game order. `part` is the game's part id (1-6); it names the
    art files (UI_GemIcon_<part>_<n>, UI_Gem_Part_0<part>). */
export const CHIP_CATEGORIES: { category: ChipCategory; part: number; slug: string }[] = [
  { category: "Head", part: 1, slug: "head" },
  { category: "Shoulder", part: 2, slug: "shoulder" },
  { category: "Chest", part: 3, slug: "chest" },
  { category: "Legs", part: 4, slug: "legs" },
  { category: "Hands", part: 5, slug: "hands" },
  { category: "Waist", part: 6, slug: "waist" },
];

export function chipQualityInfo(quality: number) {
  return CHIP_QUALITIES.find((q) => q.quality === quality);
}

/** The next quality up, or undefined for the top one (Supreme). */
export function nextChipQuality(quality: number) {
  const i = CHIP_QUALITIES.findIndex((q) => q.quality === quality);
  return i >= 0 ? CHIP_QUALITIES[i + 1] : undefined;
}

/** Inline style that paints text in a quality's colour. Supreme is a gradient,
    which colours text via background-clip rather than `color`. */
export function chipQualityTextStyle(quality: number): React.CSSProperties {
  const info = chipQualityInfo(quality);
  if (!info) return {};
  if (info.color.startsWith("linear-gradient")) {
    return { backgroundImage: info.color, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" };
  }
  return { color: info.color };
}

/** Overall odds (%) that a roll yields one effect: the pool is picked first,
    then the effect inside it (76% x 5.56% = 4.23%). Rounded to two decimals. */
export function overallChance(poolChance: number, effectChance: number): number {
  return Math.round(((poolChance * effectChance) / 100) * 100) / 100;
}

export const MODE_STYLE: Record<ChipEffectMode, { label: string; className: string }> = {
  "All modes": { label: "All modes", className: "text-[#9fb3ff]" },
  "PvE only": { label: "PvE only", className: "text-[#7bd88f]" },
  "PvP only": { label: "PvP only", className: "text-[#ff8f7a]" },
};

/** The four effect pools, in the game's order (mirrors the server's POOL_KINDS). */
export const CHIP_POOL_KINDS: ChipPoolKind[] = ["Base stat", "DMG Boost / Immunity", "Special stat", "Overclock skill"];
export const CHIP_EFFECT_MODES: ChipEffectMode[] = ["All modes", "PvE only", "PvP only"];
