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
});
