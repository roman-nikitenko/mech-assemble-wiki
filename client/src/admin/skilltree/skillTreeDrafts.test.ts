import { describe, expect, it } from "vitest";
import {
  draftsFromNodes,
  indentRow,
  moveRow,
  outdentRow,
  removeRow,
  rowDepth,
  serializeDrafts,
  type SkillDraft,
} from "./skillTreeDrafts";

function draft(key: string, parentKey: string | null, name = key): SkillDraft {
  return { key, parentKey, name, description: "", appearanceLevel: 1, type: "Normal", expanded: false };
}

// DFS order: a, a1, a1x, b   (a1 child of a; a1x child of a1; b root)
const base: SkillDraft[] = [
  draft("a", null),
  draft("a1", "a"),
  draft("a1x", "a1"),
  draft("b", null),
];

describe("skillTreeDrafts helpers", () => {
  it("computes depth from parent chains", () => {
    expect(rowDepth(base, base[0])).toBe(0);
    expect(rowDepth(base, base[1])).toBe(1);
    expect(rowDepth(base, base[2])).toBe(2);
  });

  it("indent makes a row a child of its previous sibling", () => {
    const next = indentRow(base, 3); // b indents under a
    expect(next.find((d) => d.key === "b")!.parentKey).toBe("a");
  });

  it("outdent moves the subtree after the old parent's subtree", () => {
    const next = outdentRow(base, 1); // a1 (with child a1x) becomes root
    expect(next.find((d) => d.key === "a1")!.parentKey).toBeNull();
    // DFS order preserved: a, a1, a1x, b — a1's block sits after a's subtree
    expect(next.map((d) => d.key)).toEqual(["a", "a1", "a1x", "b"]);
    expect(next.find((d) => d.key === "a1x")!.parentKey).toBe("a1"); // child kept
  });

  it("remove promotes children to the removed row's parent", () => {
    const next = removeRow(base, 1); // remove a1 -> a1x promoted to a
    expect(next.map((d) => d.key)).toEqual(["a", "a1x", "b"]);
    expect(next.find((d) => d.key === "a1x")!.parentKey).toBe("a");
  });

  it("moveRow moves a whole subtree and re-parents to the drop context", () => {
    // move b (index 3) to the very top as a root
    const next = moveRow(base, 3, 0, 0);
    expect(next.map((d) => d.key)).toEqual(["b", "a", "a1", "a1x"]);
    expect(next.find((d) => d.key === "b")!.parentKey).toBeNull();
  });

  it("serializes to parentIndex form and round-trips from nodes", () => {
    const serialized = serializeDrafts(base);
    expect(serialized[1].parentIndex).toBe(0);
    expect(serialized[2].parentIndex).toBe(1);
    expect(serialized[3].parentIndex).toBeNull();

    const rebuilt = draftsFromNodes([
      { id: "a", parentId: null, name: "a", description: null, appearanceLevel: 1, type: "Normal", sortOrder: 0 },
      { id: "b", parentId: null, name: "b", description: null, appearanceLevel: 1, type: "Normal", sortOrder: 1 },
      { id: "a1", parentId: "a", name: "a1", description: null, appearanceLevel: 1, type: "Normal", sortOrder: 0 },
    ]);
    expect(rebuilt.map((d) => d.key)).toEqual(["a", "a1", "b"]); // depth-first
  });
});
