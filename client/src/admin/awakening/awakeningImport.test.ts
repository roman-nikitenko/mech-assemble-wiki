import { describe, expect, it } from "vitest";
import { importCodexMech } from "./awakeningImport";

const mech = {
  id: 150001,
  name: "Fire Judgement",
  lv: [
    {
      n: 1,
      live: true,
      big: {
        label: "Awakening Lv.1", major: 1, sh: 150,
        attr: ["HP +5%", "ATK +5%"], skill: "Fire Field DMG +100%",
        info: null, cd: [0, 0], power: 1000, lucky: 1301,
      },
      nodes: [
        {
          label: "1-1", icon: "UI_Attr_hp", pts: 100, sh: 30,
          cond: { entry: "AwakenOrnamentReachSpecificQuality",
                  text: "Accessory Fire Gauntlet reached 6 quality", raw: "77_230006_6" },
          acct: ["HP +3,000"], mech: "HP +15%", enh: null,
        },
        {
          label: "1-2", icon: "UI_pvpZhengShang", pts: 100, sh: 30,
          cond: { entry: "MechReachRarityCount", text: "Own 3 S-rarity mechs", raw: "87_2_3" },
          acct: ["HP +3,000"], mech: null,
          enh: { text: "DMG to monsters +10%", ex: [22, 23, 24] },
        },
      ],
    },
  ],
};

describe("importCodexMech", () => {
  it("maps one mech's levels, nodes and core block", () => {
    const r = importCodexMech(mech);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.levels).toHaveLength(1);
    const l = r.levels[0];
    expect(l).toMatchObject({
      level: 1, isLive: true, coreSkill: "Fire Field DMG +100%",
      corePower: 1000, coreLuckyId: 1301,
    });
    expect(l.coreAttr).toEqual(["HP +5%", "ATK +5%"]);
    expect(l.coreCd).toEqual([0, 0]);
    expect(l.nodes).toHaveLength(2);
  });

  it("numbers node positions from 1", () => {
    const r = importCodexMech(mech);
    if (!r.ok) throw new Error("expected ok");
    expect(r.levels[0].nodes.map((n) => n.position)).toEqual([1, 2]);
  });

  it("splits an entity-targeting condition into targetId and threshold", () => {
    const r = importCodexMech(mech);
    if (!r.ok) throw new Error("expected ok");
    expect(r.levels[0].nodes[0]).toMatchObject({
      condEntry: "AwakenOrnamentReachSpecificQuality",
      condTargetId: 230006,
      condThreshold: 6,
      condRaw: "77_230006_6",
      condText: "Accessory Fire Gauntlet reached 6 quality",
    });
  });

  it("leaves a scalar-arg condition unparsed but keeps its raw and text", () => {
    const r = importCodexMech(mech);
    if (!r.ok) throw new Error("expected ok");
    // 87 (MechReachRarityCount) takes scalar args, not a target id — arg order
    // is unresolved, so we must NOT invent a targetId for it.
    expect(r.levels[0].nodes[1]).toMatchObject({
      condEntry: "MechReachRarityCount",
      condTargetId: null,
      condThreshold: null,
      condRaw: "87_2_3",
      condText: "Own 3 S-rarity mechs",
    });
  });

  it("carries the enhancement text and its mode ids", () => {
    const r = importCodexMech(mech);
    if (!r.ok) throw new Error("expected ok");
    expect(r.levels[0].nodes[1]).toMatchObject({
      enhText: "DMG to monsters +10%",
      enhModes: [22, 23, 24],
    });
  });

  it("accepts the whole codex blob and takes the mech at the given index", () => {
    const r = importCodexMech({ mechs: [mech, { ...mech, name: "Other" }] }, 1);
    expect(r.ok).toBe(true);
  });

  it("rejects JSON that is not a codex mech", () => {
    expect(importCodexMech({ hello: "world" }).ok).toBe(false);
    expect(importCodexMech(null).ok).toBe(false);
  });

  it("rejects an out-of-range mech index on a codex blob", () => {
    expect(importCodexMech({ mechs: [mech] }, 5).ok).toBe(false);
  });
});
