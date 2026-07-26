import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FilterBar } from "./FilterBar";
import type { GameType } from "../api/types";

const TYPES: GameType[] = [
  { id: "t-fire", name: "Fire", iconUrl: "/fire.svg" },
  { id: "t-thunder", name: "Thunder", iconUrl: null },
];

function setup(overrides: Partial<Parameters<typeof FilterBar>[0]> = {}) {
  const props = {
    types: TYPES,
    selectedTypeIds: [] as string[],
    selectedRanks: [] as ("Standard" | "S")[],
    search: "",
    onToggleType: vi.fn(),
    onToggleRank: vi.fn(),
    onSearchChange: vi.fn(),
    onClear: vi.fn(),
    ...overrides,
  };
  render(<FilterBar {...props} />);
  return props;
}

describe("FilterBar", () => {
  it("renders a toggle button per type and per rank", () => {
    setup();
    expect(screen.getByRole("button", { name: "Fire" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Thunder" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Standard" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "S-tier" })).toBeInTheDocument();
  });

  it("marks a selected type as pressed and toggles it on click", async () => {
    const user = userEvent.setup();
    const props = setup({ selectedTypeIds: ["t-fire"] });

    // Selected chip is visibly pressed (aria-pressed drives the styling).
    expect(screen.getByRole("button", { name: "Fire" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(screen.getByRole("button", { name: "Thunder" })).toHaveAttribute(
      "aria-pressed",
      "false"
    );

    await user.click(screen.getByRole("button", { name: "Thunder" }));
    expect(props.onToggleType).toHaveBeenCalledWith("t-thunder");
  });

  it("shows Clear only when a filter is active, and clears on click", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <FilterBar
        types={TYPES}
        selectedTypeIds={[]}
        selectedRanks={[]}
        search=""
        onToggleType={vi.fn()}
        onToggleRank={vi.fn()}
        onSearchChange={vi.fn()}
        onClear={vi.fn()}
      />
    );
    expect(screen.queryByRole("button", { name: "Clear" })).not.toBeInTheDocument();

    const onClear = vi.fn();
    rerender(
      <FilterBar
        types={TYPES}
        selectedTypeIds={["t-fire"]}
        selectedRanks={[]}
        search=""
        onToggleType={vi.fn()}
        onToggleRank={vi.fn()}
        onSearchChange={vi.fn()}
        onClear={onClear}
      />
    );
    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect(onClear).toHaveBeenCalled();
  });
});
