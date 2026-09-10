import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AIRCRAFT_RANK_TIERS, RankUpPreview } from "./RankUpPreview";

describe("RankUpPreview", () => {
  it("labels each line with its quality tier", () => {
    render(<RankUpPreview steps={["Initial DMG +25%", "", "", "", "", "Initial [Freeze]", ""]} />);
    expect(screen.getByText("Initial DMG +25%")).toBeInTheDocument();
    expect(screen.getByLabelText("Blue")).toBeInTheDocument(); // first line = Blue
    expect(screen.getByLabelText("Gold")).toBeInTheDocument(); // sixth line = Gold
  });

  it("runs a different ladder when given one", () => {
    // Aircraft start at Orange, so slot 0 must NOT render the default Blue gem.
    render(
      <RankUpPreview steps={["First", "", "", "", "Last"]} tiers={AIRCRAFT_RANK_TIERS} />
    );
    expect(screen.getByLabelText("Orange")).toBeInTheDocument();
    expect(screen.getByLabelText("Mythic")).toBeInTheDocument();
    expect(screen.queryByLabelText("Blue")).not.toBeInTheDocument();
  });

  it("dims the rungs a build hasn't reached yet", () => {
    const { container } = render(
      <RankUpPreview
        steps={["Orange perk", "Red perk", "Turquoise perk", "Gold perk", "Mythic perk"]}
        tiers={AIRCRAFT_RANK_TIERS}
        quality="Turquoise"
      />
    );
    const rows = container.querySelectorAll("li");
    // Orange/Red/Turquoise are reached; Gold and Mythic are still locked.
    expect(rows[0].className).not.toContain("opacity-40");
    expect(rows[2].className).not.toContain("opacity-40");
    expect(rows[3].className).toContain("opacity-40");
    expect(rows[4].className).toContain("opacity-40");
  });

  it("dims nothing when no quality is given", () => {
    const { container } = render(
      <RankUpPreview steps={["a", "b", "c", "d", "e"]} tiers={AIRCRAFT_RANK_TIERS} />
    );
    for (const row of container.querySelectorAll("li")) {
      expect(row.className).not.toContain("opacity-40");
    }
  });
});
