import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { RankUpPreview } from "./RankUpPreview";

describe("RankUpPreview", () => {
  it("labels each line with its quality tier", () => {
    render(<RankUpPreview steps={["Initial DMG +25%", "", "", "", "", "Initial [Freeze]", ""]} />);
    expect(screen.getByText("Initial DMG +25%")).toBeInTheDocument();
    expect(screen.getByLabelText("Blue")).toBeInTheDocument(); // first line = Blue
    expect(screen.getByLabelText("Gold")).toBeInTheDocument(); // sixth line = Gold
  });
});
