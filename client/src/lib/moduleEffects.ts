import type { QualityTier } from "../api/types";

// Which effects each quality tier unlocks. Blue: none; Purple–Turquoise:
// Effect 1 (the elemental %); Gold: + Effect 2; Mythic: + Effect 3.
export const EFFECT_COUNT_BY_TIER: Record<QualityTier, number> = {
  Blue: 0,
  Purple: 1,
  Orange: 1,
  Red: 1,
  Turquoise: 1,
  Gold: 2,
  Mythic: 3,
};

export function effectCountForTier(t: QualityTier): number {
  return EFFECT_COUNT_BY_TIER[t];
}
