import { describe, expect, it } from "vitest";
import type { SkillNodeRow } from "../api/types";
import { MAX_CORE_SLOTS, MAX_SLOTS, availableSkills, canPick, familyOrder, grantedSkills, lockReason, normalizePicks, skillDisplayName, skillFamilies, tierAtLeast } from "./buildRules";

let seq = 0;
const node = (over: Partial<SkillNodeRow> = {}): SkillNodeRow => ({
  id: `s${++seq}`,
  parentId: null,
  name: `Skill ${seq}`,
  description: null,
  appearanceLevel: 1,
  type: "Normal",
  sortOrder: 0,
  repeatable: false,
  linkedWeaponId: null,
  linkedMechId: null,
  initialAtTier: null,
  ...over,
});

describe("skillDisplayName", () => {
  it("falls back to 'Core skill' for the nameless Core nodes", () => {
    expect(skillDisplayName(node({ name: "Zap" }))).toBe("Zap");
    expect(skillDisplayName(node({ name: null, type: "Core" }))).toBe("Core skill");
  });
});

describe("canPick / lockReason", () => {
  it("level-1 skills are pickable with zero picks", () => {
    const s = node();
    expect(canPick(s, [], [s])).toBe(true);
    expect(lockReason(s, [], [s])).toBeNull();
  });

  it("a level-3 skill needs 3 picks", () => {
    const three = node({ appearanceLevel: 3 });
    const two = [node(), node()];
    expect(canPick(three, two, [...two, three])).toBe(false);
    expect(lockReason(three, two, [...two, three])).toBe("Unlocks after 3 picks");
    const picked3 = [...two, node()];
    expect(canPick(three, picked3, [...picked3, three])).toBe(true);
  });

  it("a child skill needs its parent picked, and the reason names the parent", () => {
    const parent = node({ name: "Zap" });
    const child = node({ parentId: parent.id });
    const all = [parent, child];
    expect(canPick(child, [], all)).toBe(false);
    expect(lockReason(child, [], all)).toBe("Requires Zap");
    expect(canPick(child, [parent], all)).toBe(true);
  });

  it("blocks the 9th pick", () => {
    const eight = Array.from({ length: MAX_SLOTS }, () => node());
    const extra = node();
    expect(canPick(extra, eight, [...eight, extra])).toBe(false);
    expect(lockReason(extra, eight, [...eight, extra])).toBe("Build is full (8/8)");
  });

  it("Core skills use the build-wide 3 extra slots, separate from the 8", () => {
    const eightNormals = Array.from({ length: MAX_SLOTS }, () => node());
    const core = node({ name: null, type: "Core" });
    // regular slots full — a Core skill still fits (it's additional)
    expect(canPick(core, eightNormals, [...eightNormals, core])).toBe(true);

    const threeCores = Array.from({ length: MAX_CORE_SLOTS }, () =>
      node({ name: null, type: "Core" })
    );
    const fourthCore = node({ name: null, type: "Core" });
    expect(lockReason(fourthCore, threeCores, [...threeCores, fourthCore])).toBe(
      "Core slots are full (3/3)"
    );
    // ...and full Core slots don't block a regular pick
    const normal = node();
    expect(canPick(normal, threeCores, [...threeCores, normal])).toBe(true);
  });

  it("the core cap counts the WHOLE build via globalCoreCount", () => {
    const core = node({ name: null, type: "Core" });
    // nothing picked in THIS block, but 3 cores exist elsewhere in the build
    expect(lockReason(core, [], [core], 3)).toBe("Core slots are full (3/3)");
    expect(canPick(core, [], [core], 3)).toBe(false);
    expect(canPick(core, [], [core], 2)).toBe(true);
  });

  it("an already-picked skill is not pickable and has no lock reason", () => {
    const s = node();
    expect(canPick(s, [s], [s])).toBe(false);
    expect(lockReason(s, [s], [s])).toBeNull(); // "picked" is its own UI state
  });
});

