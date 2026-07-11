// Hand-written mirrors of the API's JSON (source of truth:
// server/src/routes/mechs.ts). Kept deliberately in sync by hand — sharing
// types with the server would need npm workspaces; not worth it yet.

/** An element type from the admin-managed catalog (name + icon).
    Named GameType because "Type" collides with too much in TS-land. */
export interface GameType {
  id: string;
  name: string;
  iconUrl: string | null;
}

/** Payload for POST/PUT /api/types. */
export interface TypeInput {
  name: string;
  iconUrl?: string | null;
}

export type MechRank = "Standard" | "S";

/** Shape returned by GET /api/mechs (browse page). */
export interface MechSummary {
  id: string;
  name: string;
  epithet: string | null;
  type: GameType | null;
  rank: MechRank;
  quality: string | null;
  imageUrl: string | null;
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

/** A weapon skin row (separate system from mech skins — different fields). */
export interface WeaponSkinRow {
  id: string;
  name: string;
  bonuses: string[];
  imageUrl: string | null;
}

export interface Weapon {
  id: string;
  name: string;
  description: string | null;
  baseStats: Stats | null;
  tier: MechRank;
  rankUpPreview: string[];
  imageUrl: string | null;
  iconUrl: string | null;
  type: GameType | null;
  upgrades: UpgradeNode[];
  weaponSkins: WeaponSkinRow[];
  helpers: Helper[];
  pilot: { id: string; name: string } | null;
}

/** Shape of GET /api/weapons rows (admin list, edit prefill, pilot form). */
export interface WeaponSummary {
  id: string;
  name: string;
  description: string | null;
  tier: MechRank;
  rankUpPreview: string[];
  imageUrl: string | null;
  iconUrl: string | null;
  type: GameType | null;
  mech: { id: string; name: string } | null;
  pilot: { id: string; name: string } | null;
  weaponSkins: WeaponSkinRow[];
}

/** Payload for POST/PUT /api/weapons. */
export interface WeaponInput {
  name: string;
  description?: string | null;
  tier?: MechRank;
  rankUpPreview?: string[];
  typeId?: string | null;
  mechId?: string | null;
  pilotId?: string | null;
  imageUrl?: string | null;
  iconUrl?: string | null;
  skins?: { name: string; bonuses: string[]; imageUrl?: string | null }[];
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
  pilot: { id: string; name: string } | null;
  skins: Skin[];
  helpers: Helper[];
}

/** A catalog trait, as served by GET /api/traits. */
export interface Trait {
  id: string;
  name: string;
  color: string | null;
}

/** Payload for POST/PUT /api/mechs (admin form). */
export interface MechInput {
  name: string;
  epithet?: string | null;
  typeId?: string | null;
  rank: MechRank;
  quality?: string | null;
  specialBonus?: string | null;
  pilotName?: string | null;
  lore?: string | null;
  imageUrl?: string | null;
  traitIds?: string[];
  pilotId?: string | null;
}

/** A pilot, as served by /api/pilots (always carries its linked mech or null). */
export interface Pilot {
  id: string;
  name: string;
  unlockBoost: string | null;
  relationshipBonus: string | null;
  bonusPerLevel: string[];
  iconUrl: string | null;
  backgroundUrl: string | null;
  mech: { id: string; name: string; rank: MechRank } | null;
  weapon: { id: string; name: string } | null;
}

/** Payload for POST/PUT /api/pilots. */
export interface PilotInput {
  name: string;
  unlockBoost?: string | null;
  relationshipBonus?: string | null;
  bonusPerLevel?: string[];
  iconUrl?: string | null;
  backgroundUrl?: string | null;
  mechId?: string | null;
  weaponId?: string | null;
}
