import { describe, expect, it } from "vitest";
import type { SkillNodeRow } from "../api/types";
import { MAX_SLOTS, canPick, familyOrder, lockReason, normalizePicks, skillDisplayName } from "./buildRules";

let seq = 0;
const node = (over: Partial<SkillNodeRow> = {}): SkillNodeRow => ({
  id: `s${++seq}`,
  parentId: null,
  name: `Skill ${seq}`,
  description: null,
  appearanceLevel: 1,
  type: "Normal",
  sortOrder: 0,
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
