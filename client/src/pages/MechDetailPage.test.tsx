import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MechDetailPage } from "./MechDetailPage";
import type { MechDetail } from "../api/types";

// A minimal Standard mech: no weapon, no awakening, no skins/helpers.
const bareMech: MechDetail = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Test Mech",
  epithet: null,
  type: null,
  rank: "Standard",
  quality: null,
  imageUrl: null,
  specialBonus: null,
  pilotName: null,
  lore: null,
  skills: [],
  traits: [],
  awakeningLevels: [],
  weapon: null,
  accessory: null,
  pilot: null,
  skins: [],
  helpers: [],
};

/** Stubs fetch to return the given mech, then renders the page at its URL. */
function renderWithMech(mech: MechDetail) {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(JSON.stringify(mech), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  );
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/mechs/${mech.id}`]}>
        <Routes>
          <Route path="/mechs/:id" element={<MechDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("MechDetailPage tabs are driven by data", () => {
  it("shows only Overview + Skills for a bare Standard mech", async () => {
    renderWithMech(bareMech);
    expect(await screen.findByRole("tab", { name: "Overview" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Skills" })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Weapon" })).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Awaken" })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("tab", { name: "Skins & Helpers" })
    ).not.toBeInTheDocument();
  });

  it("shows all five tabs for a fully-equipped S mech", async () => {
    renderWithMech({
      ...bareMech,
      rank: "S",
      weapon: {
        id: "w1",
        name: "Blade",
        description: null,
        baseStats: null,
        type: null,
        upgrades: [],
        skins: [],
        helpers: [],
      },
      awakeningLevels: [
        {
          id: "a1",
          level: 1,
          statBonus: null,
          specialEffect: null,
          requirement: null,
          nodes: [],
          unlocks: [],
        },
      ],
      skins: [{ id: "s1", name: "Skin", description: null, stars: [] }],
    });
    expect(await screen.findByRole("tab", { name: "Weapon" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Awaken" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Skins & Helpers" })).toBeInTheDocument();
  });
});
