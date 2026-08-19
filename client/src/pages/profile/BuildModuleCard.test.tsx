import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BuildModuleCard } from "./BuildModuleCard";
import type { GameType, ModuleQuality, ModuleSelection, ModuleSummary } from "../../api/types";

const types: GameType[] = [
  { id: "t-ice", name: "Ice", iconUrl: null },
  { id: "t-fire", name: "Fire", iconUrl: null },
];
const qualities: ModuleQuality[] = [
  { id: "qGold", name: "Gold", iconUrl: null, hp: "22.00k", atk: "4400", def: "2200", effect1Value: "+30%", effectCount: 2, sortOrder: 5 },
  { id: "qMythic", name: "Mythic", iconUrl: null, hp: "54.00k", atk: "10.80k", def: "5400", effect1Value: "+50%", effectCount: 3, sortOrder: 6 },
];
const module: ModuleSummary = {
  id: "m1", name: "Ammo Chain", iconUrl: null, effect2Target: "Weapon", effect3Target: "Weapon",
  bonuses: [
    { id: "b1", slot: 2, effectText: "reload -0.5s", sortOrder: 0, mech: null, weapon: { id: "w9", slug: null, name: "Rail Gun", iconUrl: null } },
  ],
};
const goldSel: ModuleSelection = { quality: "Gold", effect1: null, effect2: null, effect3: null };

describe("BuildModuleCard", () => {
  it("equips an Effect 1 element on click and reports it by typeId", async () => {
    const onChange = vi.fn();
    render(<BuildModuleCard module={module} types={types} qualities={qualities} selection={goldSel} onChange={onChange} />);
    await userEvent.click(screen.getByRole("tab", { name: "Effect 1" }));
    await userEvent.click(screen.getByText(/Ice DMG/));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ effect1: "t-ice" }));
  });

  it("equips an Effect 2 bonus by its target entity id", async () => {
    const onChange = vi.fn();
    render(<BuildModuleCard module={module} types={types} qualities={qualities} selection={goldSel} onChange={onChange} />);
    await userEvent.click(screen.getByRole("tab", { name: "Effect 2" }));
    await userEvent.click(screen.getByText("reload -0.5s"));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ effect2: "w9" }));
  });

  it("shows the same Effect 2 bonus at Gold AND Mythic (per-module)", async () => {
    // Gold
    const { unmount } = render(
      <BuildModuleCard module={module} types={types} qualities={qualities} selection={goldSel} onChange={() => {}} />
    );
    await userEvent.click(screen.getByRole("tab", { name: "Effect 2" }));
    expect(screen.getByText("reload -0.5s")).toBeInTheDocument();
    unmount();
    // Mythic — same bonus (it's module-level, not per quality)
    const mythicSel = { quality: "Mythic" as const, effect1: null, effect2: null, effect3: null };
    render(<BuildModuleCard module={module} types={types} qualities={qualities} selection={mythicSel} onChange={() => {}} />);
    await userEvent.click(screen.getByRole("tab", { name: "Effect 2" }));
    expect(screen.getByText("reload -0.5s")).toBeInTheDocument();
  });

  it("readOnly shows the equipped effect, no tabs, no quality dropdown", () => {
    const sel = { quality: "Gold" as const, effect1: "t-ice", effect2: null, effect3: null };
    render(<BuildModuleCard module={module} types={types} qualities={qualities} selection={sel} readOnly />);
    // No editing controls
    expect(screen.queryByRole("tab", { name: "Effect 1" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /quality/ })).not.toBeInTheDocument();
    // The equipped element shows
    expect(screen.getByText(/Ice DMG/)).toBeInTheDocument();
    expect(screen.getByText("+30%")).toBeInTheDocument();
  });

  it("shows only base attributes (no effect tabs) at Blue", () => {
    render(<BuildModuleCard module={module} types={types} qualities={qualities} selection={{ quality: "Blue", effect1: null, effect2: null, effect3: null }} onChange={() => {}} />);
    expect(screen.queryByRole("tab", { name: "Effect 1" })).not.toBeInTheDocument();
  });
});
