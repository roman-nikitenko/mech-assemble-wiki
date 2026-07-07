import { describe, expect, it } from "vitest";
import { buildTree } from "./build-tree";

describe("buildTree", () => {
  it("returns [] for no rows", () => {
    expect(buildTree([])).toEqual([]);
  });

  it("returns a single root with no children", () => {
    const roots = buildTree([{ id: "a", parentId: null }]);
    expect(roots).toEqual([{ id: "a", parentId: null, children: [] }]);
  });

  it("nests branching children and grandchildren", () => {
    const roots = buildTree([
      { id: "root", parentId: null, name: "Root" },
      { id: "c1", parentId: "root", name: "Child 1" },
      { id: "c2", parentId: "root", name: "Child 2" },
      { id: "g1", parentId: "c1", name: "Grandchild" },
    ]);
    expect(roots).toHaveLength(1);
    expect(roots[0].children.map((c) => c.id)).toEqual(["c1", "c2"]);
    expect(roots[0].children[0].children[0].name).toBe("Grandchild");
  });

  it("returns multiple roots as a forest", () => {
    const roots = buildTree([
      { id: "a", parentId: null },
      { id: "b", parentId: null },
    ]);
    expect(roots.map((r) => r.id)).toEqual(["a", "b"]);
  });

  it("treats a node with an unknown parent as a root (documented orphan behavior)", () => {
    const roots = buildTree([
      { id: "orphan", parentId: "ghost-parent" },
      { id: "root", parentId: null },
    ]);
    expect(roots.map((r) => r.id)).toEqual(["orphan", "root"]);
  });
});
