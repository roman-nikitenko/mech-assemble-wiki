import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Aircraft, AircraftAttributeGroup, Drone, DroneType, MechDetail, MechSummary, PostedBuild, WeaponSummary } from "../api/types";
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
    { id: "s1", parentId: null, name: "Zap", description: "Bolt", appearanceLevel: 1, type: "Normal", sortOrder: 0, repeatable: false, linkedWeaponId: null, linkedMechId: null, initialAtTier: null },
    { id: "s5", parentId: null, name: null, description: "Core power", appearanceLevel: 1, type: "Core", sortOrder: 1, repeatable: false, linkedWeaponId: null, linkedMechId: null, initialAtTier: null },
    { id: "ls1", parentId: null, name: "Frost Synergy", description: "combo", appearanceLevel: 1, type: "Normal", sortOrder: 2, repeatable: false, linkedWeaponId: "w1", linkedMechId: null, initialAtTier: null },
    { id: "qg1", parentId: null, name: "Freeze", description: "freeze", appearanceLevel: 1, type: "Normal", sortOrder: 3, repeatable: false, linkedWeaponId: null, linkedMechId: null, initialAtTier: "Gold" },
  ],
};

// Builds that reach (or don't) the Gold tier that pre-grants the "Freeze" node.
const GRANT_ON: PostedBuild = {
  id: "bgon", name: "Golden", description: "", mechId: "m1", weaponId: null,
  skillIds: [], weaponIds: [], weaponSkillIds: {}, hearts: 0, quality: "Gold", weaponQualities: {}, moduleSelections: {}, droneSelections: {},
  aircraftSelections: {},
  status: "Published", createdAt: "2026-08-12T00:00:00.000Z",
  updatedAt: "2026-08-12T00:00:00.000Z", author: { nickname: null, server: null },
};
const GRANT_OFF: PostedBuild = { ...GRANT_ON, id: "bgoff", quality: "Blue" };

// Drone catalog + a build with one Battle drone equipped in slot 1.
const droneTypes: DroneType[] = [
  { id: "dt1", name: "Battle", iconUrl: null },
  { id: "dt2", name: "Bombardment", iconUrl: null },
  { id: "dt3", name: "Support", iconUrl: null },
];
const drones: Drone[] = [
  {
    id: "d1", name: "Buzz", iconUrl: null, tier: "S", droneTypeId: "dt1",
    inheritAttack: null, atk: null, hp: null, def: null,
    previewVideoUrl: null, levelUpBonuses: [],
  },
];
const WITH_DRONES: PostedBuild = {
  ...GRANT_ON,
  id: "bdr",
  droneSelections: { "0": { droneId: "d1", quality: 7 } },
};

// Two builds that both PICK the linked skill "ls1" (gated on weapon w1); one
// equips w1, the other doesn't — so only the first should show Frost Synergy.
const LINKED_ON: PostedBuild = {
  id: "bon", name: "Combo", description: "", mechId: "m1", weaponId: null,
  skillIds: ["s1", "ls1"], weaponIds: ["w1"], weaponSkillIds: {}, hearts: 0, quality: "Blue", weaponQualities: {}, moduleSelections: {}, droneSelections: {},
  aircraftSelections: {},
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
    { id: "ws1", parentId: null, name: "Slash", description: "Cuts", appearanceLevel: 1, type: "Normal", sortOrder: 0, repeatable: false, linkedWeaponId: null, linkedMechId: null, initialAtTier: null },
    // Weapon-owned linked skill gated on a mech — must stay hidden in a
    // weapon-only build even if it's in the saved skillIds.
    { id: "wls1", parentId: null, name: "Combo Strike", description: "pair bonus", appearanceLevel: 1, type: "Normal", sortOrder: 1, repeatable: false, linkedWeaponId: null, linkedMechId: "m1", initialAtTier: null },
  ],
};

// A weapon-only build (no mech) that PICKED the weapon's linked skill.
const WEAPON_ONLY: PostedBuild = {
  id: "bwo", name: "Weapon only", description: "", mechId: null, weaponId: "w1",
  skillIds: ["ws1", "wls1"], weaponIds: [], weaponSkillIds: {}, hearts: 0, quality: "Blue", weaponQualities: {}, moduleSelections: {}, droneSelections: {},
  aircraftSelections: {},
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
  hearts: 0, quality: "Blue", weaponQualities: {}, moduleSelections: {}, droneSelections: {},
  aircraftSelections: {},
  status: "Published",
  createdAt: "2026-07-20T00:00:00.000Z",
  updatedAt: "2026-07-20T00:00:00.000Z",
  author: { nickname: null, server: null },
};

const aircraftCatalog: Aircraft[] = [
  {
    id: "a1", name: "Sky Fang", description: null, imageUrl: null, tier: "S",
    hp: null, atk: null, def: null, specialBonus: null, rankUpPreview: [],
  },
];

const aircraftAttrs: AircraftAttributeGroup[] = [
  {
    id: "g1", name: "Element DMG", unit: "Percent",
    q1Max: 5, q8Max: 80, q13Max: 100, sortOrder: 1,
    attributes: [{ id: "attr1", name: "Thunder DMG", sortOrder: 1 }],
  },
];

// Points at an aircraft the catalog no longer has (deleted from the wiki).
const GHOST_AIRCRAFT: PostedBuild = {
  ...BUILD,
  id: "bghost",
  aircraftSelections: {
    "0": { aircraftId: "deleted-1", quality: "Gold", resetSlots: {} },
  },
};

