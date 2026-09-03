import { describe, expect, it } from "vitest";
import { parseAwakeningInput } from "./awakening-input";

const level = (n: number) => ({
  level: n,
  isLive: n <= 3,
  coreAttr: ["HP +5%"],
  coreSkill: "Fire Field",
  coreInfo: null,
  coreCd: [20, 60],
  corePower: 1000,
  coreLuckyId: 1301,
  coreReward: null,
  coreSkin: null,
  nodes: Array.from({ length: 5 }, (_, i) => ({
    position: i + 1,
    icon: "UI_Attr_hp",
    mechStat: "HP +15%",
    enhText: null,
    enhModes: [],
    condEntry: "AwakenOrnamentReachSpecificQuality",
    condTargetId: 230006,
    condThreshold: 6,
    condText: "Accessory Fire Gauntlet reached 6 quality",
    condRaw: "77_230006_6",
  })),
});

const six = () => ({ levels: [1, 2, 3, 4, 5, 6].map(level) });

describe("parseAwakeningInput", () => {
  it("accepts a full 6-level tree", () => {
    const r = parseAwakeningInput(six());
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toHaveLength(6);
  });

  // The parser validates shape only — completeness is the PUT route's rule,
  // and it rejects anything short of six. This pins the parser's half.
  it("accepts a body carrying fewer than six levels", () => {
    const r = parseAwakeningInput({ levels: [level(1)] });
    expect(r.ok).toBe(true);
  });

  it("rejects a level outside 1-6", () => {
    const r = parseAwakeningInput({ levels: [level(7)] });
    expect(r.ok).toBe(false);
  });

  it("rejects a duplicate level", () => {
    const r = parseAwakeningInput({ levels: [level(1), level(1)] });
    expect(r.ok).toBe(false);
  });

  it("rejects more than 5 nodes on a level", () => {
    const bad = level(1);
    bad.nodes.push({ ...bad.nodes[0], position: 6 });
    expect(parseAwakeningInput({ levels: [bad] }).ok).toBe(false);
  });

  it("rejects a duplicate node position", () => {
    const bad = level(1);
    bad.nodes[1].position = 1;
    expect(parseAwakeningInput({ levels: [bad] }).ok).toBe(false);
  });

  it("trims strings and drops empty ones to null", () => {
    const one = level(1);
    one.coreSkill = "   ";
    one.nodes[0].mechStat = "  HP +15%  ";
    const r = parseAwakeningInput({ levels: [one] });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value[0].coreSkill).toBeNull();
      expect(r.value[0].nodes[0].mechStat).toBe("HP +15%");
    }
  });

  it("rejects a non-array levels field", () => {
    expect(parseAwakeningInput({ levels: "nope" }).ok).toBe(false);
  });

  it("rejects a null level entry instead of throwing", () => {
    // Previously this threw a TypeError on the first field access, turning a
    // bad request into a 500 rather than the 400 it is.
    const r = parseAwakeningInput({ levels: [null] });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toMatch(/must be an object/i);
  });

  it("rejects a null node entry instead of throwing", () => {
    const bad = level(1);
    // @ts-expect-error deliberately corrupting the fixture
    bad.nodes[0] = null;
    const r = parseAwakeningInput({ levels: [bad] });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toMatch(/must be an object/i);
  });
});
