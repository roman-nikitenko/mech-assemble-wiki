import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ChipsPage } from "./ChipsPage";
import type { Chip } from "../api/types";

const effect = (text: string, chance: number, mode: Chip["qualities"][0]["pools"][0]["effects"][0]["mode"] = "All modes") => ({ text, mode, chance });
const mk = (category: Chip["category"]): Chip => ({
  id: category,
  name: `[${category}] Chip`,
  category,
  createdAt: "2026-01-01T00:00:00.000Z",
  qualities: [
    {
      quality: 5,
      baseStats: ["HP +6,000", "HP +4%"],
      composeNext: 3,
      resetCost: "Chip Refiner ×50",
      pools: [
        { kind: "Base stat", chance: 76, effects: [effect("ATK +15%", 5.56, "PvP only")] },
        { kind: "Overclock skill", chance: 2, effects: [effect("Emergency Repair", 100, "PvE only")] },
      ],
    },
    { quality: 13, baseStats: ["HP +45,000"], composeNext: null, resetCost: null, pools: [] },
  ],
});

function Where() {
  const l = useLocation();
  return <p data-testid="where">{l.search}</p>;
}

function renderAt(url = "/chips", chips: Chip[] = [mk("Head"), mk("Legs")]) {
  vi.spyOn(globalThis, "fetch").mockImplementation(() =>
    Promise.resolve(new Response(JSON.stringify(chips), { status: 200, headers: { "Content-Type": "application/json" } })),
  );
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[url]}>
        <ChipsPage />
        <Where />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

afterEach(() => vi.restoreAllMocks());

describe("ChipsPage", () => {
  it("opens on Head + Rare and shows stats, compose and pool odds", async () => {
    renderAt();
    expect(await screen.findByText("HP +6,000")).toBeInTheDocument();
    expect(screen.getByText("3 identical → 1 Epic")).toBeInTheDocument();
    expect(screen.getByText("Chip Refiner ×50")).toBeInTheDocument();
    // overall chance = pool chance x effect chance: 76% x 5.56% = 4.23%
    expect(screen.getByText("4.23%")).toBeInTheDocument();
    expect(screen.getByText("PvP only")).toBeInTheDocument();
    expect(screen.getByText("Emergency Repair")).toBeInTheDocument();
  });

  it("only shows tabs for parts that have a chip", async () => {
    renderAt();
    await screen.findByText("HP +6,000");
    const tabs = within(screen.getByRole("tablist")).getAllByRole("tab");
    expect(tabs.map((t) => t.textContent)).toEqual(["Head", "Legs"]);
  });

  it("switches quality and part, and keeps the choice in the URL", async () => {
    renderAt();
    await screen.findByText("HP +6,000");
    await userEvent.click(screen.getByRole("button", { name: "Supreme" }));
    expect(screen.getByText("Max quality")).toBeInTheDocument();
    expect(screen.getByTestId("where")).toHaveTextContent("q=13");
    await userEvent.click(screen.getByRole("tab", { name: "Legs" }));
    expect(screen.getByTestId("where")).toHaveTextContent("part=legs");
  });

  it("restores the view from the URL", async () => {
    renderAt("/chips?part=legs&q=13");
    expect(await screen.findByText("[Legs] Chip")).toBeInTheDocument();
    expect(screen.getByText("Max quality")).toBeInTheDocument();
  });

  it("moves between tabs with the arrow keys", async () => {
    renderAt();
    await screen.findByText("HP +6,000");
    screen.getByRole("tab", { name: "Head" }).focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Legs" })).toHaveAttribute("aria-selected", "true");
  });

  it("says so when a quality has no data", async () => {
    renderAt("/chips?q=3");
    expect(await screen.findByText(/No data yet for Fine/)).toBeInTheDocument();
  });

  it("shows a friendly message when there are no chips", async () => {
    renderAt("/chips", []);
    expect(await screen.findByText("No chips recorded yet.")).toBeInTheDocument();
  });
});
