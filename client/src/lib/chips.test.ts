import { describe, expect, it } from "vitest";
import { CHIP_QUALITIES, nextChipQuality, overallChance } from "./chipQualities";
import { chipIcon, chipPartIcon } from "./chipArt";
import { parseChipsFile } from "./chipsImport";
import { buildChipsExport } from "./chipsExport";

// A tiny file shaped like the game's chips_data.json: two parts, one shared pool.
const GAME = {
  chips: [
    { part: "Head", name: "[Head] Chip", quality: 1, stats: ["HP +150"], composeNext: 3, resetCost: null, pools: [{ group: 1, chance: 100 }] },
    { part: "Head", name: "[Head] Chip", quality: 13, stats: ["HP +45,000"], composeNext: null, resetCost: "Chip Calibrator ×16", pools: [{ group: 1, chance: 76 }] },
    { part: "Legs", name: "[Leg] Chip", quality: 1, stats: ["HP +150"], composeNext: 3, resetCost: null, pools: [] },
  ],
  pools: [{ id: 1, kind: "Base stat", effects: [{ id: 9, text: "HP +500", mode: "All modes", w: 10, chance: 33.33 }] }],
};

describe("chip qualities", () => {
  it("has nine qualities ending at Supreme (13)", () => {
    expect(CHIP_QUALITIES.map((q) => q.quality)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 13]);
    expect(nextChipQuality(8)?.name).toBe("Supreme");
    expect(nextChipQuality(13)).toBeUndefined();
  });
  it("multiplies pool and effect odds", () => {
    expect(overallChance(76, 5.56)).toBe(4.23);
  });
});

describe("chip art", () => {
  it("finds gems by category + quality id, incl. Supreme", () => {
    expect(chipIcon("Head", 1)).toBeTruthy();
    expect(chipIcon("Waist", 13)).toBeTruthy();
    expect(chipIcon("Head", 9)).toBeUndefined();
    expect(chipPartIcon("Chest")).toBeTruthy();
  });
});

describe("parseChipsFile", () => {
  it("reads the game's format: groups rows by part and resolves pools", () => {
    const r = parseChipsFile(JSON.stringify(GAME));
    if (!r.ok) throw new Error(r.message);
    expect(r.source).toBe("game");
    expect(r.chips.map((c) => c.category)).toEqual(["Head", "Legs"]);
    expect(r.qualityCount).toBe(3);
    const head = r.chips[0];
    expect(head.qualities[1]).toMatchObject({ quality: 13, composeNext: null, resetCost: "Chip Calibrator ×16" });
    expect(head.qualities[1].pools[0]).toEqual({
      kind: "Base stat",
      chance: 76,
      effects: [{ text: "HP +500", mode: "All modes", chance: 33.33 }],
    });
  });

  it("round-trips our own export", () => {
    const r = parseChipsFile(JSON.stringify(GAME));
    if (!r.ok) throw new Error(r.message);
    const chips = r.chips.map((c, i) => ({ ...c, id: String(i), createdAt: "2026-01-01" }));
    const back = parseChipsFile(JSON.stringify(buildChipsExport(chips)));
    if (!back.ok) throw new Error(back.message);
    expect(back.source).toBe("export");
    expect(back.chips).toEqual(r.chips);
  });

  it("explains bad files", () => {
    expect(parseChipsFile("nope")).toMatchObject({ ok: false });
    expect(parseChipsFile("{}")).toMatchObject({ ok: false });
    const missing = { ...GAME, chips: [{ ...GAME.chips[0], pools: [{ group: 99, chance: 1 }] }] };
    const r = parseChipsFile(JSON.stringify(missing));
    expect(r).toMatchObject({ ok: false });
    expect(!r.ok && r.message).toContain("99");
    const badPart = { ...GAME, chips: [{ ...GAME.chips[0], part: "Tail" }] };
    expect(parseChipsFile(JSON.stringify(badPart))).toMatchObject({ ok: false });
  });
});
