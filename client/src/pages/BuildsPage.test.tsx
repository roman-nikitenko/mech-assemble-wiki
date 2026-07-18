import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BuildsPage } from "./BuildsPage";
import { saveBuild } from "../profile/buildStorage";
import { saveProfile } from "../profile/profileStorage";
import { formatDate } from "../lib/date";

function renderPage() {
  // mech/weapon lists only decorate the cards — [] is fine
  vi.spyOn(globalThis, "fetch").mockImplementation(() =>
    Promise.resolve(
      new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    )
  );
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={["/builds"]}>
        <Routes>
          <Route path="/builds" element={<BuildsPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe("BuildsPage", () => {
  it("shows the empty state pointing to the profile", () => {
    renderPage();
    expect(screen.getByText(/No builds yet/)).toBeInTheDocument();
  });

  it("lists builds with name link, author, date, note excerpt and a disabled heart", () => {
    saveProfile({ nickname: "BanzaiFun", server: "EU-7" });
    saveBuild({
      id: "b1",
      name: "Zap rush",
      description: "## Plan\nGo **fast** with #[Iron Colossus]",
      mechId: "m1",
      weaponId: null,
      skillIds: [],
      weaponIds: [],
      weaponSkillIds: {},
      hearts: 5,
      createdAt: "2026-07-15T00:00:00.000Z",
      updatedAt: "2026-07-15T00:00:00.000Z",
    });
    renderPage();
    expect(screen.getByRole("link", { name: "Zap rush" })).toHaveAttribute("href", "/builds/b1");
    // markers stripped in the excerpt
    expect(screen.getByText(/Plan Go fast with Iron Colossus/)).toBeInTheDocument();
    // author + hover card (name + server) + update date (saveBuild stamps
    // updatedAt to "now", so assert the label + today's date)
    expect(screen.getAllByText("BanzaiFun").length).toBeGreaterThan(0);
    expect(screen.getByText("Server: EU-7")).toBeInTheDocument();
    const dateLine = screen.getByText(/· updated/);
    expect(dateLine.textContent).toContain(formatDate(new Date().toISOString()));
    const heart = screen.getByRole("button", { name: /♥ 5/ });
    expect(heart).toBeDisabled(); // liking needs accounts (next step)
  });
});
