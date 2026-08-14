import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ButtonGroup } from "./ButtonGroup";

const options = [
  { value: "", label: "All" },
  { value: "a", label: "Alpha" },
  { value: "b", label: "Beta" },
];

describe("ButtonGroup", () => {
  it("marks the selected option pressed and reports clicks", async () => {
    const onChange = vi.fn();
    render(<ButtonGroup options={options} value="a" onChange={onChange} />);
    expect(screen.getByRole("button", { name: "Alpha" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    await userEvent.click(screen.getByRole("button", { name: "Beta" }));
    expect(onChange).toHaveBeenCalledWith("b");
  });

  it("prefixes each button's accessible name when labelPrefix is set", () => {
    render(
      <ButtonGroup options={options} value="" onChange={() => {}} labelPrefix="Type" />
    );
    expect(screen.getByRole("button", { name: "Type Alpha" })).toBeInTheDocument();
  });

  it("clears the selection when the active option is clicked in toggleable mode", async () => {
    const onChange = vi.fn();
    render(<ButtonGroup options={options} value="a" onChange={onChange} toggleable />);
    await userEvent.click(screen.getByRole("button", { name: "Alpha" }));
    expect(onChange).toHaveBeenCalledWith("");
  });

  it("hides the label but keeps it as the accessible name in iconOnly mode", () => {
    const opts = [{ value: "a", label: "Alpha", icon: <span>★</span> }];
    render(<ButtonGroup options={opts} value="" onChange={() => {}} iconOnly />);
    const btn = screen.getByRole("button", { name: "Alpha" });
    expect(btn).toBeInTheDocument();
    expect(btn).not.toHaveTextContent("Alpha");
  });
});
