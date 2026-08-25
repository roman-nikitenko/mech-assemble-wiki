import type { QualityTier } from "../api/types";
import { QualityIcon } from "./QualityIcon";

// Pilot bonus levels are marked with quality gems running from Red to Mythic
// (the top four tiers), in order. The Gem picks by index and cycles, delegating
// to QualityIcon so the tier→image mapping lives in one place.
export const PILOT_GEM_TIERS: QualityTier[] = ["Red", "Turquoise", "Gold", "Mythic"];

export function Gem({ index, tiers = PILOT_GEM_TIERS }: { index: number; tiers?: QualityTier[] }) {
  return <QualityIcon tier={tiers[index % tiers.length]} size={24} />;
}
