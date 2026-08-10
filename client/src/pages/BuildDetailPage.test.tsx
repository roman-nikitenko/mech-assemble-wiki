import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { MechDetail, MechSummary, PostedBuild, WeaponSummary } from "../api/types";
import { BuildDetailPage } from "./BuildDetailPage";

const mechSummary: MechSummary = {
  id: "m1",
  slug: "iron-colossus",
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
    { id: "s1", parentId: null, name: "Zap", description: "Bolt", appearanceLevel: 1, type: "Normal", sortOrder: 0, repeatable: false, linkedWeaponId: null, linkedMechId: null },
    { id: "s5", parentId: null, name: null, description: "Core power", appearanceLevel: 1, type: "Core", sortOrder: 1, repeatable: false, linkedWeaponId: null, linkedMechId: null },
    { id: "ls1", parentId: null, name: "Frost Synergy", description: "combo", appearanceLevel: 1, type: "Normal", sortOrder: 2, repeatable: false, linkedWeaponId: "w1", linkedMechId: null },
  ],
};

// Two builds that both PICK the linked skill "ls1" (gated on weapon w1); one
// equips w1, the other doesn't — so only the first should show Frost Synergy.
const LINKED_ON: PostedBuild = {
  id: "bon", name: "Combo", description: "", mechId: "m1", weaponId: null,
  skillIds: ["s1", "ls1"], weaponIds: ["w1"], weaponSkillIds: {}, hearts: 0,
  status: "Published", createdAt: "2026-07-20T00:00:00.000Z",
  updatedAt: "2026-07-20T00:00:00.000Z", author: { nickname: null, server: null },
};
const LINKED_OFF: PostedBuild = { ...LINKED_ON, id: "boff", weaponIds: [] };

const weapon: WeaponSummary = {
  id: "w1",
  slug: "blade-of-dawn",
  name: "Blade of Dawn",
  description: null,
  linkedEffect: null,
  tier: "S",
  rankUpPreview: [],
  imageUrl: null,
  iconUrl: null,
  type: null,
  mech: null,
  pilot: null,
  weaponSkins: [],
  skillNodes: [
    { id: "ws1", parentId: null, name: "Slash", description: "Cuts", appearanceLevel: 1, type: "Normal", sortOrder: 0, repeatable: false, linkedWeaponId: null, linkedMechId: null },
    // Weapon-owned linked skill gated on a mech — must stay hidden in a
    // weapon-only build even if it's in the saved skillIds.
    { id: "wls1", parentId: null, name: "Combo Strike", description: "pair bonus", appearanceLevel: 1, type: "Normal", sortOrder: 1, repeatable: false, linkedWeaponId: null, linkedMechId: "m1" },
  ],
};

// A weapon-only build (no mech) that PICKED the weapon's linked skill.
const WEAPON_ONLY: PostedBuild = {
  id: "bwo", name: "Weapon only", description: "", mechId: null, weaponId: "w1",
  skillIds: ["ws1", "wls1"], weaponIds: [], weaponSkillIds: {}, hearts: 0,
  status: "Published", createdAt: "2026-08-10T00:00:00.000Z",
  updatedAt: "2026-08-10T00:00:00.000Z", author: { nickname: null, server: null },
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
  status: "Published",
  createdAt: "2026-07-20T00:00:00.000Z",
  updatedAt: "2026-07-20T00:00:00.000Z",
  author: { nickname: null, server: null },
};

function renderPage(path: string) {
  vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    const url = String(input);
    let body: unknown;
    if (url.match(/\/api\/builds\/b1$/)) body = BUILD;
    else if (url.match(/\/api\/builds\/bon$/)) body = LINKED_ON;
    else if (url.match(/\/api\/builds\/boff$/)) body = LINKED_OFF;
    else if (url.match(/\/api\/builds\/bwo$/)) body = WEAPON_ONLY;
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

  it("shows a picked linked skill when its partner weapon is equipped", async () => {
    renderPage("/builds/bon");
    // Wait for the mech skills to load (the linked skill is one of them).
    expect(await screen.findByText("Frost Synergy", { selector: "span" })).toBeInTheDocument();
  });

  it("drops a picked linked skill when its partner weapon is not equipped", async () => {
    renderPage("/builds/boff");
    // Wait for the mech skills to load (Zap is picked), THEN assert the linked
    // skill is absent because its partner weapon isn't equipped.
    expect(await screen.findByText("Zap", { selector: "span" })).toBeInTheDocument();
    expect(screen.queryByText("Frost Synergy")).not.toBeInTheDocument();
  });

  it("hides a weapon's linked skill in a weapon-only build (no mech to pair)", async () => {
    renderPage("/builds/bwo");
    // The ordinary Slash skill renders; the linked Combo Strike must not.
    expect(await screen.findByText("Slash", { selector: "span" })).toBeInTheDocument();
    expect(screen.queryByText("Combo Strike")).not.toBeInTheDocument();
  });
});