describe("normalizePicks", () => {
  it("keeps a valid set untouched", () => {
    const a = node();
    const b = node();
    const c = node();
    const late = node({ appearanceLevel: 3 });
    const result = normalizePicks([a, b, c, late]);
    expect(result.picks).toEqual([a, b, c, late]);
    expect(result.removed).toEqual([]);
  });

  it("drops entries whose level gate broke, in one left-to-right pass", () => {
    const a = node();
    const b = node();
    const late = node({ appearanceLevel: 3 });
    // `late` sits at running position 2 (< 3) after a removal elsewhere
    const result = normalizePicks([a, b, late]);
    expect(result.picks).toEqual([a, b]);
    expect(result.removed).toEqual([late]);
  });

  it("drops orphaned children (and their own children, transitively)", () => {
    const parent = node();
    const child = node({ parentId: parent.id });
    const grandchild = node({ parentId: child.id });
    // parent was removed by the user; child chain must fall with it
    const result = normalizePicks([child, grandchild]);
    expect(result.picks).toEqual([]);
    expect(result.removed).toEqual([child, grandchild]);
  });
});

describe("familyOrder", () => {
  it("keeps each family together, depth-first", () => {
    const a = node({ name: "Projectile Boost" });
    const b = node({ name: "Other Root" });
    const a1 = node({ parentId: a.id });
    const a1a = node({ parentId: a1.id });
    // interleaved input, like the API's flat sortOrder list
    expect(familyOrder([a, b, a1, a1a])).toEqual([a, a1, a1a, b]);
  });

  it("appends skills whose parent is missing instead of dropping them", () => {
    const root = node();
    const orphan = node({ parentId: "gone" });
    expect(familyOrder([orphan, root])).toEqual([root, orphan]);
  });
});

describe("skillFamilies", () => {
  // Compact view of the result: [name, depth, parent name].
  const view = (skills: SkillNodeRow[]) =>
    skillFamilies(skills).map((e) => [e.skill.name, e.depth, e.parent?.name ?? null]);

  it("puts each picked child right after its parent, one level deeper", () => {
    const a = node({ name: "A" });
    const b = node({ name: "B" });
    const a1 = node({ name: "A1", parentId: a.id });
    const a1a = node({ name: "A1a", parentId: a1.id });
    const a2 = node({ name: "A2", parentId: a.id });
    // Pick order: B was taken before A's upgrades, but reads after A's family.
    expect(view([a, b, a1, a1a, a2])).toEqual([
      ["A", 0, null],
      ["A1", 1, "A"],
      ["A1a", 2, "A1"],
      ["A2", 1, "A"],
      ["B", 0, null],
    ]);
  });

  it("flags the last child of each parent (where the mobile bracket stops)", () => {
    const a = node({ name: "A" });
    const a1 = node({ name: "A1", parentId: a.id });
    const a1a = node({ name: "A1a", parentId: a1.id });
    const a2 = node({ name: "A2", parentId: a.id });
    const last = Object.fromEntries(skillFamilies([a, a1, a1a, a2]).map((e) => [e.skill.name, e.lastChild]));
    expect(last).toEqual({ A: true, A1: false, A1a: true, A2: true });
  });

  it("counts how many cards back each child's previous sibling sits (for the shared top rail)", () => {
    const a = node({ name: "A" });
    const a1 = node({ name: "A1", parentId: a.id });
    const a1a = node({ name: "A1a", parentId: a1.id });
    const a2 = node({ name: "A2", parentId: a.id });
    const a3 = node({ name: "A3", parentId: a.id });
    const span = Object.fromEntries(
      skillFamilies([a, a1, a1a, a2, a3]).map((e) => [e.skill.name, e.siblingSpan])
    );
    // A1 is a first child (0); A2's rail reaches back over A1a to A1 (2); A3
    // sits right after A2 (1).
    expect(span).toEqual({ A: 0, A1: 0, A1a: 0, A2: 2, A3: 1 });
  });

  it("keeps a skill whose parent isn't in the list as a root, in its own place", () => {
    const x = node({ name: "X" });
    const orphan = node({ name: "Orphan", parentId: "not-picked" });
    const y = node({ name: "Y" });
    expect(view([x, orphan, y])).toEqual([
      ["X", 0, null],
      ["Orphan", 0, null],
      ["Y", 0, null],
    ]);
  });

  it("nests a child under its parent even when the child is listed first", () => {
    const parent = node({ name: "P" });
    const child = node({ name: "C", parentId: parent.id });
    expect(view([child, parent])).toEqual([
      ["P", 0, null],
      ["C", 1, "P"],
    ]);
  });

  it("draws a repeatable skill's child once, under the first copy", () => {
    const r = node({ name: "R", repeatable: true });
    const child = node({ name: "C", parentId: r.id });
    expect(view([r, r, child])).toEqual([
      ["R", 0, null],
      ["C", 1, "R"],
      ["R", 0, null],
    ]);
  });

  it("never drops skills caught in a parent cycle (bad data)", () => {
    const a = node({ name: "A" });
    const b = node({ name: "B", parentId: a.id });
    a.parentId = b.id;
    expect(skillFamilies([a, b])).toHaveLength(2);
  });
});

