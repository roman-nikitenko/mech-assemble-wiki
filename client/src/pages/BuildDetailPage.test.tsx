import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { MechDetail, MechSummary, WeaponSummary } from "../api/types";
import { BuildDetailPage } from "./BuildDetailPage";
import { saveBuild } from "../profile/buildStorage";

const summary: MechSummary = {
  id: "m1",
  name: "Iron Colossus",
  epithet: null,
  type: null,
  rank: "Standard",
  imageUrl: null,
};

const detail: MechDetail = {
  ...summary,
  iconUrl: null,
  cardSkillIconUrl: null,
  specialBonus: null,
  lore: null,
  rankUpPreview: [],
  skills: [],
  traits: [],
  awakeningLevels: [],
  weapon: null,
  accessory: null,
  pilot: null,
  skins: [],
  helpers: [],
  skillNodes: [
    { id: "s1", parentId: null, name: "Zap", description: "Bolt", appearanceLevel: 1, type: "Normal", sortOrder: 0 },
    { id: "s5", parentId: null, name: null, description: "Core power", appearanceLevel: 1, type: "Core", sortOrder: 1 },
  ],
};

const weapon: WeaponSummary = {
  id: "w1",
  name: "Blade of Dawn",
  description: null,
  tier: "S",
  rankUpPreview: [],
  imageUrl: null,
  iconUrl: null,
  type: null,
  mech: null,
  pilot: null,
  weaponSkins: [],
  skillNodes: [
    { id: "ws1", parentId: null, name: "Slash", description: "Cuts", appearanceLevel: 1, type: "Normal", sortOrder: 0 },
  ],
};

function renderPage(path: string) {
  vi.spyOn(globalThis, "fetch").mockImplementation((input) => {
    const url = String(input);
    let body: unknown;
    if (url.includes("/api/mechs/m1")) body = detail;
    else if (url.includes("/api/weapons")) body = [weapon];
    else body = [summary];
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
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/builds/:buildId" element={<BuildDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe("BuildDetailPage", () => {
  it("shows a friendly state for an unknown build", () => {
    renderPage("/builds/nope");
    expect(screen.getByText("Build not found in this browser.")).toBeInTheDocument();
  });

  it("renders a mech build: title, core skills, picked skills, weapon skills, note", async () => {
    saveBuild({
      id: "b1",
      name: "Zap rush",
      description: "## Strategy\nOpen with **Zap** on #[Iron Colossus]",
      mechId: "m1",
      weaponId: null,
      skillIds: ["s1", "s5"],
      weaponIds: ["w1"],
      weaponSkillIds: { w1: ["ws1"] },
      hearts: 0,
      createdAt: "2026-07-15T00:00:00.000Z",
      updatedAt: "2026-07-15T00:00:00.000Z",
    });
    renderPage("/builds/b1");
    expect(screen.getByRole("heading", { level: 1, name: "Zap rush" })).toBeInTheDocument();
    // author falls back to Anonymous until a nickname is set in Settings
    expect(screen.getAllByText("Anonymous").length).toBeGreaterThan(0);
    // core pool, mech picks (only the picked ones, no palette), weapon picks
    expect(await screen.findByText("Core skill")).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Iron Colossus skills" })).toBeInTheDocument();
    // the slot card's name band is a span; the note's bold "Zap" is a <strong>
    expect(screen.getByText("Zap", { selector: "span" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Blade of Dawn skills" })).toBeInTheDocument();
    expect(screen.getByText("Slash")).toBeInTheDocument();
    // the note renders through the markup pipeline
    expect(screen.getByRole("heading", { level: 2, name: "Strategy" })).toBeInTheDocument();
    expect(screen.getByText("Zap", { selector: "strong" })).toBeInTheDocument();
  });
});
