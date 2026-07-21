import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { SkillsBlock } from "./SkillsBlock";
import type { SkillNodeRow } from "../api/types";

const rows: SkillNodeRow[] = [
  { id: "r", parentId: null, name: "Stackable", description: "buff", appearanceLevel: 1, type: "Normal", sortOrder: 0, repeatable: true },
  { id: "n", parentId: null, name: "Single", description: "once", appearanceLevel: 1, type: "Normal", sortOrder: 1, repeatable: false },
];

function Harness() {
  const [pickedIds, setPickedIds] = useState<string[]>([]);
  return (
    <SkillsBlock
      title="Mech"
      skills={rows}
      pickedIds={pickedIds}
      onPickedChange={setPickedIds}
      defaultExpanded
      globalCoreCount={0}
    />
  );
}

describe("SkillsBlock repeatable picks", () => {
  it("adds the same repeatable skill into two slots and removes one at a time", async () => {
    render(<Harness />);
    // The palette grid is the sibling right after the "All skills" heading —
    // scope to it so queries don't also match the filled slots above.
    const palette = screen.getByText("All skills").nextElementSibling as HTMLElement;
    const addCard = within(palette).getAllByRole("button", { name: /Stackable/ })[0];

    await userEvent.click(addCard);
    await userEvent.click(within(palette).getAllByRole("button", { name: /Stackable/ })[0]);

    expect(screen.getAllByText("Stackable").length).toBeGreaterThanOrEqual(3);
    expect(screen.getByText("(2/8)")).toBeInTheDocument();

    const removeButtons = screen.getAllByRole("button", { name: /Remove Stackable from the build/ });
    await userEvent.click(removeButtons[0]);
    expect(screen.getByText("(1/8)")).toBeInTheDocument();
  });

  it("keeps a non-repeatable skill single (toggles off on second click)", async () => {
    render(<Harness />);
    // The palette grid is the sibling right after the "All skills" heading —
    // scope to it so queries don't also match the filled slots above.
    const palette = screen.getByText("All skills").nextElementSibling as HTMLElement;
    const single = within(palette).getByRole("button", { name: /Single/ });
    await userEvent.click(single);
    expect(screen.getByText("(1/8)")).toBeInTheDocument();
    await userEvent.click(within(palette).getByRole("button", { name: /Single/ }));
    expect(screen.getByText("(0/8)")).toBeInTheDocument();
  });
});
