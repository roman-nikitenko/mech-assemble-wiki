import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AdminAircraftPage } from "./AdminAircraftPage";
import type { Aircraft } from "../../api/types";

const aircraft: Aircraft[] = [
  {
    id: "a1",
    name: "Sky Raider",
    description: null,
    imageUrl: null,
    tier: "Standard",
    hp: null,
    atk: null,
    def: null,
    specialBonus: null,
    rankUpPreview: [],
  },
];

function renderPage() {
  vi.spyOn(globalThis, "fetch").mockImplementation(() =>
    Promise.resolve(
      new Response(JSON.stringify(aircraft), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    )
  );
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <AdminAircraftPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

afterEach(() => vi.restoreAllMocks());

describe("AdminAircraftPage", () => {
  it("lists aircraft with a create button", async () => {
    renderPage();
    expect(await screen.findByText("Sky Raider")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "+ New aircraft" })).toBeInTheDocument();
  });

  it("opens a delete confirmation dialog", async () => {
    renderPage();
    await userEvent.click(await screen.findByRole("button", { name: "Delete" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/can't be undone/)).toBeInTheDocument();
  });

  it("issues a DELETE for the confirmed row", async () => {
    renderPage();
    await userEvent.click(await screen.findByRole("button", { name: "Delete" }));
    await userEvent.click(screen.getByRole("button", { name: "Delete aircraft" }));

    const calls = vi.mocked(globalThis.fetch).mock.calls;
    const del = calls.find(([, init]) => (init as RequestInit | undefined)?.method === "DELETE");
    expect(del).toBeDefined();
    expect(String(del?.[0])).toContain("/api/aircraft/a1");
  });
});
