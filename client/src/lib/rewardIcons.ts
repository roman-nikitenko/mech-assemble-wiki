/** One kind of reward an achievement can grant: the stored key, a readable
    label for the admin dropdown, and the icon to draw. */
export interface RewardType {
  /** What the database stores, e.g. "s-mech-shard". */
  key: string;
  /** "S Mech Shard" — derived from the file name, never stored. */
  label: string;
  icon: string;
}

// Art globbed straight from the folder — the same approach as
// lib/achievementQuality.ts and lib/aircraftGrade.ts. Dropping a new .webp in
// there adds a reward type on its own; nothing here (and nothing on the
// server, which keeps the key as free text) needs editing.
// NOTE: the folder is spelled "reword-icons" on disk — keep it in step if renamed.
const rewardAssets = import.meta.glob("../assets/reword-icons/*.webp", {
  eager: true,
  import: "default",
}) as Record<string, string>;

/** "s-mech-shard" -> "S Mech Shard". One-letter words are upper-cased, so the
    game's "S" grades read correctly instead of as "s". */
function labelFor(key: string): string {
  return key
    .split("-")
    .map((word) => (word.length === 1 ? word.toUpperCase() : word.charAt(0).toUpperCase() + word.slice(1)))
    .join(" ");
}

/** Every reward type, alphabetically by label so the dropdown is scannable. */
export const REWARD_TYPES: RewardType[] = Object.entries(rewardAssets)
  .map(([path, icon]) => {
    const key = (path.split("/").pop() ?? "").replace(/\.webp$/, "");
    return { key, label: labelFor(key), icon };
  })
  .sort((a, b) => a.label.localeCompare(b.label));

const BY_KEY = new Map(REWARD_TYPES.map((t) => [t.key, t]));

/** The icon for a stored reward type, or undefined when the key matches no
    file — callers then fall back to the amount text rather than a broken image.
    A null type (a reward entered before the icons existed) is undefined too. */
export function rewardIcon(key: string | null): string | undefined {
  return key === null ? undefined : BY_KEY.get(key)?.icon;
}

/** The readable label for a stored key, or the key itself when unknown. */
export function rewardLabel(key: string | null): string {
  if (key === null) return "";
  return BY_KEY.get(key)?.label ?? key;
}
