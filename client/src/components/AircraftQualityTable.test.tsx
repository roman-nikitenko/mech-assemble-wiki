import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AircraftQualityTable } from "./AircraftQualityTable";

/** Renders the table and opens it — most assertions are about the contents. */
async function renderExpanded() {
  render(<AircraftQualityTable />);
  await userEvent.click(screen.getByRole("button", { name: /quality ladder/i }));
}

describe("AircraftQualityTable", () => {
  it("starts collapsed, showing only the toggle", () => {
    render(<AircraftQualityTable />);
    const toggle = screen.getByRole("button", { name: /quality ladder/i });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    // Role queries skip hidden subtrees, so the table is genuinely not exposed.
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("expands and collapses again on click", async () => {
    render(<AircraftQualityTable />);
    const toggle = screen.getByRole("button", { name: /quality ladder/i });

    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("table")).toBeInTheDocument();

    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("renders every tier from Q1 to Q13 once expanded", async () => {
    await renderExpanded();
    // Literal counts, not AIRCRAFT_QUALITIES.length — deriving the expectation
    // from the data under test would pass even if a row went missing.
    expect(screen.getAllByRole("row")).toHaveLength(14); // 13 tiers + the header
    for (let i = 1; i <= 13; i++) {
      expect(screen.getByRole("rowheader", { name: `Q${i}` })).toBeInTheDocument();
    }
    expect(screen.getByText("Crude")).toBeInTheDocument();
    expect(screen.getByText("Supreme")).toBeInTheDocument();
  });

  it("joins the flat stats and formats thousands with commas", async () => {
    await renderExpanded();
    const supreme = screen.getByRole("rowheader", { name: "Q13" }).closest("tr")!;
    expect(
      within(supreme).getByText("HP +20,000, ATK +4,000, DEF +2,000")
    ).toBeInTheDocument();
    // Level cap and shards are formatted the same way.
    expect(within(supreme).getByText("3,000")).toBeInTheDocument();
  });

  it("shows a dash for a tier that grants no stats", async () => {
    await renderExpanded();
    const crude = screen.getByRole("rowheader", { name: "Q1" }).closest("tr")!;
    expect(within(crude).getByText("—")).toBeInTheDocument();
  });
});
