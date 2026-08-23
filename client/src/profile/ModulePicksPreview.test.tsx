import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ModulePicksPreview } from "./ModulePicksPreview";
import type { GameType, ModuleQuality, ModuleSelection, ModuleSummary } from "../api/types";

const types: GameType[] = [{ id: "t-ice", name: "Ice", iconUrl: null }];
const qualities: ModuleQuality[] = [
  { id: "qGold", name: "Gold", iconUrl: null, hp: "22.00k", atk: "4400", def: "2200", effect1Value: "+30%", effectCount: 2, sortOrder: 5 },
  { id: "qMythic", name: "Mythic", iconUrl: null, hp: "54.00k", atk: "10.80k", def: "5400", effect1Value: "+50%", effectCount: 3, sortOrder: 6 },
];
const modules: ModuleSummary[] = [
  { id: "m1", name: "Ammo Chain", iconUrl: null, effect2Target: "Weapon", effect3Target: "Weapon", bonuses: [] },
  { id: "m2", name: "Hunter", iconUrl: null, effect2Target: "Weapon", effect3Target: "Weapon", bonuses: [] },
];

describe("ModulePicksPreview", () => {
  it("renders nothing when the build picked no modules", () => {
    const { container } = render(
      <ModulePicksPreview modules={modules} selections={{}} types={types} qualities={qualities} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("shows a square only for picked modules, labelled with the picked tier", () => {
    const selections: Record<string, ModuleSelection> = {
      m1: { quality: "Mythic", effect1: null, effect2: null, effect3: null },
    };
    render(<ModulePicksPreview modules={modules} selections={selections} types={types} qualities={qualities} />);
    expect(screen.getByRole("button", { name: /Ammo Chain.*Mythic/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Hunter/ })).not.toBeInTheDocument();
  });

  it("opens the read-only module card when a square is clicked", async () => {
    const selections: Record<string, ModuleSelection> = {
      m1: { quality: "Gold", effect1: null, effect2: null, effect3: null },
    };
    render(<ModulePicksPreview modules={modules} selections={selections} types={types} qualities={qualities} />);
    // The card's base attributes are not in the DOM until the square is opened.
    expect(screen.queryByText("22.00k")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Ammo Chain/ }));
    expect(await screen.findByText("22.00k")).toBeInTheDocument();
  });
});
