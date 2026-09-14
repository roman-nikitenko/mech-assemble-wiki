import { describe, expect, it } from "vitest";
import type { AwakeningLevel } from "../api/types";
import {
  awakeningStepLabel,
  awakeningStepOptions,
  coreStatIcon,
  reachedCores,
  sumCoreAttrs,
} from "./awakeningSteps";

const level = (n: number, over: Partial<AwakeningLevel> = {}): AwakeningLevel => ({
  id: `lv${n}`,
  level: n,
  isLive: true,
  coreAttr: [],
  coreSkill: null,
  coreInfo: null,
  coreCd: [],
  corePower: null,
  coreLuckyId: null,
  coreReward: null,
  coreSkin: null,
  nodes: [],
  ...over,
});

// Today's pattern: levels 1-3 live, 4+ authored but switched off.
const LEVELS = [level(1), level(2), level(3), level(4, { isLive: false })];

describe("awakeningStepOptions", () => {
  it("follows the game's track: five nodes, then the core step named for the NEXT level", () => {
    expect(awakeningStepOptions(LEVELS)).toEqual([
      { value: "1-1", label: "1-1" },
      { value: "1-2", label: "1-2" },
      { value: "1-3", label: "1-3" },
      { value: "1-4", label: "1-4" },
      { value: "1-5", label: "1-5" },
      { value: "1-C", label: "Awakening Lv2" },
      { value: "2-1", label: "2-1" },
      { value: "2-2", label: "2-2" },
      { value: "2-3", label: "2-3" },
      { value: "2-4", label: "2-4" },
      { value: "2-5", label: "2-5" },
      { value: "2-C", label: "Awakening Lv3" },
      { value: "3-1", label: "3-1" },
      { value: "3-2", label: "3-2" },
      { value: "3-3", label: "3-3" },
      { value: "3-4", label: "3-4" },
      { value: "3-5", label: "3-5" },
      { value: "3-C", label: "Awakening Lv4" },
    ]);
  });

  it("offers nothing for a mech with no live levels", () => {
    expect(awakeningStepOptions([level(1, { isLive: false })])).toEqual([]);
    expect(awakeningStepOptions([])).toEqual([]);
  });
});

describe("awakeningStepLabel", () => {
  it("names node steps by their key and core steps by the next level", () => {
    expect(awakeningStepLabel("2-2")).toBe("2-2");
    expect(awakeningStepLabel("2-C")).toBe("Awakening Lv3");
  });
});

describe("reachedCores", () => {
  const levels = (step: string | null) => reachedCores(LEVELS, step).map((l) => l.level);

  it("reaches nothing before the first core step", () => {
    expect(levels(null)).toEqual([]);
    expect(levels("1-3")).toEqual([]);
    // All five outer nodes done, but the core itself is its own step.
    expect(levels("1-5")).toEqual([]);
  });

  it("reaches a level's core at its core step and keeps it on the next level", () => {
    expect(levels("1-C")).toEqual([1]);
    expect(levels("2-2")).toEqual([1]);
    expect(levels("3-C")).toEqual([1, 2, 3]);
  });

  it("reaches nothing for a key it can't read", () => {
    expect(levels("Awakening Lv2")).toEqual([]);
    expect(levels("2-9")).toEqual([]);
  });

  // A step on a level that isn't live (or isn't there at all) is not a step
  // the track offers, so it reaches nothing rather than borrowing lower cores.
  it("reaches nothing for a step on a level that isn't live or doesn't exist", () => {
    const offline = [level(1), level(2, { isLive: false })];
    expect(reachedCores(offline, "2-C")).toEqual([]);
    expect(reachedCores(offline, "2-1")).toEqual([]);
    // LEVELS has 1-3 live and 4 switched off; there is no level 5 at all.
    expect(levels("4-1")).toEqual([]);
    expect(levels("5-C")).toEqual([]);
  });
});

describe("sumCoreAttrs", () => {
  it("adds the same stat across cores, keeping first-seen order", () => {
    const cores = [
      level(1, { coreAttr: ["HP +5%", "ATK +5%", "DEF +5%"] }),
      level(2, { coreAttr: ["HP +5%", "ATK +5%", "DEF +2.5%"] }),
    ];
    expect(sumCoreAttrs(cores)).toEqual([
      { name: "HP", text: "+10%" },
      { name: "ATK", text: "+10%" },
      { name: "DEF", text: "+7.5%" },
    ]);
  });

  it("never adds a percentage to a flat value", () => {
    const cores = [level(1, { coreAttr: ["HP +5%", "HP +3,000"] }), level(2, { coreAttr: ["HP +1,500"] })];
    expect(sumCoreAttrs(cores)).toEqual([
      { name: "HP", text: "+5%" },
      { name: "HP", text: "+4,500" },
    ]);
  });

  it("passes a line it can't parse through unchanged", () => {
    expect(sumCoreAttrs([level(1, { coreAttr: ["Immune to knockback"] })])).toEqual([
      { name: null, text: "Immune to knockback" },
    ]);
  });
});

describe("coreStatIcon", () => {
  it("maps the three core stats to their sprites", () => {
    expect(coreStatIcon("HP")).toBe("UI_Attr_hp");
    expect(coreStatIcon("ATK")).toBe("UI_Attr_attk");
    expect(coreStatIcon("DEF")).toBe("UI_Attr_def");
    expect(coreStatIcon("Crit")).toBeNull();
    expect(coreStatIcon(null)).toBeNull();
  });
});
