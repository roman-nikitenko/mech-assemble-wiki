/** A personal mech build. LOCAL-ONLY by explicit decision (2026-07-15):
    builds live in this browser's localStorage — no accounts yet. Only ids
    are stored; live mech/skill data is fetched when a build is opened, so
    a build survives wiki edits (and degrades politely if its mech is gone). */
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
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

const KEY = "mech-wiki:builds";

export function listBuilds(): BuildRecord[] {
  try {
    const raw = localStorage.getItem(KEY);
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
    }));
  } catch {
    // Corrupt storage shouldn't crash the profile page — start fresh.
    return [];
  }
}

export function getBuild(id: string): BuildRecord | undefined {
  return listBuilds().find((b) => b.id === id);
}

export function saveBuild(record: BuildRecord): void {
  const stamped = { ...record, updatedAt: new Date().toISOString() };
  const builds = listBuilds();
  const i = builds.findIndex((b) => b.id === record.id);
  if (i === -1) builds.push(stamped);
  else builds[i] = stamped;
  localStorage.setItem(KEY, JSON.stringify(builds));
}

export function deleteBuild(id: string): void {
  localStorage.setItem(KEY, JSON.stringify(listBuilds().filter((b) => b.id !== id)));
}
