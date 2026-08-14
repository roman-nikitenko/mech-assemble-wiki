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
  // Pretty URL identifier (e.g. "abyssal-knight"); links prefer it over id.
  // Nullable defensively — in practice every mech has one.
  slug: string | null;
  name: string;
  epithet: string | null;
  type: GameType | null;
  rank: MechRank;
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
  imageUrl: string | null;
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

export type SkillNodeType = "Normal" | "Premium" | "Core";

/** Mech/weapon quality ladder, lowest→highest. */
export type QualityTier = "Blue" | "Purple" | "Orange" | "Red" | "Turquoise" | "Gold" | "Mythic";
export const QUALITY_TIERS: QualityTier[] = [
  "Blue", "Purple", "Orange", "Red", "Turquoise", "Gold", "Mythic",
];

/** One skill-tree node as served by the API (flat; assemble by parentId). */
export interface SkillNodeRow {
  id: string;
  parentId: string | null;
  name: string | null; // null for Core skills
  description: string | null;
  appearanceLevel: number;
  type: SkillNodeType;
  sortOrder: number;
  // Normal-only: this skill may be picked multiple times in a build.
  repeatable: boolean;
  // Gate partner for a LINKED skill (see linked-skills): a mech-owned linked
  // skill sets linkedWeaponId, a weapon-owned one sets linkedMechId. Both null
  // = an ordinary skill. Linked skills are hidden on the public detail page and
  // only pickable in a build when the gate partner is present.
  linkedWeaponId: string | null;
  linkedMechId: string | null;
  // Quality tier at which this node is pre-granted as an initial skill; null =
  // ordinary node.
  initialAtTier: QualityTier | null;
}

export interface Weapon {
  id: string;
  slug: string | null;
  name: string;
  description: string | null;
  // Special bonus shown only when this weapon is displayed inside its owner
  // mech; null for standalone weapons (server-enforced).
  linkedEffect: string | null;
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
  skillNodes: SkillNodeRow[];
}

/** Shape of GET /api/weapons/:id — the full public detail. Same as `Weapon`
    minus the dormant `upgrades` tree, plus the owner mech (may be null). */
export interface WeaponDetail {
  id: string;
  slug: string | null;
  name: string;
  description: string | null;
  linkedEffect: string | null;
  baseStats: Stats | null;
  tier: MechRank;
  rankUpPreview: string[];
  imageUrl: string | null;
  iconUrl: string | null;
  type: GameType | null;
  mech: { id: string; slug: string | null; name: string; iconUrl: string | null; specialBonus: string | null } | null;
  pilot: { id: string; name: string; iconUrl: string | null; relationshipBonus: string | null } | null;
  weaponSkins: WeaponSkinRow[];
  helpers: Helper[];
  skillNodes: SkillNodeRow[];
}

/** Shape of GET /api/weapons rows (admin list, edit prefill, pilot form). */
export interface WeaponSummary {
  id: string;
  slug: string | null;
  name: string;
  description: string | null;
  linkedEffect: string | null;
  tier: MechRank;
  rankUpPreview: string[];
  imageUrl: string | null;
  iconUrl: string | null;
  type: GameType | null;
  mech: { id: string; name: string } | null;
  pilot: { id: string; name: string } | null;
  weaponSkins: WeaponSkinRow[];
  skillNodes: SkillNodeRow[];
}

