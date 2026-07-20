import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AdminWeaponsPage } from "./AdminWeaponsPage";
import type { WeaponSummary } from "../../api/types";

const weapons: WeaponSummary[] = [
  {
    id: "w1",
    name: "Ninja Spikes Gun",
    description: null,
    tier: "S",
    rankUpPreview: [],
    imageUrl: null,
    iconUrl: null,
    type: null,
    mech: { id: "m1", name: "Ninja" },
    pilot: { id: "p1", name: "Darren" },
    weaponSkins: [],
    skillNodes: [],
  },
];

function renderPage() {
  vi.spyOn(globalThis, "fetch").mockImplementation(() =>
    Promise.resolve(
      new Response(JSON.stringify(weapons), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    )
  );
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <AdminWeaponsPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

afterEach(() => vi.restoreAllMocks());

describe("AdminWeaponsPage", () => {
  it("lists weapons with tier, owner, and pilot", async () => {
    renderPage();
    expect(await screen.findByText("Ninja Spikes Gun")).toBeInTheDocument();
    expect(screen.getByText("S")).toBeInTheDocument();
    expect(screen.getByText("Ninja")).toBeInTheDocument();
    expect(screen.getByText("Darren")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "+ New weapon" })).toBeInTheDocument();
  });
});
