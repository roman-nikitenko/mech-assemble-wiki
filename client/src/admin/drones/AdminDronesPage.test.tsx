import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AdminDronesPage } from "./AdminDronesPage";
import type { Drone } from "../../api/types";

const drones: Drone[] = [
  {
    id: "d1", name: "Scout Drone", iconUrl: null, tier: "Standard", droneTypeId: null,
    inheritAttack: null, atk: null, hp: null, def: null, previewVideoUrl: null, levelUpBonuses: [],
  },
];

function renderPage() {
  vi.spyOn(globalThis, "fetch").mockImplementation(() =>
    Promise.resolve(
      new Response(JSON.stringify(drones), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    )
  );
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <AdminDronesPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

afterEach(() => vi.restoreAllMocks());

describe("AdminDronesPage", () => {
  it("lists drones with a create button", async () => {
    renderPage();
    expect(await screen.findByText("Scout Drone")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "+ New drone" })).toBeInTheDocument();
  });

  it("opens a delete confirmation dialog", async () => {
    renderPage();
    await userEvent.click(await screen.findByRole("button", { name: "Delete" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/can't be undone/)).toBeInTheDocument();
  });
});
