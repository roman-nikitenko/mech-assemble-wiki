// Hand-written mirrors of the API's JSON (source of truth:
// server/src/routes/mechs.ts). Kept deliberately in sync by hand — sharing
// types with the server would need npm workspaces; not worth it yet.

export type MechType =
  | "Fire"
  | "Thunder"
  | "Physical"
  | "Ice"
  | "Energy"
  | "Explosive";

export type MechRank = "Standard" | "S";

/** Shape returned by GET /api/mechs (browse page). */
export interface MechSummary {
  id: string;
  name: string;
  epithet: string | null;
  type: MechType;
  rank: MechRank;
  quality: string | null;
}

/** Upgrade tree node — the API pre-assembles children[]; recursion mirrors that. */
export interface UpgradeNode {
  id: string;
  parentId: string | null;
  name: string;
  description: string | null;
  isEvolution: boolean;
  unlockReq: string | null;
  children: UpgradeNode[];
}

/** Flexible stat blocks are free-form JSON in the DB (jsonb). */
export type Stats = Record<string, number | string>;

export interface Skill {
  id: string;
  name: string;
  description: string | null;
  baseStats: Stats | null;
  upgrades: UpgradeNode[];
}

export interface TraitLink {
  id: string;
  trait: { id: string; name: string; color: string | null };
}

export interface SkinStar {
  id: string;
  star: number;
  perk: string;
}

export interface Skin {
  id: string;
  name: string;
  description: string | null;
  stars: SkinStar[];
}

export interface HelperRank {
  id: string;
  rank: number;
  effect: string;
}

export interface Helper {
  id: string;
  name: string;
  passiveEffect: string | null;
  ranks: HelperRank[];
}

export interface Weapon {
  id: string;
  name: string;
  description: string | null;
  baseStats: Stats | null;
  upgrades: UpgradeNode[];
  skins: Skin[];
  helpers: Helper[];
}

export interface AwakeningNode {
  id: string;
  position: number;
  attribute: string;
}

export interface AwakeningUnlock {
  id: string;
  name: string;
  description: string | null;
}

export interface AwakeningLevel {
  id: string;
  level: number;
  statBonus: Stats | null;
  specialEffect: string | null;
  requirement: string | null;
  nodes: AwakeningNode[];
  unlocks: AwakeningUnlock[];
}

/** Shape returned by GET /api/mechs/:id (detail page). */
export interface MechDetail extends MechSummary {
  specialBonus: string | null;
  pilotName: string | null;
  lore: string | null;
  skills: Skill[];
  traits: TraitLink[];
  awakeningLevels: AwakeningLevel[];
  weapon: Weapon | null;
  accessory: { id: string; name: string; description: string | null } | null;
  skins: Skin[];
  helpers: Helper[];
}
