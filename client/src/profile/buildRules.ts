import type { SkillNodeRow } from "../api/types";

export const MAX_SLOTS = 8;

/** Core skills have no name by design — show a stable label instead. */
export function skillDisplayName(skill: SkillNodeRow): string {
  return skill.name ?? "Core skill";
}

// The game's unlock gate ("Level = picks", user-confirmed): appearance
// level N needs N picks already made; level 1 is always open.
function levelSatisfied(level: number, priorCount: number): boolean {
  return level === 1 || priorCount >= level;
}

function parentSatisfied(candidate: SkillNodeRow, picked: SkillNodeRow[]): boolean {
  return candidate.parentId === null || picked.some((p) => p.id === candidate.parentId);
}

/** Can `candidate` be added to the build right now? `all` is the mech's
    full skill pool (needed to NAME a missing parent in lockReason). */
export function canPick(
  candidate: SkillNodeRow,
  picked: SkillNodeRow[],
  all: SkillNodeRow[]
): boolean {
  return lockReason(candidate, picked, all) === null && !picked.some((p) => p.id === candidate.id);
}

/** Why a card is locked, or null when it's pickable. An already-picked
    skill also returns null — "picked" is a separate UI state, not a lock. */
export function lockReason(
  candidate: SkillNodeRow,
  picked: SkillNodeRow[],
  all: SkillNodeRow[]
): string | null {
  if (picked.some((p) => p.id === candidate.id)) return null;
  if (picked.length >= MAX_SLOTS) return `Build is full (${MAX_SLOTS}/${MAX_SLOTS})`;
  if (!levelSatisfied(candidate.appearanceLevel, picked.length)) {
    return `Unlocks after ${candidate.appearanceLevel} picks`;
  }
  if (!parentSatisfied(candidate, picked)) {
    const parent = all.find((s) => s.id === candidate.parentId);
    return `Requires ${parent ? skillDisplayName(parent) : "its parent skill"}`;
  }
  return null;
}

/** Re-validate a pick list after a removal (or after stored ids met a
    changed wiki). Walk slots left→right keeping a running valid list:
    an entry only counts entries KEPT BEFORE it toward its level gate,
    and its parent must be among them. One pass is enough — a skill can
    only depend on earlier picks, so drops cascade forward naturally. */
export function normalizePicks(picked: SkillNodeRow[]): {
  picks: SkillNodeRow[];
  removed: SkillNodeRow[];
} {
  const picks: SkillNodeRow[] = [];
  const removed: SkillNodeRow[] = [];
  for (const skill of picked) {
    const ok =
      levelSatisfied(skill.appearanceLevel, picks.length) && parentSatisfied(skill, picks);
    (ok ? picks : removed).push(skill);
  }
  return { picks, removed };
}

/** Stored pick ids → a legal, ordered pick list: drop ids whose skill no
    longer exists in `skills`, then re-validate the rest. Used by the
    editor's skill blocks AND by save, so both always agree. */
export function resolvePicks(skills: SkillNodeRow[], ids: string[]): SkillNodeRow[] {
  const byId = new Map(skills.map((s) => [s.id, s]));
  const resolved = ids.map((id) => byId.get(id)).filter((s): s is SkillNodeRow => s !== undefined);
  return normalizePicks(resolved).picks;
}

/** Order a flat skill list so each family stays together: every parent is
    immediately followed by its children (depth-first), keeping the input's
    order among siblings. Skills whose parent is missing from the list are
    appended at the end so nothing silently disappears. */
export function familyOrder(skills: SkillNodeRow[]): SkillNodeRow[] {
  const byParent = new Map<string | null, SkillNodeRow[]>();
  for (const s of skills) {
    const siblings = byParent.get(s.parentId) ?? [];
    siblings.push(s);
    byParent.set(s.parentId, siblings);
  }
  const out: SkillNodeRow[] = [];
  function walk(parentId: string | null) {
    for (const s of byParent.get(parentId) ?? []) {
      out.push(s);
      walk(s.id);
    }
  }
  walk(null);
  const placed = new Set(out.map((s) => s.id));
  for (const s of skills) if (!placed.has(s.id)) out.push(s);
  return out;
}
