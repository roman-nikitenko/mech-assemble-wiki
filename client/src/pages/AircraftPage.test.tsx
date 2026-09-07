import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AircraftPage } from "./AircraftPage";
import type { Aircraft } from "../api/types";

const base = {
  description: null,
  imageUrl: null,
  hp: null,
  atk: null,
  def: null,
  specialBonus: null,
  rankUpPreview: [] as string[],
};
const aircraft: Aircraft[] = [
  { ...base, id: "a1", name: "Sky Raider", tier: "Standard" },
  { ...base, id: "a2", name: "Storm Wing", tier: "S" },
];

function renderPage() {
  vi.spyOn(globalThis, "fetch").mockImplementation((input) => {
    const url = String(input);
    const body = url.endsWith("/api/aircraft") ? aircraft : [];
    return Promise.resolve(
      new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } })
    );
  });
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <AircraftPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

afterEach(() => vi.restoreAllMocks());

describe("AircraftPage", () => {
  it("lists all aircraft", async () => {
    renderPage();
    expect(await screen.findByText("Sky Raider")).toBeInTheDocument();
    expect(screen.getByText("Storm Wing")).toBeInTheDocument();
  });

  it("filters by name", async () => {
    renderPage();
    await screen.findByText("Sky Raider");
    await userEvent.type(screen.getByPlaceholderText("Search aircraft..."), "storm");
    expect(screen.queryByText("Sky Raider")).not.toBeInTheDocument();
    expect(screen.getByText("Storm Wing")).toBeInTheDocument();
  });

  it("filters by tier, one at a time, clearing on a second click", async () => {
    renderPage();
    await screen.findByText("Sky Raider");
    const standard = screen.getByRole("button", { name: "Standard tier" });
    const sTier = screen.getByRole("button", { name: "S tier" });

    await userEvent.click(standard);
    expect(screen.getByText("Sky Raider")).toBeInTheDocument();
    expect(screen.queryByText("Storm Wing")).not.toBeInTheDocument();
    expect(standard).toHaveAttribute("aria-pressed", "true");

    // The tiers are mutually exclusive — picking S drops Standard.
    await userEvent.click(sTier);
    expect(screen.queryByText("Sky Raider")).not.toBeInTheDocument();
    expect(screen.getByText("Storm Wing")).toBeInTheDocument();
    expect(standard).toHaveAttribute("aria-pressed", "false");

    // Clicking the active one again clears the filter.
    await userEvent.click(sTier);
    expect(screen.getByText("Sky Raider")).toBeInTheDocument();
    expect(screen.getByText("Storm Wing")).toBeInTheDocument();
    expect(sTier).toHaveAttribute("aria-pressed", "false");
  });

  it("shows a message when nothing matches", async () => {
    renderPage();
    await screen.findByText("Sky Raider");
    await userEvent.type(screen.getByPlaceholderText("Search aircraft..."), "zzz");
    expect(screen.getByText("No aircraft match.")).toBeInTheDocument();
  });
});
