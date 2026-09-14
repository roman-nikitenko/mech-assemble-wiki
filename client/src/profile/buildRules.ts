import type { SkillNodeRow, QualityTier } from "../api/types";

// Normal/Premium skills share the 8 slots per mech/weapon; Core skills are
// ADDITIONAL and capped BUILD-WIDE: during a run you choose just 3 core
// skills across the mech and all weapons combined.
export const MAX_SLOTS = 8;
export const MAX_CORE_SLOTS = 3;

/** Core skills have no name by design — show a stable label instead. */
export function skillDisplayName(skill: SkillNodeRow): string {
  return skill.name ?? "Core skill";
}

/** Filters an owner's skill pool for a build: ordinary skills always pass; a
    LINKED skill (gated on a partner) passes only when its gate partner is in
    the build. `partnerIds` = the ids that satisfy gates for THIS owner — for a
    mech pool, the equipped weapon ids; for a weapon pool, [the build's mech id]. */
export function availableSkills(pool: SkillNodeRow[], partnerIds: string[]): SkillNodeRow[] {
  return pool.filter((n) => {
    const gate = n.linkedWeaponId ?? n.linkedMechId;
    return gate === null || partnerIds.includes(gate);
  });
}

// Quality ladder order (lowest→highest), for comparing tiers.
export const QUALITY_ORDER: Record<QualityTier, number> = {
  Blue: 0, Purple: 1, Orange: 2, Red: 3, Turquoise: 4, Gold: 5, Mythic: 6,
};

/** True when tier `a` is at least tier `b` on the ladder. */
export function tierAtLeast(a: QualityTier, b: QualityTier): boolean {
  return QUALITY_ORDER[a] >= QUALITY_ORDER[b];
}

/** The nodes an owner PRE-GRANTS at `tier`: those with an `initialAtTier` set
    and ≤ the chosen tier. Granted nodes are active from the start, unlock their
    children, and count toward the level gate — but never take a slot. */
export function grantedSkills(pool: SkillNodeRow[], tier: QualityTier): SkillNodeRow[] {
  return pool.filter((n) => n.initialAtTier !== null && tierAtLeast(tier, n.initialAtTier));
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
  all: SkillNodeRow[],
  globalCoreCount?: number,
  // Nodes pre-granted by the owner's quality tier — they satisfy parent gates
  // and count toward the level gate (see grantedSkills).
  granted: SkillNodeRow[] = []
): boolean {
  return (
    lockReason(candidate, picked, all, globalCoreCount, granted) === null &&
    (candidate.repeatable || !picked.some((p) => p.id === candidate.id))
  );
}

/** Why a card is locked, or null when it's pickable. An already-picked
    skill also returns null — "picked" is a separate UI state, not a lock. */
