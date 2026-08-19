import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ModuleCard } from "./ModuleCard";
import type { GameType, ModuleQuality, ModuleSummary } from "../api/types";

const types: GameType[] = [
  { id: "t1", name: "Ice", iconUrl: null },
  { id: "t2", name: "Fire", iconUrl: null },
];

const goldQuality: ModuleQuality = {
  id: "qGold",
  name: "Gold",
  iconUrl: null,
  hp: "22.00k",
  atk: "4400",
  def: "2200",
  effect1Value: "+30%",
  effectCount: 2,
  sortOrder: 5,
};

const module: ModuleSummary = {
  id: "m1",
  name: "Ammo Chain",
  iconUrl: null,
  effect2Target: "Weapon",
  effect3Target: "Weapon",
  effects: [
    {
      id: "e1",
      qualityId: "qGold",
      effect1Value: null,
      bonuses: [
        {
          id: "b1",
          slot: 2,
          effectText: "reload -0.5s",
          sortOrder: 0,
          mech: null,
          weapon: { id: "w1", slug: null, name: "Rail Gun", iconUrl: null },
        },
      ],
    },
  ],
};

describe("ModuleCard", () => {
  it("shows base attributes and the Effect 1 element list at Gold", () => {
    render(<ModuleCard module={module} tier="Gold" quality={goldQuality} types={types} />);
    expect(screen.getByText("Ammo Chain")).toBeInTheDocument();
    expect(screen.getByText("22.00k")).toBeInTheDocument();
    expect(screen.getByText(/Ice DMG/)).toBeInTheDocument();
    expect(screen.getAllByText("+30%").length).toBeGreaterThan(0);
  });

  it("switches to Effect 2 and lists the module's bonuses", async () => {
    render(<ModuleCard module={module} tier="Gold" quality={goldQuality} types={types} />);
    await userEvent.click(screen.getByRole("tab", { name: "Effect 2" }));
    expect(screen.getByText("Rail Gun")).toBeInTheDocument();
    expect(screen.getByText("reload -0.5s")).toBeInTheDocument();
  });

  it("shows no effect tabs at Blue", () => {
    render(<ModuleCard module={module} tier="Blue" quality={null} types={types} />);
    expect(screen.queryByRole("tab", { name: "Effect 1" })).not.toBeInTheDocument();
  });
});
