import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AircraftCard } from "./AircraftCard";
import type { Aircraft } from "../api/types";

const base: Aircraft = {
  id: "a1",
  name: "Sky Raider",
  description: null,
  imageUrl: null,
  tier: "S",
  hp: "54.00k",
  atk: "10.80k",
  def: null,
  specialBonus: null,
  rankUpPreview: [],
};

describe("AircraftCard", () => {
  it("shows the name, description and the stats that have values", () => {
    render(
      <AircraftCard aircraft={{ ...base, description: "A heavy gunship." }} />
    );
    expect(screen.getByText("Sky Raider")).toBeInTheDocument();
    expect(screen.getByText("A heavy gunship.")).toBeInTheDocument();
    expect(screen.getByText("HP")).toBeInTheDocument();
    expect(screen.getByText("54.00k")).toBeInTheDocument();
    // def is null, so no DEF row at all.
    expect(screen.queryByText("DEF")).not.toBeInTheDocument();
  });

  it("shows the special bonus only when one is set", () => {
    const { unmount } = render(<AircraftCard aircraft={base} />);
    expect(screen.queryByText("Special bonus")).not.toBeInTheDocument();
    unmount();

    render(<AircraftCard aircraft={{ ...base, specialBonus: "ATK +10%" }} />);
    expect(screen.getByText("Special bonus")).toBeInTheDocument();
    expect(screen.getByText("ATK +10%")).toBeInTheDocument();
  });

  it("colours the rank-up rows Orange → Mythic, never Blue", () => {
    render(
      <AircraftCard
        aircraft={{ ...base, rankUpPreview: ["Rank one", "Rank two", "", "", "Rank five"] }}
      />
    );
    expect(screen.getByLabelText("Orange")).toBeInTheDocument();
    expect(screen.getByLabelText("Red")).toBeInTheDocument();
    expect(screen.getByLabelText("Mythic")).toBeInTheDocument();
    expect(screen.queryByLabelText("Blue")).not.toBeInTheDocument();
  });

  it("keeps blank slots positional so later ranks stay on their own colour", () => {
    // Slots 3 and 4 (Turquoise, Gold) are blank — slot 5 must still be Mythic
    // rather than sliding up to Turquoise.
    render(
      <AircraftCard aircraft={{ ...base, rankUpPreview: ["Rank one", "", "", "", "Rank five"] }} />
    );
    expect(screen.getByLabelText("Orange")).toBeInTheDocument();
    expect(screen.getByLabelText("Mythic")).toBeInTheDocument();
    expect(screen.queryByLabelText("Red")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Turquoise")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Gold")).not.toBeInTheDocument();
  });

  it("renders no rank-up section when every slot is blank", () => {
    render(<AircraftCard aircraft={{ ...base, rankUpPreview: ["", "", ""] }} />);
    expect(screen.queryByText("Rank-Up Preview")).not.toBeInTheDocument();
  });
});
