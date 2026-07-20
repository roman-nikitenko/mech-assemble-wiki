import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import type { MechSummary, WeaponSummary } from "../api/types";
import { NotePreview } from "./NotePreview";

const mech: MechSummary = {
  id: "m1",
  name: "Iron Colossus",
  epithet: null,
  type: null,
  rank: "Standard",
  imageUrl: "/uploads/colossus.png",
};

const weapon = {
  id: "w1",
  name: "Blade of Dawn",
  description: null,
  tier: "S",
  rankUpPreview: [],
  imageUrl: null,
  iconUrl: "/uploads/blade-icon.png",
  type: null,
  mech: null,
  pilot: null,
  weaponSkins: [],
  skillNodes: [],
} as WeaponSummary;

describe("NotePreview", () => {
  it("renders headings, bold and italic", () => {
    render(<NotePreview text={"## Plan\nGo **fast** and *loose*"} mechs={[]} weapons={[]} />);
    expect(screen.getByRole("heading", { level: 2, name: "Plan" })).toBeInTheDocument();
    expect(screen.getByText("fast").tagName).toBe("STRONG");
    expect(screen.getByText("loose").tagName).toBe("EM");
  });

  it("resolves mentions and includes the hover card image", () => {
    render(
      <NotePreview
        text="Pair #[Iron Colossus] with #[Blade of Dawn]"
        mechs={[mech]}
        weapons={[weapon]}
      />
    );
    // the hover card carries the image (CSS shows it on hover)
    const mechImg = screen.getByAltText("Iron Colossus");
    expect(mechImg).toHaveAttribute("src", expect.stringContaining("/uploads/colossus.png"));
    const weaponImg = screen.getByAltText("Blade of Dawn");
    expect(weaponImg).toHaveAttribute("src", expect.stringContaining("/uploads/blade-icon.png"));
  });

  it("renders unknown mentions as dim literal text", () => {
    render(<NotePreview text="Try #[Nobody]" mechs={[mech]} weapons={[]} />);
    expect(screen.getByText("#[Nobody]")).toBeInTheDocument();
  });
});
