import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { UpgradeTree } from "./UpgradeTree";
import type { UpgradeNode } from "../api/types";

// Mirrors the seeded Thunder Slash shape: root -> child -> evolution grandchild.
const tree: UpgradeNode[] = [
  {
    id: "root",
    parentId: null,
    name: "Root Upgrade",
    description: "Base.",
    isEvolution: false,
    unlockReq: null,
    children: [
      {
        id: "child",
        parentId: "root",
        name: "Child Upgrade",
        description: null,
        isEvolution: false,
        unlockReq: "2/8",
        children: [
          {
            id: "grand",
            parentId: "child",
            name: "Final Evolution",
            description: null,
            isEvolution: true,
            unlockReq: "3/8",
            children: [],
          },
        ],
      },
    ],
  },
];

describe("UpgradeTree", () => {
  it("renders all nesting levels", () => {
    render(<UpgradeTree roots={tree} />);
    expect(screen.getByText("Root Upgrade")).toBeInTheDocument();
    expect(screen.getByText("Child Upgrade")).toBeInTheDocument();
    expect(screen.getByText("Final Evolution")).toBeInTheDocument();
  });

  it("marks evolution nodes and shows unlock requirements", () => {
    render(<UpgradeTree roots={tree} />);
    expect(screen.getByText("EVOLVE")).toBeInTheDocument();
    expect(screen.getByText("unlock 2/8")).toBeInTheDocument();
    expect(screen.getByText("unlock 3/8")).toBeInTheDocument();
  });
});
