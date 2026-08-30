/** Shape the awakening editor holds and PUTs — mirrors the server's
    parseAwakeningInput. Ids are absent: the server recreates rows on save. */
export interface ImportedNode {
  position: number;
  icon: string | null;
  mechStat: string | null;
  enhText: string | null;
  enhModes: number[];
  condEntry: string | null;
  condTargetId: number | null;
  condThreshold: number | null;
  condText: string | null;
  condRaw: string | null;
}

export interface ImportedLevel {
  level: number;
  isLive: boolean;
  coreAttr: string[];
  coreSkill: string | null;
  coreInfo: string | null;
  coreCd: number[];
  corePower: number | null;
  coreLuckyId: number | null;
  coreReward: string | null;
  coreSkin: string | null;
  nodes: ImportedNode[];
}

type Result =
  | { ok: true; levels: ImportedLevel[] }
  | { ok: false; message: string };

/** The five condition types whose raw string is <type>_<targetId>_<threshold>,
    where targetId is a real game entity id (accessory, weapon, driver, skin).
    The other three (MechReachRarityCount, AwakenMechReachStageCount,
    AwakenMechReachQualityRarityCount) take scalar arguments whose order is NOT
    confirmed, so we deliberately leave them unparsed rather than guess. */
const ENTITY_CONDITIONS = new Set([
  "AwakenOrnamentReachSpecificQuality",
  "AwakenWeaponReachSpecificQuality",
  "AwakenDriverReachSpecificQuality",
  "AwakenMechSkinReachSpecificQuality",
  "AwakenWeaponSkinReachSpecificQuality",
]);

function str(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t === "" ? null : t;
}

function int(v: unknown): number | null {
  return typeof v === "number" && Number.isInteger(v) ? v : null;
}

function ints(v: unknown): number[] {
  return Array.isArray(v) ? v.filter((n): n is number => typeof n === "number") : [];
}

function strs(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((s): s is string => typeof s === "string") : [];
}

function mapCondition(cond: unknown): Pick<
  ImportedNode,
  "condEntry" | "condTargetId" | "condThreshold" | "condText" | "condRaw"
> {
  const c = cond as Record<string, unknown> | null;
  const entry = str(c?.entry);
  const raw = str(c?.raw);
  const base = { condEntry: entry, condText: str(c?.text), condRaw: raw, condTargetId: null, condThreshold: null };
  if (entry === null || raw === null || !ENTITY_CONDITIONS.has(entry)) return base;
  const parts = raw.split("_");
  if (parts.length !== 3) return base;
  const targetId = Number(parts[1]);
  const threshold = Number(parts[2]);
  if (!Number.isInteger(targetId) || !Number.isInteger(threshold)) return base;
  return { ...base, condTargetId: targetId, condThreshold: threshold };
}

function mapMech(mech: Record<string, unknown>): Result {
  const lv = mech.lv;
  if (!Array.isArray(lv)) {
    return { ok: false, message: "That JSON has no `lv` array — is it a codex mech block?" };
  }
  const levels: ImportedLevel[] = [];
  for (const rawLevel of lv) {
    const l = rawLevel as Record<string, unknown>;
    const level = int(l.n);
    if (level === null || level < 1 || level > 6) {
      return { ok: false, message: `Level "${String(l.n)}" is not a number from 1 to 6.` };
    }
    const big = (l.big ?? {}) as Record<string, unknown>;
    const rawNodes = Array.isArray(l.nodes) ? l.nodes : [];
    levels.push({
      level,
      isLive: l.live === true,
      coreAttr: strs(big.attr),
      coreSkill: str(big.skill),
      coreInfo: str(big.info),
      coreCd: ints(big.cd),
      corePower: int(big.power),
      coreLuckyId: int(big.lucky),
      coreReward: str(big.reward),
      coreSkin: str(big.skin),
      // Position comes from array order, not the "1-3" label: the label encodes
      // the level too, and array order is what the game's own table uses.
      nodes: rawNodes.map((rn, i) => {
        const n = rn as Record<string, unknown>;
        const enh = n.enh as Record<string, unknown> | null;
        return {
          position: i + 1,
          icon: str(n.icon),
          mechStat: str(n.mech),
          enhText: str(enh?.text),
          enhModes: ints(enh?.ex),
          ...mapCondition(n.cond),
        };
      }),
    });
  }
  levels.sort((a, b) => a.level - b.level);
  return { ok: true, levels };
}

/** Maps one mech's block from the SS Awakening Codex into editor state.

    Accepts either a single mech object (`{ id, name, lv: [...] }`) or the whole
    codex blob (`{ mechs: [...] }`), in which case `mechIndex` selects the mech.
    Matching is by INDEX, never by name: the codex and this wiki disagree on two
    mech names, and the admin has already chosen the mech they are editing. */
export function importCodexMech(json: unknown, mechIndex?: number): Result {
  if (json === null || typeof json !== "object") {
    return { ok: false, message: "That is not a JSON object." };
  }
  const obj = json as Record<string, unknown>;
  if (Array.isArray(obj.mechs)) {
    const i = mechIndex ?? 0;
    const picked = obj.mechs[i];
    if (picked === undefined) {
      return { ok: false, message: `That codex has ${obj.mechs.length} mechs — no entry at position ${i + 1}.` };
    }
    return mapMech(picked as Record<string, unknown>);
  }
  return mapMech(obj);
}
