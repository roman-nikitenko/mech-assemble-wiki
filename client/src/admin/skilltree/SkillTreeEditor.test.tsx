import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { SkillTreeEditor } from "./SkillTreeEditor";
import type { SkillDraft } from "./skillTreeDrafts";

function Harness({ initial = [] as SkillDraft[] }) {
  const [drafts, setDrafts] = useState<SkillDraft[]>(initial);
  return <SkillTreeEditor drafts={drafts} onChange={setDrafts} />;
}

describe("SkillTreeEditor", () => {
  it("Add skill appends an expanded row with all fields", async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole("button", { name: "+ Add skill" }));
    expect(screen.getByLabelText("Skill name")).toBeInTheDocument();
    expect(screen.getByLabelText("Skill description")).toBeInTheDocument();
    expect(screen.getByLabelText("Appearance level")).toBeInTheDocument();
    expect(screen.getByLabelText("Skill type")).toBeInTheDocument();
  });

  it("switching type to Core hides the name field", async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole("button", { name: "+ Add skill" }));
    await userEvent.selectOptions(screen.getByLabelText("Skill type"), "Core");
    expect(screen.queryByLabelText("Skill name")).not.toBeInTheDocument();
    expect(screen.getByText("Core skill")).toBeInTheDocument();
  });

  it("indent button nests a row under the one above", async () => {
    render(
      <Harness
        initial={[
          { key: "a", parentKey: null, name: "Alpha", description: "", appearanceLevel: 1, type: "Normal", expanded: false, repeatable: false },
          { key: "b", parentKey: null, name: "Beta", description: "", appearanceLevel: 1, type: "Normal", expanded: false, repeatable: false },
        ]}
      />
    );
    await userEvent.click(screen.getByRole("button", { name: "Indent Beta" }));
    // nested rows carry the sub-item marker, WP style
    expect(screen.getByText("sub item")).toBeInTheDocument();
  });

  it("shows a Repeatable checkbox for a Normal skill and toggles it", async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole("button", { name: "+ Add skill" }));
    const checkbox = screen.getByLabelText("Repeatable") as HTMLInputElement;
    expect(checkbox.checked).toBe(false);
    await userEvent.click(checkbox);
    expect((screen.getByLabelText("Repeatable") as HTMLInputElement).checked).toBe(true);
  });

  it("hides the Repeatable checkbox for non-Normal skills", async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole("button", { name: "+ Add skill" }));
    await userEvent.selectOptions(screen.getByLabelText("Skill type"), "Premium");
    expect(screen.queryByLabelText("Repeatable")).not.toBeInTheDocument();
  });
});
