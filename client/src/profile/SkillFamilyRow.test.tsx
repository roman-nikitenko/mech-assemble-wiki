import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import type { SkillNodeRow } from "../api/types";
import { SkillFamilyRow } from "./SkillFamilyRow";

const node = (id: string, parentId: string | null): SkillNodeRow => ({
  id, parentId, name: id, description: null, appearanceLevel: 1, type: "Normal",
  sortOrder: 0, repeatable: false, linkedWeaponId: null, linkedMechId: null, initialAtTier: null,
});

describe("SkillFamilyRow", () => {
  // Two children of one parent share a single top rail: the second child's rail
  // must reach back to the first child's drop, not just across the gap.
  it("stretches a later sibling's rail back to its previous sibling", () => {
    render(
      <SkillFamilyRow
        label="Skills"
        skills={[node("P", null), node("C1", "P"), node("C2", "P")]}
      />
    );
    const [parent, first, second] = within(screen.getByRole("list", { name: "Skills" })).getAllByRole("listitem");

    expect(parent.style.getPropertyValue("--rail-width")).toBe("");
    // First child: the short elbow across the gap from its parent.
    expect(first.style.getPropertyValue("--rail-left")).toBe("-0.5rem");
    expect(first.style.getPropertyValue("--rail-width")).toBe("1.5rem");
    // Second child: one card back to its sibling.
    expect(second.style.getPropertyValue("--rail-left")).toBe("calc(0.5rem - 1 * (100% + 0.5rem))");
    expect(second.style.getPropertyValue("--rail-width")).toBe("calc(1 * (100% + 0.5rem) + 0.5rem)");
  });
});
