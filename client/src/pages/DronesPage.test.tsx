import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DronesPage } from "./DronesPage";
import type { Drone, DroneType } from "../api/types";

const droneTypes: DroneType[] = [
  { id: "dt-fire", name: "Fire", iconUrl: null },
  { id: "dt-ice", name: "Ice", iconUrl: null },
];

const base = {
  iconUrl: null, inheritAttack: null, atk: null, hp: null, def: null,
  previewVideoUrl: null, levelUpBonuses: [] as string[],
};
const drones: Drone[] = [
  { ...base, id: "d1", name: "Scout", tier: "Standard", droneTypeId: "dt-fire" },
  { ...base, id: "d2", name: "Hunter", tier: "S", droneTypeId: "dt-ice" },
];

function renderPage() {
  vi.spyOn(globalThis, "fetch").mockImplementation((input) => {
    const url = String(input);
    const body = url.endsWith("/api/drone-types") ? droneTypes : url.endsWith("/api/drones") ? drones : [];
    return Promise.resolve(
      new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } })
    );
  });
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <DronesPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

afterEach(() => vi.restoreAllMocks());

describe("DronesPage", () => {
  it("lists all drones", async () => {
    renderPage();
    expect(await screen.findByText("Scout")).toBeInTheDocument();
    expect(screen.getByText("Hunter")).toBeInTheDocument();
  });

  it("filters by name", async () => {
    renderPage();
    await screen.findByText("Scout");
    await userEvent.type(screen.getByPlaceholderText("Search drones..."), "hun");
    expect(screen.queryByText("Scout")).not.toBeInTheDocument();
    expect(screen.getByText("Hunter")).toBeInTheDocument();
  });

  it("filters by drone type", async () => {
    renderPage();
    await screen.findByText("Scout");
    await userEvent.click(screen.getByRole("button", { name: "Fire" }));
    expect(screen.getByText("Scout")).toBeInTheDocument();
    expect(screen.queryByText("Hunter")).not.toBeInTheDocument();
  });

  it("filters by tier, one at a time, clearing on a second click", async () => {
    renderPage();
    await screen.findByText("Scout");
    const standard = screen.getByRole("button", { name: "Standard tier" });
    const sTier = screen.getByRole("button", { name: "S tier" });

    await userEvent.click(standard);
    expect(screen.getByText("Scout")).toBeInTheDocument();
    expect(screen.queryByText("Hunter")).not.toBeInTheDocument();
    expect(standard).toHaveAttribute("aria-pressed", "true");

    // The tiers are mutually exclusive — picking S drops Standard.
    await userEvent.click(sTier);
    expect(screen.queryByText("Scout")).not.toBeInTheDocument();
    expect(screen.getByText("Hunter")).toBeInTheDocument();
    expect(standard).toHaveAttribute("aria-pressed", "false");
    expect(sTier).toHaveAttribute("aria-pressed", "true");

    // Clicking the active one again clears the filter.
    await userEvent.click(sTier);
    expect(screen.getByText("Scout")).toBeInTheDocument();
    expect(screen.getByText("Hunter")).toBeInTheDocument();
    expect(sTier).toHaveAttribute("aria-pressed", "false");
  });

  it("combines the tier filter with the type filter", async () => {
    renderPage();
    await screen.findByText("Scout");
    // Fire holds only the Standard drone, so Fire + S-tier matches nothing.
    await userEvent.click(screen.getByRole("button", { name: "S tier" }));
    await userEvent.click(screen.getByRole("button", { name: "Fire" }));
    expect(screen.queryByText("Scout")).not.toBeInTheDocument();
    expect(screen.queryByText("Hunter")).not.toBeInTheDocument();
    expect(screen.getByText("No drones match.")).toBeInTheDocument();
  });
});
