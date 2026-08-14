import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AdminWeaponsPage } from "./AdminWeaponsPage";
import type { WeaponSummary } from "../../api/types";

const weapons: WeaponSummary[] = [
  {
    id: "w1",
    slug: "ninja-spikes-gun",
    name: "Ninja Spikes Gun",
    description: null,
    linkedEffect: null,
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
  {
    id: "w2",
    slug: "frost-cannon",
    name: "Frost Cannon",
    description: null,
    linkedEffect: null,
    tier: "Standard",
    rankUpPreview: [],
    imageUrl: null,
    iconUrl: null,
    type: null,
    mech: null,
    pilot: null,
    weaponSkins: [],
    skillNodes: [],
  },
];

function renderPage() {
  // Branch by URL so the type-filter fetch (/api/types) stays empty instead of
  // echoing the weapon list back as fake types.
  vi.spyOn(globalThis, "fetch").mockImplementation((input) => {
    const url = String(input);
    const body = url.includes("/api/weapons") ? weapons : [];
    return Promise.resolve(
      new Response(JSON.stringify(body), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
  });
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
    // The S-tier badge in the row (scoped to the table — the tier filter button
    // in the header also renders an S-tier icon).
    expect(within(screen.getByRole("table")).getByLabelText("S-tier")).toBeInTheDocument();
    expect(screen.getByText("Ninja")).toBeInTheDocument();
    expect(screen.getByText("Darren")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "+ New weapon" })).toBeInTheDocument();
  });

  it("filters the list by name search", async () => {
    renderPage();
    expect(await screen.findByText("Ninja Spikes Gun")).toBeInTheDocument();
    expect(screen.getByText("Frost Cannon")).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText("Search by name"), "frost");
    expect(screen.queryByText("Ninja Spikes Gun")).not.toBeInTheDocument();
    expect(screen.getByText("Frost Cannon")).toBeInTheDocument();
  });
});
