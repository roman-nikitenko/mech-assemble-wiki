import { describe, expect, it } from "vitest";
import { importCostTiers } from "./costTiersImport";

/** A codex level: five identical-cost outer nodes plus a core node. */
const level = (n: number) => ({
  n,
  live: n <= 3,
  big: { major: n, sh: 100 + n * 50, attr: [], skill: null, cd: [0, 0], power: n * 1000 },
  nodes: Array.from({ length: 5 }, () => ({
    icon: "UI_Attr_hp",
    pts: n * 100,
    sh: 20 + n * 10,
    acct: [`HP +${n},000`, `ATK +${n}00`],
    cond: { entry: "X", text: "cond", raw: "1_2_3" },
    mech: "HP +15%",
    enh: null,
  })),
});

const mech = { id: 150001, name: "Fire Judgement", lv: [1, 2, 3, 4, 5, 6].map(level) };

describe("importCostTiers", () => {
  it("reads all six rungs off a single mech block", () => {
    const r = importCostTiers(mech);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.tiers).toHaveLength(6);
    expect(r.tiers[0]).toEqual({
      level: 1,
      outerPoints: 100,
      outerShards: 30,
      coreMajor: 1,
      coreShards: 150,
      acctStats: ["HP +1,000", "ATK +100"],
    });
    expect(r.tiers[5]).toMatchObject({
      level: 6,
      outerPoints: 600,
      outerShards: 80,
      coreMajor: 6,
      coreShards: 400,
    });
  });

  it("accepts the whole codex blob and uses its first mech", () => {
    // Any mech is a valid source: the ladder is identical across all 19.
    const r = importCostTiers({ mechs: [mech, { ...mech, name: "Other" }] });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.tiers[0].outerPoints).toBe(100);
  });

  it("numbers the levels 1-6 regardless of what the source calls them", () => {
    const r = importCostTiers(mech);
    if (!r.ok) throw new Error("expected ok");
    expect(r.tiers.map((t) => t.level)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("rejects a block that does not have all six levels", () => {
    const r = importCostTiers({ ...mech, lv: mech.lv.slice(0, 3) });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toMatch(/six levels/i);
  });

  it("rejects a level whose cost figures are missing", () => {
    const broken = structuredClone(mech) as typeof mech;
    // @ts-expect-error deliberately corrupting the fixture
    broken.lv[3].nodes[0].pts = null;
    const r = importCostTiers(broken);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toMatch(/level 4/i);
  });

  it("rejects JSON that is not a codex block", () => {
    expect(importCostTiers({ hello: "world" }).ok).toBe(false);
    expect(importCostTiers(null).ok).toBe(false);
    expect(importCostTiers({ mechs: [] }).ok).toBe(false);
  });
});
