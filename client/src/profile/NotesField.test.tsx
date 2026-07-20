import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import type { MechSummary } from "../api/types";
import { NotesField } from "./NotesField";

const mech: MechSummary = {
  id: "m1",
  name: "Iron Colossus",
  epithet: null,
  type: null,
  rank: "Standard",
  imageUrl: null,
};

function Harness({ initial = "" }: { initial?: string }) {
  const [value, setValue] = useState(initial);
  return <NotesField id="notes" value={value} onChange={setValue} mechs={[mech]} weapons={[]} />;
}

describe("NotesField", () => {
  it("wraps the selection in ** when Bold is clicked", async () => {
    render(<Harness initial="hello" />);
    const box = screen.getByRole("textbox") as HTMLTextAreaElement;
    box.focus();
    box.setSelectionRange(0, 5);
    await userEvent.click(screen.getByRole("button", { name: "Bold" }));
    expect(box).toHaveValue("**hello**");
  });

  it("prefixes the current line for headings", async () => {
    render(<Harness initial="title" />);
    await userEvent.click(screen.getByRole("button", { name: "H2" }));
    expect(screen.getByRole("textbox")).toHaveValue("## title");
  });

  it("inserts a mention from the picker and shows it in the preview", async () => {
    const { container } = render(<Harness />);
    await userEvent.selectOptions(screen.getByLabelText("Insert mention"), "Iron Colossus");
    expect(screen.getByRole("textbox")).toHaveValue("#[Iron Colossus]");
    // the live preview resolves it into the colored mention span
    const mention = container.querySelector("span.text-thunder");
    expect(mention).not.toBeNull();
    expect(mention!.textContent).toContain("Iron Colossus");
  });
});
