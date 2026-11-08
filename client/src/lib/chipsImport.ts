import type { ChipCategory, ChipEffectMode, ChipInput, ChipPool, ChipPoolKind, ChipQuality } from "../api/types";
import { CHIP_CATEGORIES } from "./chipQualities";

// Turns a JSON file into chips ready for POST /api/chips/import. Two formats:
//  1. the GAME's own chips_data.json  ({ chips: [one row per part x quality], pools: [shared pools] })
//  2. OUR export                       ({ format: "mech-assemble-chips", chips: [ChipInput] })
// The server validates everything again; this step only reshapes and gives
// readable errors before anything is sent.

export const EXPORT_FORMAT = "mech-assemble-chips";

export type ImportParse =
  | { ok: true; chips: ChipInput[]; source: "game" | "export"; qualityCount: number }
  | { ok: false; message: string };

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const CATEGORY_NAMES = CHIP_CATEGORIES.map((c) => c.category) as string[];
const MODES: ChipEffectMode[] = ["All modes", "PvE only", "PvP only"];

function fromGame(root: Record<string, unknown>, rows: unknown[]): ImportParse {
  if (!Array.isArray(root.pools)) return { ok: false, message: "This looks like game data but has no pools list." };

  // pool id -> pool, so each chip row can resolve its { group, chance } links.
  const poolById = new Map<number, { kind: ChipPoolKind; effects: ChipPool["effects"] }>();
  for (const p of root.pools) {
    if (!isRecord(p) || typeof p.id !== "number" || typeof p.kind !== "string" || !Array.isArray(p.effects)) continue;
    poolById.set(p.id, {
      kind: p.kind as ChipPoolKind,
      effects: p.effects.filter(isRecord).map((e) => ({
        text: String(e.text ?? ""),
        // Unknown modes fall back to "All modes" rather than failing the file.
        mode: MODES.includes(e.mode as ChipEffectMode) ? (e.mode as ChipEffectMode) : "All modes",
        chance: Number(e.chance ?? 0),
      })),
    });
  }

  const byPart = new Map<string, ChipInput>();
  for (const r of rows) {
    if (!isRecord(r)) return { ok: false, message: "A chip row in the file is not an object." };
    if (typeof r.part !== "string" || !CATEGORY_NAMES.includes(r.part)) {
      return { ok: false, message: `Unknown chip part "${String(r.part)}".` };
    }
    if (typeof r.quality !== "number") return { ok: false, message: `A ${r.part} chip row has no quality.` };

    const pools: ChipPool[] = [];
    for (const link of Array.isArray(r.pools) ? r.pools : []) {
      if (!isRecord(link)) continue;
      const pool = poolById.get(link.group as number);
      if (!pool) return { ok: false, message: `${r.part} chip (quality ${r.quality}) points at a missing pool ${String(link.group)}.` };
      pools.push({ kind: pool.kind, chance: Number(link.chance ?? 0), effects: pool.effects });
    }
    const quality: ChipQuality = {
      quality: r.quality,
      baseStats: Array.isArray(r.stats) ? r.stats.map(String) : [],
      composeNext: typeof r.composeNext === "number" ? r.composeNext : null,
      resetCost: typeof r.resetCost === "string" ? r.resetCost : null,
      pools,
    };

    let chip = byPart.get(r.part);
    if (!chip) {
      // The game names every quality row the same, e.g. "[Head] Chip".
      chip = { name: String(r.name ?? `[${r.part}] Chip`), category: r.part as ChipCategory, qualities: [] };
      byPart.set(r.part, chip);
    }
    chip.qualities.push(quality);
  }
  return done([...byPart.values()], "game");
}

function done(chips: ChipInput[], source: "game" | "export"): ImportParse {
  if (chips.length === 0) return { ok: false, message: "The file has no chips." };
  return { ok: true, chips, source, qualityCount: chips.reduce((n, c) => n + c.qualities.length, 0) };
}

/** Reads the text of a chosen .json file. */
export function parseChipsFile(text: string): ImportParse {
  let root: unknown;
  try {
    root = JSON.parse(text);
  } catch {
    return { ok: false, message: "That file could not be read as JSON." };
  }
  if (!isRecord(root) || !Array.isArray(root.chips)) {
    return { ok: false, message: "Expected a JSON object with a chips list (the game's chips_data.json or an export from this page)." };
  }
  if (root.format === EXPORT_FORMAT) return done(root.chips as ChipInput[], "export");
  // The game's file has a `pools` list and rows carrying a numeric `partId`.
  if (Array.isArray(root.pools)) return fromGame(root, root.chips);
  return { ok: false, message: `Unrecognised file. Exports from this page have format "${EXPORT_FORMAT}".` };
}
