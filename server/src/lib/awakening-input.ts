export interface AwakeningNodeInput {
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

export interface AwakeningLevelInput {
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
  nodes: AwakeningNodeInput[];
}

type Result =
  | { ok: true; value: AwakeningLevelInput[] }
  | { ok: false; message: string };

/** Trim, then treat blank as absent — an admin clearing a field means null,
    not "". */
function str(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t === "" ? null : t;
}

function intOrNull(v: unknown): number | null {
  return typeof v === "number" && Number.isInteger(v) ? v : null;
}

function intArray(v: unknown): number[] {
  return Array.isArray(v) ? v.filter((n): n is number => typeof n === "number" && Number.isInteger(n)) : [];
}

function strArray(v: unknown): string[] {
  return Array.isArray(v)
    ? v.filter((s): s is string => typeof s === "string").map((s) => s.trim()).filter((s) => s !== "")
    : [];
}

/** Parses the awakening PUT body. Rejects any shape the editor could not have
    produced — a level outside 1-6, a repeated level, more than 5 outer nodes,
    a repeated node position, or a null entry.

    Scope: this validates SHAPE only. It accepts a body carrying fewer than six
    levels, because completeness is a rule of the WRITE, not of the data — the
    PUT route replaces a mech's whole tree, so it separately requires all six
    and rejects anything shorter (which would otherwise delete the levels it
    omitted). Keep that check there, not here, so this stays reusable by a
    future merge endpoint that legitimately takes one level at a time. */
export function parseAwakeningInput(body: unknown): Result {
  const levels = (body as { levels?: unknown } | null)?.levels;
  if (!Array.isArray(levels)) return { ok: false, message: "levels must be an array." };

  const out: AwakeningLevelInput[] = [];
  const seenLevels = new Set<number>();

  for (const raw of levels) {
    // A null or primitive entry would throw on the first field access, turning
    // a bad request into a 500 — reject it as the 400 it is.
    if (raw === null || typeof raw !== "object") {
      return { ok: false, message: "Each level must be an object." };
    }
    const l = raw as Record<string, unknown>;
    const level = intOrNull(l.level);
    if (level === null || level < 1 || level > 6) {
      return { ok: false, message: "Each level must be an integer from 1 to 6." };
    }
    if (seenLevels.has(level)) {
      return { ok: false, message: `Level ${level} appears more than once.` };
    }
    seenLevels.add(level);

    if (l.nodes !== undefined && !Array.isArray(l.nodes)) {
      return { ok: false, message: `Level ${level}: nodes must be an array.` };
    }
    const rawNodes = (l.nodes as unknown[]) ?? [];
    if (rawNodes.length > 5) {
      return { ok: false, message: `Level ${level}: a level has at most 5 outer nodes.` };
    }

    const nodes: AwakeningNodeInput[] = [];
    const seenPos = new Set<number>();
    for (const rn of rawNodes) {
      // Same guard as the level loop above: a null entry must 400, not throw.
      if (rn === null || typeof rn !== "object") {
        return { ok: false, message: `Level ${level}: each node must be an object.` };
      }
      const n = rn as Record<string, unknown>;
      const position = intOrNull(n.position);
      if (position === null || position < 1 || position > 5) {
        return { ok: false, message: `Level ${level}: node position must be 1-5.` };
      }
      if (seenPos.has(position)) {
        return { ok: false, message: `Level ${level}: node position ${position} is repeated.` };
      }
      seenPos.add(position);
      nodes.push({
        position,
        icon: str(n.icon),
        mechStat: str(n.mechStat),
        enhText: str(n.enhText),
        enhModes: intArray(n.enhModes),
        condEntry: str(n.condEntry),
        condTargetId: intOrNull(n.condTargetId),
        condThreshold: intOrNull(n.condThreshold),
        condText: str(n.condText),
        condRaw: str(n.condRaw),
      });
    }

    out.push({
      level,
      isLive: l.isLive === true,
      coreAttr: strArray(l.coreAttr),
      coreSkill: str(l.coreSkill),
      coreInfo: str(l.coreInfo),
      coreCd: intArray(l.coreCd),
      corePower: intOrNull(l.corePower),
      coreLuckyId: intOrNull(l.coreLuckyId),
      coreReward: str(l.coreReward),
      coreSkin: str(l.coreSkin),
      nodes,
    });
  }

  out.sort((a, b) => a.level - b.level);
  return { ok: true, value: out };
}
