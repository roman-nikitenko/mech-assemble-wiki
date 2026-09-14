import type { SkillNodeRow } from "../api/types";

/** A Core skill every mech gets in the game. Core skills are nameless by
    design — skillDisplayName() labels them "Core skill". */
function core(id: string, description: string, order: number): SkillNodeRow {
  return {
    id,
    parentId: null,
    name: null,
    description,
    appearanceLevel: 1,
    type: "Core",
    // Far past any admin-entered sort order, so they list after the mech's own.
    sortOrder: 10_000 + order,
    repeatable: false,
    linkedWeaponId: null,
    linkedMechId: null,
    initialAtTier: null,
  };
}

/** The 4 Core skills the game puts in EVERY mech's pool. Kept here as client
    constants instead of rows in skill_nodes: they're identical for all mechs,
    and a build only stores skill ids as plain strings, so nothing on the
    server needs to know about them.

    The ids are saved inside builds — NEVER rename one, or every build that
    picked it silently loses the pick. */
export const UNIVERSAL_CORE_SKILLS: SkillNodeRow[] = [
  core("universal-core-speed", "Speed +50%, size decrease", 0),
  core("universal-core-hp", "HP +50%, size increase", 1),
  core("universal-core-mech-dmg", "Mech DMG +150%", 2),
  core("universal-core-exp", "EXP +30%", 3),
];

/** A mech's skill nodes plus the universal cores, for a BUILD's mech pool.
    Skips any universal id already present, so an admin entering one by hand
    can't produce a duplicate card. */
export function withUniversalCores(nodes: SkillNodeRow[]): SkillNodeRow[] {
  const present = new Set(nodes.map((n) => n.id));
  return [...nodes, ...UNIVERSAL_CORE_SKILLS.filter((s) => !present.has(s.id))];
}
