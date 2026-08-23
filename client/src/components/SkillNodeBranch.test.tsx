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

  it("groups base skills by appearance level under ascending N/8 headers", () => {
    const nodes: SkillNodeRow[] = [
      { ...base, id: "s5", name: "Skill L5", appearanceLevel: 5 },
      { ...base, id: "s1", name: "Skill L1", appearanceLevel: 1 },
      { ...base, id: "s3", name: "Skill L3", appearanceLevel: 3 },
    ];
    render(<SkillsTab nodes={nodes} />);
    const headers = screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent);
    expect(headers).toEqual(["1/8", "3/8", "5/8"]);
  });

  it("keeps each base skill's upgrade tree nested beneath it", () => {
    const nodes: SkillNodeRow[] = [
      { ...base, id: "root5", name: "Root L5", appearanceLevel: 5 },
      { ...base, id: "up", name: "Upgrade", parentId: "root5", appearanceLevel: 5 },
    ];
    render(<SkillsTab nodes={nodes} />);
    // The Lv5 base skill sits under the 5/8 header, with its upgrade still shown.
    expect(screen.getByText("5/8")).toBeInTheDocument();
    expect(screen.getByText("Root L5")).toBeInTheDocument();
    expect(screen.getByText("Upgrade")).toBeInTheDocument();
  });
});
