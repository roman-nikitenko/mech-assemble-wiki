/** LEGACY localStorage builds. Builds now live server-side (the `builds`
    table, edited through the API). This module survives only to READ any
    builds a player saved in their browser before the migration, so the
    Profile page can import them as Drafts once and then clear the key. */
export interface BuildRecord {
  id: string;
  name: string;
  description: string; // "" when empty
  mechId: string | null;
  weaponId: string | null;
  skillIds: string[];
  weaponIds: string[];
  weaponSkillIds: Record<string, string[]>;
  hearts: number;
  postedId?: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

// Builds were namespaced by Auth0 user id so accounts didn't share data.
// null → the anonymous key (logged-out / pre-isolation builds).
const storageKey = (userId: string | null): string =>
  userId ? `mech-wiki:builds:${userId}` : "mech-wiki:builds";

/** Read the builds stored in this browser for a user (defaulting late-added
    fields so callers can trust them). Returns [] when nothing is stored. */
export function listBuilds(userId: string | null = null): BuildRecord[] {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return (parsed as BuildRecord[]).map((b) => ({
      ...b,
      weaponId: b.weaponId ?? null,
      weaponIds: b.weaponIds ?? [],
      weaponSkillIds: b.weaponSkillIds ?? {},
      hearts: b.hearts ?? 0,
    }));
  } catch {
    // Corrupt storage shouldn't crash the profile page — treat as empty.
    return [];
  }
}

/** Drop this browser's stored builds for a user — called once after they've
    been imported server-side so the import never runs twice. */
export function clearLocalBuilds(userId: string | null = null): void {
  localStorage.removeItem(storageKey(userId));
}
