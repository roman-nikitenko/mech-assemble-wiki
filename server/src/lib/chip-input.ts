// Validation for chips (the game's "Gems"). Hand-written, like module-input.ts:
// every check has a plain-English message the admin form shows as-is.
//
// A chip is one row per body part with all its qualities inside one jsonb
// block (`qualities`). That block is read and written whole and never queried
// by an inner field, which is exactly when jsonb beats extra tables — but it
// means the database cannot check its shape, so THIS file is the only thing
// standing between a typo and the public Chips page. Keep it strict.

export const CHIP_CATEGORIES = ["Head", "Shoulder", "Chest", "Legs", "Hands", "Waist"] as const;
export type ChipCategory = (typeof CHIP_CATEGORIES)[number];

// The game has nine chip qualities and skips the Mythic+1..+4 steps: Supreme
// is quality id 13. These ids mirror client/src/lib/chipQualities.ts.
export const CHIP_QUALITY_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 13] as const;

export const POOL_KINDS = ["Base stat", "DMG Boost / Immunity", "Special stat", "Overclock skill"] as const;
export type PoolKind = (typeof POOL_KINDS)[number];

export const EFFECT_MODES = ["All modes", "PvE only", "PvP only"] as const;
export type EffectMode = (typeof EFFECT_MODES)[number];

// App-level sanity ceilings (the game's real data sits well inside them).
const MAX_NAME = 60;
const MAX_BASE_STATS = 4;
const MAX_BASE_STAT_LEN = 80;
const MAX_RESET_COST_LEN = 60;
const MAX_EFFECTS_PER_POOL = 40;
const MAX_EFFECT_TEXT = 400; // overclock skills are whole sentences
const COMPOSE_MIN = 2;
const COMPOSE_MAX = 10;
export const MAX_IMPORT_CHIPS = 20;

export interface ChipEffect {
  text: string;
  mode: EffectMode;
  /** Share (%) of this effect INSIDE its pool. */
  chance: number;
}

export interface ChipPool {
  kind: PoolKind;
  /** Odds (%) that a roll picks this pool at all. */
  chance: number;
  effects: ChipEffect[];
}

export interface ChipQuality {
  quality: number;
  /** Fixed stats every chip of this quality has, e.g. "HP +1,500". */
  baseStats: string[];
  /** How many identical chips compose into the next quality; null = max quality. */
  composeNext: number | null;
  resetCost: string | null;
  pools: ChipPool[];
}

export interface ChipInput {
  name: string;
  category: ChipCategory;
  qualities: ChipQuality[];
}

export type ParseResult<T> = { ok: true; value: T } | { ok: false; message: string };

const fail = (message: string): { ok: false; message: string } => ({ ok: false, message });

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

// A percentage: finite, 0..100, kept to two decimals (the game shows 20.83).
function percent(v: unknown): number | null {
  if (typeof v !== "number" || !Number.isFinite(v) || v < 0 || v > 100) return null;
  return Math.round(v * 100) / 100;
}

function parseEffect(raw: unknown, where: string): ParseResult<ChipEffect | null> {
  if (!isRecord(raw)) return fail(`${where}: every effect must be an object.`);
  if (raw.text !== undefined && typeof raw.text !== "string") return fail(`${where}: effect text must be text.`);
  const text = (raw.text as string | undefined)?.trim() ?? "";
  // A blank row is what the admin's "+ Add effect" button leaves behind: drop it.
  if (text === "") return { ok: true, value: null };
  if (text.length > MAX_EFFECT_TEXT) return fail(`${where}: an effect is at most ${MAX_EFFECT_TEXT} characters.`);

  const mode = raw.mode ?? "All modes";
  if (typeof mode !== "string" || !(EFFECT_MODES as readonly string[]).includes(mode)) {
    return fail(`${where}: mode must be one of ${EFFECT_MODES.join(", ")}.`);
  }
  const chance = percent(raw.chance ?? 0);
  if (chance === null) return fail(`${where}: an effect chance must be a number from 0 to 100.`);
  return { ok: true, value: { text, mode: mode as EffectMode, chance } };
}

function parsePool(raw: unknown, where: string): ParseResult<ChipPool | null> {
  if (!isRecord(raw)) return fail(`${where}: every pool must be an object.`);
  if (typeof raw.kind !== "string" || !(POOL_KINDS as readonly string[]).includes(raw.kind)) {
    return fail(`${where}: pool kind must be one of ${POOL_KINDS.join(", ")}.`);
  }
  const kind = raw.kind as PoolKind;
  const here = `${where} (${kind})`;
  const chance = percent(raw.chance ?? 0);
  if (chance === null) return fail(`${here}: the pool chance must be a number from 0 to 100.`);
  if (raw.effects !== undefined && !Array.isArray(raw.effects)) return fail(`${here}: effects must be an array.`);

  const effects: ChipEffect[] = [];
  for (const e of (raw.effects as unknown[] | undefined) ?? []) {
    const parsed = parseEffect(e, here);
    if (!parsed.ok) return parsed;
    if (parsed.value) effects.push(parsed.value);
  }
  if (effects.length > MAX_EFFECTS_PER_POOL) return fail(`${here}: at most ${MAX_EFFECTS_PER_POOL} effects per pool.`);
  // A pool with no effects left rolls nothing — drop it instead of storing a husk.
  if (effects.length === 0) return { ok: true, value: null };
  return { ok: true, value: { kind, chance, effects } };
}