/** Payload for POST/PUT /api/weapons. */
export interface WeaponInput {
  name: string;
  // Optional public URL slug. Leave blank to auto-derive from the name; the
  // server slugifies and de-duplicates whatever it receives.
  slug?: string | null;
  description?: string | null;
  linkedEffect?: string | null;
  tier?: MechRank;
  rankUpPreview?: string[];
  typeId?: string | null;
  mechId?: string | null;
  pilotId?: string | null;
  imageUrl?: string | null;
  iconUrl?: string | null;
  skins?: { name: string; bonuses: string[]; imageUrl?: string | null }[];
  skills?: {
    name: string | null;
    description: string | null;
    appearanceLevel: number;
    type: SkillNodeType;
    parentIndex: number | null;
    repeatable: boolean;
    initialAtTier?: QualityTier | null;
  }[];
  // Linked skills gated on a partner MECH (partnerId = a mech id).
  linkedSkills?: { name: string; description: string | null; partnerId: string }[];
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
  lore: string | null;
  iconUrl: string | null;
  // Art shown inside this mech's skill cards (build editor).
  cardSkillIconUrl: string | null;
  // Positional (index = rank): interior entries may be "" on purpose.
  rankUpPreview: string[];
  skills: Skill[];
  traits: TraitLink[];
  awakeningLevels: AwakeningLevel[];
  weapon: Weapon | null;
  accessory: {
    id: string;
    name: string;
    tier: MechRank;
    attributes: AccessoryAttribute[];
    exclusiveEffect: string | null;
    imageUrl: string | null;
    iconUrl: string | null;
  } | null;
  pilot: {
    id: string;
    name: string;
    iconUrl: string | null;
    relationshipBonus: string | null;
  } | null;
  skins: Skin[];
  helpers: Helper[];
  skillNodes: SkillNodeRow[];
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
  // Optional public URL slug. Leave blank to auto-derive from the name; the
  // server slugifies and de-duplicates whatever it receives.
  slug?: string | null;
  epithet?: string | null;
  typeId?: string | null;
  rank: MechRank;
  specialBonus?: string | null;
  lore?: string | null;
  rankUpPreview?: string[];
  // Bonuses are positional (index i = ★i+1); blanks mean "no perk at that star".
  skins?: { name: string; bonuses: string[]; imageUrl?: string | null }[];
  imageUrl?: string | null;
  iconUrl?: string | null;
  cardSkillIconUrl?: string | null;
  // Trait NAMES, not ids — the server finds-or-creates catalog rows by name.
  traitNames?: string[];
  pilotId?: string | null;
  // Link this mech's unique weapon / accessory (the FK lives on their row).
  // An id MOVES that weapon/accessory off any other mech; null unlinks.
  weaponId?: string | null;
  accessoryId?: string | null;
  skills?: {
    name: string | null;
    description: string | null;
    appearanceLevel: number;
    type: SkillNodeType;
    parentIndex: number | null;
    repeatable: boolean;
    initialAtTier?: QualityTier | null;
  }[];
  // Linked skills gated on a partner WEAPON (partnerId = a weapon id).
  linkedSkills?: { name: string; description: string | null; partnerId: string }[];
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
  mech: { id: string; name: string; rank: MechRank; iconUrl: string | null } | null;
  weapon: { id: string; name: string; iconUrl: string | null } | null;
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

/** One accessory attribute row (name + value pair). */
export interface AccessoryAttribute {
  name: string;
  value: string;
}

/** Shape of GET /api/accessories rows. */
export interface AccessorySummary {
  id: string;
  name: string;
  tier: MechRank;
  attributes: AccessoryAttribute[];
  exclusiveEffect: string | null;
  imageUrl: string | null;
  iconUrl: string | null;
  mech: { id: string; slug: string | null; name: string; iconUrl: string | null } | null;
}

/** A build's publication state (mirrors the server BuildStatus enum). */
export type BuildStatus = "Draft" | "Published" | "Unposted";

/** A build row from the API. The public feed (GET /api/builds) and the
    owner's list (GET /api/builds/mine) return the same shape. */
export interface PostedBuild {
  id: string;
  name: string;
  description: string;
  mechId: string | null;
  weaponId: string | null;
  skillIds: string[];
  weaponIds: string[];
  weaponSkillIds: Record<string, string[]>;
  status: BuildStatus;
  hearts: number;
  // The subject's quality tier + per-equipped-weapon tiers.
  quality: QualityTier;
  weaponQualities: Record<string, QualityTier>;
  // Set by the client after a heart toggle — not included in GET responses.
  userHearted?: boolean;
  createdAt: string;
  updatedAt: string;
  author: { nickname: string | null; server: string | null };
}

/** A registered user as served by GET /api/admin/users (admin-only).
    `name` is the provider display name; `buildCount` counts owned builds. */
export interface AdminUser {
  id: string;
  name: string | null;
  nickname: string | null;
  server: string | null;
  createdAt: string;
  buildCount: number;
}

/** Payload for POST /api/builds. */
export interface BuildPostInput {
  name: string;
  description: string;
  mechId: string | null;
  weaponId: string | null;
  skillIds: string[];
  weaponIds: string[];
  weaponSkillIds: Record<string, string[]>;
  // Optional on input — the server defaults quality to Blue / {} when absent.
  quality?: QualityTier;
  weaponQualities?: Record<string, QualityTier>;
}

/** Payload for POST/PUT /api/accessories. */
export interface AccessoryInput {
  name: string;
  tier?: MechRank;
  mechId?: string | null;
  attributes?: AccessoryAttribute[];
  exclusiveEffect?: string | null;
  imageUrl?: string | null;
  iconUrl?: string | null;
}

/** One metric card's numbers: running total + activity in the last 30 days. */
export interface StatMetric {
  total: number;
  last30: number;
}

/** Visitors from GA4, across three windows (overall / today / last 30 min). */
export interface VisitorMetric {
  active30min: number;
  today: number;
  total: number;
}

/** Payload of GET /api/admin/stats (admin Dashboard). `visitors` is null when
    Google Analytics isn't configured on the server. */
export interface DashboardStats {
  users: StatMetric;
  posts: StatMetric;
  visitors: VisitorMetric | null;
}

/** One public feedback submission (admin Messages list). */
export interface Feedback {
  id: string;
  name: string;
  message: string;
  read: boolean;
  createdAt: string;
}
