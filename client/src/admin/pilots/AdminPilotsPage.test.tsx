import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AdminPilotsPage } from "./AdminPilotsPage";
import type { Pilot } from "../../api/types";

const pilots: Pilot[] = [
  {
    id: "p1",
    name: "Kael",
    unlockBoost: "ATK +5%",
    relationshipBonus: null,
    bonusPerLevel: ["HP +2%"],
    iconUrl: null,
    backgroundUrl: null,
    mech: { id: "m1", name: "Shadow Warrior", rank: "S" },
    weapon: null,
  },
];

function renderPage() {
  vi.spyOn(globalThis, "fetch").mockImplementation(() =>
    Promise.resolve(
      new Response(JSON.stringify(pilots), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    )
  );
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <AdminPilotsPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

afterEach(() => vi.restoreAllMocks());

describe("AdminPilotsPage", () => {
  it("lists pilots with their linked mech", async () => {
    renderPage();
    expect(await screen.findByText("Kael")).toBeInTheDocument();
    expect(screen.getByText("Shadow Warrior")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "+ New pilot" })).toBeInTheDocument();
  });

  it("delete confirm reassures that the mech is not affected", async () => {
    renderPage();
    await userEvent.click(await screen.findByRole("button", { name: "Delete" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/mech is NOT affected/)).toBeInTheDocument();
  });
});