describe("repeatable skills", () => {
  it("a repeatable skill can be picked again while it is already in the build", () => {
    const r = node({ repeatable: true });
    // already picked once — a non-repeatable skill would be un-pickable now
    expect(canPick(r, [r], [r])).toBe(true);
    expect(lockReason(r, [r], [r])).toBeNull();
  });

  it("a non-repeatable skill still cannot be picked twice", () => {
    const s = node({ repeatable: false });
    expect(canPick(s, [s], [s])).toBe(false);
  });

  it("a repeatable skill is blocked once the 8 normal slots are full", () => {
    const r = node({ repeatable: true });
    const full = Array.from({ length: MAX_SLOTS }, () => node());
    expect(canPick(r, full, [...full, r])).toBe(false);
    expect(lockReason(r, full, [...full, r])).toBe(`Build is full (${MAX_SLOTS}/${MAX_SLOTS})`);
  });
});

describe("availableSkills", () => {
  it("keeps ordinary skills and gated skills whose partner is present", () => {
    const pool = [
      node({ id: "normal" }),
      node({ id: "gatedIn", linkedWeaponId: "w1" }),
      node({ id: "gatedOut", linkedWeaponId: "w2" }),
      node({ id: "gatedMech", linkedMechId: "m1" }),
    ];
    const out = availableSkills(pool, ["w1", "m1"]).map((n) => n.id);
    expect(out).toEqual(["normal", "gatedIn", "gatedMech"]);
  });

  it("drops all gated skills when no partners are present", () => {
    const pool = [node({ id: "normal" }), node({ id: "gated", linkedWeaponId: "w1" })];
    expect(availableSkills(pool, []).map((n) => n.id)).toEqual(["normal"]);
  });
});

describe("quality grants", () => {
  it("tierAtLeast compares tiers by ladder order", () => {
    expect(tierAtLeast("Gold", "Blue")).toBe(true);
    expect(tierAtLeast("Blue", "Gold")).toBe(false);
    expect(tierAtLeast("Gold", "Gold")).toBe(true);
  });

  it("grantedSkills returns nodes whose initialAtTier ≤ the chosen tier", () => {
    const pool = [
      node({ id: "freeze", initialAtTier: "Gold" }),
      node({ id: "late", initialAtTier: "Mythic" }),
      node({ id: "plain" }),
    ];
    expect(grantedSkills(pool, "Gold").map((n) => n.id)).toEqual(["freeze"]);
  });

  it("a granted parent lets its child be picked (parent gate satisfied by grant)", () => {
    const parent = node({ id: "p", initialAtTier: "Gold" });
    const child = node({ id: "c", parentId: "p", appearanceLevel: 1 });
    // No manual picks, but the granted parent satisfies the parent gate.
    expect(canPick(child, [], [parent, child], undefined, [parent])).toBe(true);
  });
});