export function lockReason(
  candidate: SkillNodeRow,
  picked: SkillNodeRow[],
  all: SkillNodeRow[],
  // The core cap is BUILD-WIDE — the caller passes the total across the
  // mech and every weapon. Falls back to counting `picked` when absent.
  globalCoreCount?: number,
  // Quality-granted nodes: count toward level + satisfy parent gates.
  granted: SkillNodeRow[] = []
): string | null {
  // An already-picked skill is normally a no-lock "picked" state. A
  // repeatable one, though, must still face the capacity gate below so
  // it stops being addable once the 8 slots are full.
  if (!candidate.repeatable && picked.some((p) => p.id === candidate.id)) return null;
  // Capacity: Core skills fill the build's 3 extra slots and never compete
  // with the 8 regular ones (or vice versa).
  if (candidate.type === "Core") {
    const coreCount = globalCoreCount ?? picked.filter((p) => p.type === "Core").length;
    if (coreCount >= MAX_CORE_SLOTS) {
      return `Core slots are full (${MAX_CORE_SLOTS}/${MAX_CORE_SLOTS})`;
    }
  } else if (picked.filter((p) => p.type !== "Core").length >= MAX_SLOTS) {
    return `Build is full (${MAX_SLOTS}/${MAX_SLOTS})`;
  }
  // The level gate counts ALL picks (Core included) PLUS quality-granted nodes
  // — both raise your in-run level.
  if (!levelSatisfied(candidate.appearanceLevel, granted.length + picked.length)) {
    return `Unlocks after ${candidate.appearanceLevel} picks`;
  }
  if (!parentSatisfied(candidate, [...granted, ...picked])) {
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
export function normalizePicks(
  picked: SkillNodeRow[],
  granted: SkillNodeRow[] = []
): {
  picks: SkillNodeRow[];
  removed: SkillNodeRow[];
} {
  const picks: SkillNodeRow[] = [];
  const removed: SkillNodeRow[] = [];
  for (const skill of picked) {
    const ok =
      levelSatisfied(skill.appearanceLevel, granted.length + picks.length) &&
      parentSatisfied(skill, [...granted, ...picks]);
    (ok ? picks : removed).push(skill);
  }
  return { picks, removed };
}

/** Stored pick ids → a legal, ordered pick list: drop ids whose skill no
    longer exists in `skills`, then re-validate the rest. Used by the
    editor's skill blocks AND by save, so both always agree. */
export function resolvePicks(
  skills: SkillNodeRow[],
  ids: string[],
  granted: SkillNodeRow[] = []
): SkillNodeRow[] {
  const byId = new Map(skills.map((s) => [s.id, s]));
  const resolved = ids.map((id) => byId.get(id)).filter((s): s is SkillNodeRow => s !== undefined);
  return normalizePicks(resolved, granted).picks;
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

/** One card in the build page's family row (see skillFamilies). */
export interface SkillFamilyEntry {
  skill: SkillNodeRow;
  /** Position in the input list — a stable React key even when a repeatable
      skill appears twice. */
  index: number;
  /** 0 = a root; each ancestor present in the list adds one. */
  depth: number;
  /** The in-list parent, or null for a root. */
  parent: SkillNodeRow | null;
  /** No later sibling under the same parent — where the mobile bracket stops. */
  lastChild: boolean;
  /** How many cards back this child's PREVIOUS sibling sits in the row (its
      own descendants in between). 0 for a root or a first child. Lets the
      desktop top rail run from one sibling to the next, so all children of a
      parent hang off one shared line. */
  siblingSpan: number;
}

/** Group a PICK list into families for the build page: every child sits right
    after its parent, depth-first; otherwise the input order is kept.

    Unlike familyOrder (a palette of unique nodes), a pick list can repeat an
    id — a repeatable skill picked twice — so entries are tracked by POSITION,
    and a child attaches to the FIRST copy of its parent only; drawing it under
    both copies would show a pick that was never made. A skill whose parent
    isn't in the list stays a root right where it stands. */
export function skillFamilies(skills: SkillNodeRow[]): SkillFamilyEntry[] {
  const firstIndex = new Map<string, number>();
  skills.forEach((s, i) => {
    if (!firstIndex.has(s.id)) firstIndex.set(s.id, i);
  });

  const roots: number[] = [];
  const childrenOf = new Map<number, number[]>();
  skills.forEach((s, i) => {
    const p = s.parentId === null ? undefined : firstIndex.get(s.parentId);
    if (p === undefined) roots.push(i);
    else childrenOf.set(p, [...(childrenOf.get(p) ?? []), i]);
  });

  const out: SkillFamilyEntry[] = [];
  const placed = new Set<number>();
  function walk(siblings: number[], depth: number, parent: SkillNodeRow | null) {
    // Row position of the previous sibling placed, for siblingSpan.
    let prevPos: number | null = null;
    siblings.forEach((i, k) => {
      if (placed.has(i)) return;
      placed.add(i);
      const pos = out.length;
      out.push({
        skill: skills[i],
        index: i,
        depth,
        parent,
        lastChild: k === siblings.length - 1,
        siblingSpan: parent === null || prevPos === null ? 0 : pos - prevPos,
      });
      prevPos = pos;
      walk(childrenOf.get(i) ?? [], depth + 1, skills[i]);
    });
  }
  walk(roots, 0, null);
  // Only reachable with bad data (a parent cycle never reaches a root) —
  // show those skills flat rather than silently dropping them.
  skills.forEach((s, i) => {
    if (placed.has(i)) return;
    out.push({ skill: s, index: i, depth: 0, parent: null, lastChild: true, siblingSpan: 0 });
  });
  return out;
}
