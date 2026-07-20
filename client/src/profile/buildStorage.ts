/** A personal mech build. Stored in localStorage keyed by Auth0 user id so
    each account sees only its own builds. Anonymous key (no user) is kept for
    the logged-out state. Only ids are stored; live mech/skill data is fetched
    when a build is opened, so a build survives wiki edits (and degrades
    politely if its mech is gone). */
export interface BuildRecord {
  id: string;
  name: string;
  description: string; // "" when empty
  // A build is for a mech OR a weapon — exactly one is set (the same
  // either/or pattern the wiki DB uses for pilots and skill nodes).
  mechId: string | null;
  weaponId: string | null;
  skillIds: string[]; // the SUBJECT's skill picks; ≤ 8, slot order = pick order
  weaponIds: string[]; // ≤ 4, the corner squares on the build banner
  // Per-weapon skill picks, keyed by weapon id (each ≤ 8, same rules).
  weaponSkillIds: Record<string, string[]>;
  // Like count shown on the public Builds tab. Always 0 until real
  // accounts arrive — only registered users will be able to heart.
  hearts: number;
  // Server-side id if this local draft has been posted to the community feed.
  // Set after a successful Post so the button turns green.
  postedId?: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

// Builds are namespaced by Auth0 user id so accounts don't share data.
// null → falls back to the anonymous key (logged-out / no user yet).
const storageKey = (userId: string | null): string =>
  userId ? `mech-wiki:builds:${userId}` : "mech-wiki:builds";

export function listBuilds(userId: string | null = null): BuildRecord[] {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // These fields arrived later than the first saved builds — default them
    // so the rest of the app can trust them.
    return (parsed as BuildRecord[]).map((b) => ({
      ...b,
      weaponId: b.weaponId ?? null,
      weaponIds: b.weaponIds ?? [],
      weaponSkillIds: b.weaponSkillIds ?? {},
      hearts: b.hearts ?? 0,
    }));
  } catch {
    // Corrupt storage shouldn't crash the profile page — start fresh.
    return [];
  }
}

export function getBuild(id: string, userId: string | null = null): BuildRecord | undefined {
  return listBuilds(userId).find((b) => b.id === id);
}

export function saveBuild(record: BuildRecord, userId: string | null = null): void {
  const key = storageKey(userId);
  const stamped = { ...record, updatedAt: new Date().toISOString() };
  const builds = listBuilds(userId);
  const i = builds.findIndex((b) => b.id === record.id);
  if (i === -1) builds.push(stamped);
  else builds[i] = stamped;
  localStorage.setItem(key, JSON.stringify(builds));
}

export function deleteBuild(id: string, userId: string | null = null): void {
  localStorage.setItem(
    storageKey(userId),
    JSON.stringify(listBuilds(userId).filter((b) => b.id !== id))
  );
}
