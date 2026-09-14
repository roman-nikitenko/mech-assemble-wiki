import type { AwakeningLevel } from "../api/types";

// A build's awakening step is stored as a KEY: "L-P" = level L, outer node P
// (1-5), or "L-C" = level L's core node reached. The server accepts the same
// shape (see AWAKENING_STEP_RE in server/src/routes/builds.ts).
const STEP_RE = /^(\d+)-([1-5]|C)$/;
// Every awakening level has exactly five outer nodes in the game.
const OUTER_NODES = [1, 2, 3, 4, 5];

/** Levels a player can actually reach today, lowest first. */
function liveLevels(levels: AwakeningLevel[]): AwakeningLevel[] {
  return levels.filter((l) => l.isLive).sort((a, b) => a.level - b.level);
}

/** A core step is named for the level it opens: finishing level 1's core
    takes the mech to "Awakening Lv2" — the game's own label. */
function coreStepLabel(level: number): string {
  return `Awakening Lv${level + 1}`;
}

/** The dropdown's steps, in the game's order: each live level's five outer
    nodes, then its core step. Built from the data, so a level switched on
    later appears without a code change. */
export function awakeningStepOptions(levels: AwakeningLevel[]): { value: string; label: string }[] {
  return liveLevels(levels).flatMap((l) => [
    ...OUTER_NODES.map((p) => ({ value: `${l.level}-${p}`, label: `${l.level}-${p}` })),
    { value: `${l.level}-C`, label: coreStepLabel(l.level) },
  ]);
}

/** Display label for a stored step key ("2-2", or "Awakening Lv3" for "2-C"). */
export function awakeningStepLabel(step: string): string {
  const m = STEP_RE.exec(step);
  if (!m) return step;
  return m[2] === "C" ? coreStepLabel(Number(m[1])) : step;
}

/** The live levels whose core node a step has reached. At an outer node
    ("2-2") that's every level BELOW it; at a core step ("2-C") it includes the
    step's own level. Unreadable or missing keys reach nothing. */
export function reachedCores(levels: AwakeningLevel[], step: string | null): AwakeningLevel[] {
  const m = step === null ? null : STEP_RE.exec(step);
  if (!m) return [];
  const level = Number(m[1]);
  const coreReached = m[2] === "C";
  return liveLevels(levels).filter((l) => (coreReached ? l.level <= level : l.level < level));
}

/** One line of the summed core stats. `name` is null for a line that didn't
    parse — its `text` is then the original line. */
export interface CoreStat {
  name: string | null;
  text: string;
}

// "HP +5%", "HP +3,000", "DEF +2.5%" → name, sign, number, optional %.
const ATTR_RE = /^(.+?)\s*([+-])\s*(\d[\d,]*(?:\.\d+)?)(%?)$/;

/** Add up the stat bonuses of every reached core, e.g. HP +5% twice → HP +10%.
    Grouped by name AND unit, so a percentage never adds into a flat value.
    First-seen order is kept; a line that doesn't parse is passed through as-is
    rather than dropped. */
export function sumCoreAttrs(cores: AwakeningLevel[]): CoreStat[] {
  const totals = new Map<string, { name: string; unit: string; total: number }>();
  // Either a totals key (parsed) or a pass-through line, in first-seen order.
  const order: (string | CoreStat)[] = [];
  for (const line of cores.flatMap((c) => c.coreAttr)) {
    const m = ATTR_RE.exec(line.trim());
    if (!m) {
      order.push({ name: null, text: line });
      continue;
    }
    const [, name, sign, digits, unit] = m;
    const value = Number(digits.replace(/,/g, "")) * (sign === "-" ? -1 : 1);
    const key = `${name}|${unit}`;
    const seen = totals.get(key);
    if (seen) seen.total += value;
    else {
      totals.set(key, { name, unit, total: value });
      order.push(key);
    }
  }
  return order.map((entry) => {
    if (typeof entry !== "string") return entry;
    const { name, unit, total } = totals.get(entry)!;
    // Trim float noise (0.1 + 0.2) before formatting; en-US pins the thousands
    // separator so "+4,500" doesn't depend on the visitor's locale.
    const rounded = Math.round(total * 100) / 100;
    const sign = rounded < 0 ? "-" : "+";
    return { name, text: `${sign}${Math.abs(rounded).toLocaleString("en-US")}${unit}` };
  });
}

// The three core stats have sprites in assets/awaking-icons. A Map, not an
// object literal, so a stat named like an Object property ("constructor")
// can't resolve to something that isn't a sprite key.
const STAT_ICONS = new Map([
  ["HP", "UI_Attr_hp"],
  ["ATK", "UI_Attr_attk"],
  ["DEF", "UI_Attr_def"],
]);

/** Sprite key for a core stat, or null when there's no sprite for it. */
export function coreStatIcon(name: string | null): string | null {
  return name === null ? null : (STAT_ICONS.get(name) ?? null);
}
