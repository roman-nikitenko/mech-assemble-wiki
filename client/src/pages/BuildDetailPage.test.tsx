import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { MechDetail, MechSummary, PostedBuild, WeaponSummary } from "../api/types";
import { BuildDetailPage } from "./BuildDetailPage";

const auth0State = vi.hoisted(() => ({
  isAuthenticated: false,
  isLoading: false,
  user: undefined as { sub?: string; nickname?: string } | undefined,
  loginWithRedirect: vi.fn(),
  logout: vi.fn(),
  getAccessTokenSilently: vi.fn().mockResolvedValue("fake-token"),
}));

vi.mock("@auth0/auth0-react", () => ({
  useAuth0: () => auth0State,
  Auth0Provider: ({ children }: { children: React.ReactNode }) => children,
}));

const mechSummary: MechSummary = {
  id: "m1",
  name: "Iron Colossus",
  epithet: null,
  type: null,
  rank: "Standard",
  imageUrl: null,
};

const mechDetail: MechDetail = {
  ...mechSummary,
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
    { id: "s1", parentId: null, name: "Zap", description: "Bolt", appearanceLevel: 1, type: "Normal", sortOrder: 0, repeatable: false },
    { id: "s5", parentId: null, name: null, description: "Core power", appearanceLevel: 1, type: "Core", sortOrder: 1, repeatable: false },
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
    { id: "ws1", parentId: null, name: "Slash", description: "Cuts", appearanceLevel: 1, type: "Normal", sortOrder: 0, repeatable: false },
  ],
};

const BUILD: PostedBuild = {
  id: "b1",
  name: "Zap rush",
  description: "## Strategy\nOpen with **Zap** on #[Iron Colossus]",
  mechId: "m1",
  weaponId: null,
  skillIds: ["s1", "s5"],
  weaponIds: ["w1"],
  weaponSkillIds: { w1: ["ws1"] },
  hearts: 0,
  createdAt: "2026-07-20T00:00:00.000Z",
  updatedAt: "2026-07-20T00:00:00.000Z",
  author: { nickname: null, server: null },
};

function renderPage(path: string) {
  vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    const url = String(input);
    let body: unknown;
    if (url.endsWith("/api/me")) body = { id: "u1", nickname: "Tester", server: "", isNew: false };
    else if (url.match(/\/api\/builds\/b1$/)) body = BUILD;
    else if (url.match(/\/api\/builds\/nope$/)) {
      return new Response(JSON.stringify({ error: "Build not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    else if (url.includes("/api/mechs/m1")) body = mechDetail;
    else if (url.includes("/api/weapons")) body = [weapon];
    else body = [mechSummary];
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

beforeEach(() => {
  auth0State.isAuthenticated = false;
});
afterEach(() => vi.restoreAllMocks());

describe("BuildDetailPage", () => {
  it("shows a friendly state for an unknown build id", async () => {
    renderPage("/builds/nope");
    expect(await screen.findByText("Build not found.")).toBeInTheDocument();
  });

  it("renders a mech build: title, core skills, picked skills, weapon skills, note", async () => {
    renderPage("/builds/b1");
    expect(await screen.findByRole("heading", { level: 1, name: "Zap rush" })).toBeInTheDocument();
    // author falls back to Anonymous until a nickname is set
    expect(screen.getAllByText("Anonymous").length).toBeGreaterThan(0);
    expect(await screen.findByText("Core skill")).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Iron Colossus skills" })).toBeInTheDocument();
    expect(screen.getByText("Zap", { selector: "span" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Blade of Dawn skills" })).toBeInTheDocument();
    expect(screen.getByText("Slash")).toBeInTheDocument();
    // note heading and bold rendered through the markup pipeline
    expect(screen.getByRole("heading", { level: 2, name: "Strategy" })).toBeInTheDocument();
    expect(screen.getByText("Zap", { selector: "strong" })).toBeInTheDocument();
  });
});
