import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WeaponDetailPage } from "./WeaponDetailPage";
import type { WeaponDetail } from "../api/types";

const weapon: WeaponDetail = {
  id: "22222222-2222-4222-8222-222222222222",
  name: "Doom Cannon",
  description: "Big boom.",
  baseStats: { ATK: 100 },
  tier: "S",
  rankUpPreview: ["DMG +30%"],
  imageUrl: null,
  iconUrl: null,
  type: { id: "t1", name: "Plasma", iconUrl: null },
  mech: { id: "m1", name: "Owner Mech" },
  pilot: { id: "p1", name: "Kael" },
  weaponSkins: [{ id: "s1", name: "Gold", bonuses: ["ATK +2%"], imageUrl: null }],
  helpers: [
    { id: "h1", name: "Buddy", passiveEffect: "helps", ranks: [{ id: "r1", rank: 1, effect: "+1" }] },
  ],
  skillNodes: [
    {
      id: "n1",
      parentId: null,
      name: "Root",
      description: "root skill",
      appearanceLevel: 1,
      type: "Normal",
      sortOrder: 0,
      repeatable: false,
    },
  ],
};

function renderPage(status: number, body: unknown, id = weapon.id) {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    })
  );
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/weapons/${id}`]}>
        <Routes>
          <Route path="/weapons/:id" element={<WeaponDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

afterEach(() => vi.restoreAllMocks());

describe("WeaponDetailPage", () => {
  it("renders the weapon header and kit sections", async () => {
    renderPage(200, weapon);
    expect(await screen.findByRole("heading", { name: "Doom Cannon", level: 1 })).toBeInTheDocument();
    const ownerLink = await screen.findByRole("link", { name: /Owner Mech/ });
    expect(ownerLink).toHaveAttribute("href", "/mechs/m1");
    expect(screen.getByText("Skills")).toBeInTheDocument();
    expect(screen.getByText("Skins")).toBeInTheDocument();
    expect(screen.getByText("Weapon helpers")).toBeInTheDocument();
  });

  it("shows a not-found message on 404", async () => {
    renderPage(404, { error: "Weapon not found" });
    expect(await screen.findByText("Weapon not found")).toBeInTheDocument();
  });
});
