import type { DroneSelection } from "../api/types";

/** The 6 drone squares, in render order. The layout is FIXED at two of each —
    the game always gives 2 Battle, 2 Bombardment, 2 Support. Each entry is
    matched to the admin-managed `drone_types` catalog BY NAME to get its icon
    and to filter its picker, so a type the admin hasn't created yet simply
    shows an icon-less square with an empty list. */
export const DRONE_SLOTS = [
  "Battle",
  "Battle",
  "Bombardment",
  "Bombardment",
  "Support",
  "Support",
] as const;

/** Drone quality is the raw QualityGem ladder (quality-0.png … quality-9.png),
    deliberately separate from the mech/weapon/module QualityTier names. */
export const DRONE_QUALITIES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

/** In-game names for the ladder, lowest → highest; the INDEX is the stored
    quality number, so builds keep storing 0-9 and only the label changes.
    "Mythic" also exists in the mech/weapon QualityTier enum — unrelated
    ladder, same word. */
const DRONE_QUALITY_NAMES = [
  "Crude",
  "Common",
  "Uncommon",
  "Excellent",
  "Rare",
  "Epic",
  "Legendary",
  "Mythic",
  "Supreme",
  "Divine",
];

/** Display name for a stored drone quality. Falls back to the raw number so an
    out-of-range value still renders rather than showing blank. */
export function droneQualityName(quality: number): string {
  return DRONE_QUALITY_NAMES[quality] ?? String(quality);
}

export const DEFAULT_DRONE_QUALITY = 0;

/** Read one slot's pick, defaulting the shape so callers can trust it. */
export function droneSlotSelection(
  selections: Record<string, DroneSelection>,
  index: number
): DroneSelection {
  const sel = selections[String(index)];
  return {
    droneId: sel?.droneId ?? null,
    quality: sel?.quality ?? DEFAULT_DRONE_QUALITY,
  };
}

/** Ids picked in ANY slot — the picker hides these so the same drone can't be
    equipped twice. */
export function pickedDroneIds(selections: Record<string, DroneSelection>): string[] {
  return DRONE_SLOTS.map((_, i) => droneSlotSelection(selections, i).droneId).filter(
    (id): id is string => id !== null
  );
}
