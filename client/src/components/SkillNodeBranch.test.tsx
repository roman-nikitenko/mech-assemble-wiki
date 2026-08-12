import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import type { SkillNodeRow } from "../api/types";
import { SkillsTab } from "../pages/sections/SkillsTab";

const base: Omit<SkillNodeRow, "id" | "name"> = {
  parentId: null,
  description: null,
  appearanceLevel: 1,
  type: "Normal",
  sortOrder: 0,
  repeatable: false,
  linkedWeaponId: null,
  linkedMechId: null,
  initialAtTier: null,
};

describe("SkillsTab", () => {
  it("hides linked skills (gated nodes) from the public tab", () => {
    const nodes: SkillNodeRow[] = [
      { ...base, id: "a", name: "Normal Skill" },
      { ...base, id: "b", name: "Linked Skill", linkedWeaponId: "w1" },
    ];
    render(<SkillsTab nodes={nodes} />);
    expect(screen.getByText("Normal Skill")).toBeInTheDocument();
    expect(screen.queryByText("Linked Skill")).not.toBeInTheDocument();
  });
});