function parseQuality(raw: unknown, index: number): ParseResult<ChipQuality | null> {
  if (!isRecord(raw)) return fail(`Quality #${index + 1} must be an object.`);
  const q = raw.quality;
  if (typeof q !== "number" || !(CHIP_QUALITY_IDS as readonly number[]).includes(q)) {
    return fail(`Quality #${index + 1}: quality must be one of ${CHIP_QUALITY_IDS.join(", ")}.`);
  }
  const where = `Quality ${q}`;

  if (raw.baseStats !== undefined && !Array.isArray(raw.baseStats)) return fail(`${where}: baseStats must be an array.`);
  const baseStats: string[] = [];
  for (const s of (raw.baseStats as unknown[] | undefined) ?? []) {
    if (typeof s !== "string") return fail(`${where}: every base stat must be text.`);
    const t = s.trim();
    if (t === "") continue; // blank row from the form
    if (t.length > MAX_BASE_STAT_LEN) return fail(`${where}: a base stat is at most ${MAX_BASE_STAT_LEN} characters.`);
    baseStats.push(t);
  }
  if (baseStats.length > MAX_BASE_STATS) return fail(`${where}: at most ${MAX_BASE_STATS} base stats.`);

  let composeNext: number | null = null;
  if (raw.composeNext !== undefined && raw.composeNext !== null) {
    const c = raw.composeNext;
    if (typeof c !== "number" || !Number.isInteger(c) || c < COMPOSE_MIN || c > COMPOSE_MAX) {
      return fail(`${where}: compose must be a whole number from ${COMPOSE_MIN} to ${COMPOSE_MAX}, or empty for the top quality.`);
    }
    composeNext = c;
  }

  let resetCost: string | null = null;
  if (raw.resetCost !== undefined && raw.resetCost !== null) {
    if (typeof raw.resetCost !== "string") return fail(`${where}: the reset cost must be text.`);
    const t = raw.resetCost.trim();
    if (t.length > MAX_RESET_COST_LEN) return fail(`${where}: the reset cost is at most ${MAX_RESET_COST_LEN} characters.`);
    resetCost = t === "" ? null : t;
  }

  if (raw.pools !== undefined && !Array.isArray(raw.pools)) return fail(`${where}: pools must be an array.`);
  const pools: ChipPool[] = [];
  for (const p of (raw.pools as unknown[] | undefined) ?? []) {
    const parsed = parsePool(p, where);
    if (!parsed.ok) return parsed;
    if (parsed.value) pools.push(parsed.value);
  }
  const kinds = new Set(pools.map((p) => p.kind));
  if (kinds.size !== pools.length) return fail(`${where}: each pool kind can appear only once.`);
  // Fixed order (the game's), so the public page and exports never depend on
  // the order the admin happened to add pools in.
  pools.sort((a, b) => POOL_KINDS.indexOf(a.kind) - POOL_KINDS.indexOf(b.kind));

  // Nothing entered for this quality: don't store an empty shell.
  if (baseStats.length === 0 && composeNext === null && resetCost === null && pools.length === 0) {
    return { ok: true, value: null };
  }
  return { ok: true, value: { quality: q, baseStats, composeNext, resetCost, pools } };
}

/** Validates one chip as sent by the admin form (POST/PUT) or by an import. */
export function parseChipInput(body: unknown): ParseResult<ChipInput> {
  if (!isRecord(body)) return fail("Send the chip as a JSON object.");

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (name === "") return fail("A chip needs a name.");
  if (name.length > MAX_NAME) return fail(`A chip name is at most ${MAX_NAME} characters.`);

  if (typeof body.category !== "string" || !(CHIP_CATEGORIES as readonly string[]).includes(body.category)) {
    return fail(`Category must be one of ${CHIP_CATEGORIES.join(", ")}.`);
  }

  if (body.qualities !== undefined && !Array.isArray(body.qualities)) return fail("qualities must be an array.");
  const raw = (body.qualities as unknown[] | undefined) ?? [];
  if (raw.length > CHIP_QUALITY_IDS.length) return fail(`A chip has at most ${CHIP_QUALITY_IDS.length} qualities.`);

  const qualities: ChipQuality[] = [];
  for (let i = 0; i < raw.length; i++) {
    const parsed = parseQuality(raw[i], i);
    if (!parsed.ok) return parsed;
    if (parsed.value) qualities.push(parsed.value);
  }
  if (new Set(qualities.map((q) => q.quality)).size !== qualities.length) {
    return fail("Each quality can appear only once.");
  }
  // Display order is the game's (1..8, then 13), which is also numeric order.
  qualities.sort((a, b) => a.quality - b.quality);

  return { ok: true, value: { name, category: body.category as ChipCategory, qualities } };
}

/** Validates an import body `{ chips: [...] }`. ALL chips are checked before
    anything is written, so one bad chip rejects the whole file instead of
    importing half of it; the message says which chip is wrong. */
export function parseChipImport(body: unknown): ParseResult<ChipInput[]> {
  if (!isRecord(body) || !Array.isArray(body.chips)) return fail("Send { chips: [...] }.");
  if (body.chips.length === 0) return fail("The file has no chips.");
  if (body.chips.length > MAX_IMPORT_CHIPS) return fail(`At most ${MAX_IMPORT_CHIPS} chips per import.`);

  const chips: ChipInput[] = [];
  for (let i = 0; i < body.chips.length; i++) {
    const parsed = parseChipInput(body.chips[i]);
    if (!parsed.ok) {
      const label = isRecord(body.chips[i]) && typeof body.chips[i].name === "string" ? body.chips[i].name : `#${i + 1}`;
      return fail(`Chip ${label}: ${parsed.message}`);
    }
    chips.push(parsed.value);
  }
  if (new Set(chips.map((c) => c.name)).size !== chips.length) return fail("Two chips in the file share a name.");
  return { ok: true, value: chips };
}
