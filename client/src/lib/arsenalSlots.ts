import type { ArsenalSlot } from "../api/types";

/** The six Final Raid gear slots, in the game's own order. Mirrors the
    server's ArsenalSlot enum — a future build equips one piece per slot. */
export const ARSENAL_SLOTS: readonly ArsenalSlot[] = [
  "Breastplate",
  "Greaves",
  "Boots",
  "Gauntlets",
  "Belt",
  "Helmet",
];