const WITH_AIRCRAFT: PostedBuild = {
  ...BUILD,
  id: "bair",
  aircraftSelections: {
    "0": {
      aircraftId: "a1",
      quality: "Mythic",
      resetSlots: { "0": { attributeId: "attr1", grade: "SS" } },
    },
  },
};

function renderPage(path: string) {
  vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    const url = String(input);
    let body: unknown;
    if (url.match(/\/api\/builds\/b1$/)) body = BUILD;
    else if (url.match(/\/api\/builds\/bon$/)) body = LINKED_ON;
    else if (url.match(/\/api\/builds\/boff$/)) body = LINKED_OFF;
    else if (url.match(/\/api\/builds\/bwo$/)) body = WEAPON_ONLY;
    else if (url.match(/\/api\/builds\/bgon$/)) body = GRANT_ON;
    else if (url.match(/\/api\/builds\/bgoff$/)) body = GRANT_OFF;
    else if (url.match(/\/api\/builds\/nope$/)) {
      return new Response(JSON.stringify({ error: "Build not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    else if (url.match(/\/api\/builds\/bdr$/)) body = WITH_DRONES;
    else if (url.match(/\/api\/builds\/bair$/)) body = WITH_AIRCRAFT;
    else if (url.match(/\/api\/builds\/bghost$/)) body = GHOST_AIRCRAFT;
    else if (url.includes("/api/mechs/m1")) body = mechDetail;
    else if (url.includes("/api/weapons")) body = [weapon];
    // "/api/aircraft" also matches "/api/aircraft-attributes", so the more
    // specific path is tested first.
    else if (url.includes("/api/aircraft-attributes")) body = aircraftAttrs;
    else if (url.includes("/api/aircraft")) body = aircraftCatalog;
    else if (url.includes("/api/drone-types")) body = droneTypes;
    else if (url.includes("/api/drones")) body = drones;
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
  it("shows the equipped drones read-only, with no picker or quality dropdown", async () => {
    renderPage("/builds/bdr");
    expect(await screen.findByRole("heading", { name: "Drones" })).toBeInTheDocument();
    // The equipped drone fills its square (the name rides on the title, since
    // the square itself is icon-only)…
    expect(screen.getByTitle("Buzz")).toBeInTheDocument();
    // …but nothing on this page is editable.
    expect(screen.queryByRole("button", { name: /Add a .* drone to slot/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Drone slot 1 quality" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Remove Buzz/ })).not.toBeInTheDocument();
    // The quality name is dropped on review — the gem alone carries it.
    expect(screen.queryByText("Mythic")).not.toBeInTheDocument();
  });

  it("opens the full drone card in a modal from the slot's info button", async () => {
    renderPage("/builds/bdr");
    await screen.findByRole("heading", { name: "Drones" });
    // Nothing is open until the info button is pressed.
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "More about Buzz" }));
    const dialog = await screen.findByRole("dialog");
    // The same card the Drones browse page renders.
    expect(within(dialog).getByRole("heading", { name: /Buzz/ })).toBeInTheDocument();

    // The page behind the modal must not scroll while it's open.
    expect(document.body.style.overflow).toBe("hidden");

    await userEvent.click(within(dialog).getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    // …and gets its scrolling back on close.
    expect(document.body.style.overflow).toBe("");
  });

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

  it("shows a quality-granted skill when the build reaches its tier", async () => {
    renderPage("/builds/bgon");
    expect(await screen.findByText("Freeze", { selector: "span" })).toBeInTheDocument();
  });

  it("hides a quality-granted skill below its tier", async () => {
    renderPage("/builds/bgoff");
    await screen.findByRole("heading", { level: 1, name: "Golden" });
    expect(screen.queryByText("Freeze")).not.toBeInTheDocument();
  });

  it("renders the aircraft and its reset rolls read-only", async () => {
    renderPage("/builds/bair");
    expect(await screen.findByRole("heading", { level: 2, name: "Aircraft" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "More about Sky Fang" })).toBeInTheDocument();
    expect(screen.getByText("Thunder DMG")).toBeInTheDocument();
    // SS runs from the Q8 cap to the Q13 cap — an exact band, no "~" marker.
    expect(screen.getByText("80 – 100%")).toBeInTheDocument();
    expect(screen.getAllByRole("img", { name: "SS" }).length).toBeGreaterThan(0);
    // Read-only: no editing controls anywhere.
    expect(screen.queryByRole("button", { name: "Reset effect 1 attribute" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Aircraft quality" })).not.toBeInTheDocument();
  });

  it("omits the aircraft section when the build has none", async () => {
    renderPage("/builds/b1");
    await screen.findByRole("heading", { level: 1, name: "Zap rush" });
    expect(screen.queryByRole("heading", { level: 2, name: "Aircraft" })).not.toBeInTheDocument();
  });

  it("omits the section when the equipped aircraft no longer exists", async () => {
    // A dangling id would otherwise render a bare "Aircraft" heading with
    // nothing under it, since the id resolves to no aircraft.
    renderPage("/builds/bghost");
    await screen.findByRole("heading", { level: 1, name: "Zap rush" });
    // waitFor, not a bare assertion: the section is deliberately shown while the
    // catalog is still fetching (better than flickering), so its absence is only
    // meaningful once that request has resolved.
    await waitFor(() =>
      expect(screen.queryByRole("heading", { level: 2, name: "Aircraft" })).not.toBeInTheDocument()
    );
  });
});
