import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Dropdown, type DropdownOption } from "./Dropdown";

const OPTIONS: DropdownOption[] = [
  { value: "fire", label: "Fire", icon: <span data-testid="ic-fire">◆</span> },
  { value: "ice", label: "Ice" },
  { value: "explosive", label: "Explosive" },
];

describe("Dropdown", () => {
  it("shows the placeholder, opens on click, and selects an option", async () => {
    const onChange = vi.fn();
    render(<Dropdown options={OPTIONS} value={null} onChange={onChange} ariaLabel="Type" placeholder="Start type…" />);
    const trigger = screen.getByRole("button", { name: "Type" });
    expect(trigger).toHaveTextContent("Start type…");
    // Options are hidden until opened.
    expect(screen.queryByRole("option", { name: "Ice" })).not.toBeInTheDocument();
    await userEvent.click(trigger);
    expect(screen.getByRole("option", { name: "Fire" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("option", { name: "Ice" }));
    expect(onChange).toHaveBeenCalledWith("ice");
    // Closes after selecting.
    expect(screen.queryByRole("option", { name: "Fire" })).not.toBeInTheDocument();
  });

  it("renders the selected option's icon + label in the trigger", () => {
    render(<Dropdown options={OPTIONS} value="fire" onChange={vi.fn()} ariaLabel="Type" />);
    const trigger = screen.getByRole("button", { name: "Type" });
    expect(trigger).toHaveTextContent("Fire");
    expect(screen.getByTestId("ic-fire")).toBeInTheDocument();
  });

  it("filters options by label when searchable", async () => {
    render(<Dropdown options={OPTIONS} value={null} onChange={vi.fn()} ariaLabel="Type" searchable />);
    await userEvent.click(screen.getByRole("button", { name: "Type" }));
    // Opening a searchable dropdown reveals a text box.
    const input = screen.getByLabelText("Type");
    await userEvent.type(input, "ic");
    expect(screen.getByRole("option", { name: "Ice" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Fire" })).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Explosive" })).not.toBeInTheDocument();
  });

  it("does not show a search box when not searchable", async () => {
    render(<Dropdown options={OPTIONS} value={null} onChange={vi.fn()} ariaLabel="Type" />);
    await userEvent.click(screen.getByRole("button", { name: "Type" }));
    // The trigger stays a button (no text input to type into).
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Fire" })).toBeInTheDocument();
  });
});
