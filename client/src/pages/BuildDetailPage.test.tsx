import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Aircraft, AircraftAttributeGroup, AwakeningLevel, Drone, DroneType, MechDetail, MechSummary, PostedBuild, WeaponSummary } from "../api/types";
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

const awakeningLevel = (n: number, over: Partial<AwakeningLevel> = {}): AwakeningLevel => ({
  id: `lv${n}`, level: n, isLive: true, coreAttr: [], coreSkill: null, coreInfo: null,
  coreCd: [], corePower: null, coreLuckyId: null, coreReward: null, coreSkin: null, nodes: [],
  ...over,
});

const mechDetail: MechDetail = {
  ...mechSummary,
  iconUrl: null,
  cardSkillIconUrl: null,
  specialBonus: null,
  lore: null,
  rankUpPreview: [],
  skills: [],
  traits: [],
  awakeningLevels: [
    awakeningLevel(1, { coreAttr: ["HP +5%", "ATK +5%", "DEF +5%"], coreSkill: "DMG from Mechs -50%" }),
    awakeningLevel(2, { coreAttr: ["HP +5%", "ATK +5%", "DEF +5%"], coreSkill: "Fatal Blade" }),
    awakeningLevel(3, { coreAttr: ["HP +8%", "ATK +8%", "DEF +8%"], coreSkill: "Poisoned Shuriken" }),
  ],
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
    // A Zap → Chain Bolt → Storm Call chain, a second root, and a child of the
    // quality-granted Freeze — for the family layout test.
    { id: "s2", parentId: "s1", name: "Chain Bolt", description: "chain", appearanceLevel: 1, type: "Normal", sortOrder: 4, repeatable: false, linkedWeaponId: null, linkedMechId: null, initialAtTier: null },
    { id: "s3", parentId: "s2", name: "Storm Call", description: "storm", appearanceLevel: 1, type: "Normal", sortOrder: 5, repeatable: false, linkedWeaponId: null, linkedMechId: null, initialAtTier: null },
    { id: "s4", parentId: null, name: "Spark", description: "spark", appearanceLevel: 1, type: "Normal", sortOrder: 6, repeatable: false, linkedWeaponId: null, linkedMechId: null, initialAtTier: null },
    { id: "fz1", parentId: "qg1", name: "Shatter", description: "shatter", appearanceLevel: 1, type: "Normal", sortOrder: 7, repeatable: false, linkedWeaponId: null, linkedMechId: null, initialAtTier: null },
  ],
};

// Builds that reach (or don't) the Gold tier that pre-grants the "Freeze" node.
const GRANT_ON: PostedBuild = {
  id: "bgon", name: "Golden", description: "", mechId: "m1", weaponId: null,
  skillIds: [], weaponIds: [], weaponSkillIds: {}, hearts: 0, quality: "Gold", weaponQualities: {}, moduleSelections: {}, droneSelections: {},
  aircraftSelections: {},
  awakeningStep: null,
  status: "Published", createdAt: "2026-08-12T00:00:00.000Z",
  updatedAt: "2026-08-12T00:00:00.000Z", author: { nickname: null, server: null },
};
const GRANT_OFF: PostedBuild = { ...GRANT_ON, id: "bgoff", quality: "Blue" };

// Picks in the order a player might take them: Spark is picked BEFORE Storm
// Call, but must read after the whole Zap family. Gold grants Freeze, whose
// picked child Shatter should hang under it.
const FAMILY: PostedBuild = {
  ...GRANT_ON,
  id: "bfam",
  skillIds: ["s1", "s2", "s4", "s3", "fz1"],
};

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
  awakeningStep: null,
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
  awakeningStep: null,
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
  awakeningStep: null,
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

// "Awakening Lv3" reached: Lv.1 and Lv.2 cores count, Lv.3's doesn't.
const AWAKENED: PostedBuild = { ...BUILD, id: "bawk", awakeningStep: "2-C" };
// Mid-way through level 1: no core reached yet.
const AWAKENING_EARLY: PostedBuild = { ...BUILD, id: "bawk13", awakeningStep: "1-3" };

/** Set by the one test that needs the aircraft catalog request to fail. */
let failAircraftCatalog = false;

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
    else if (url.match(/\/api\/builds\/bfam$/)) body = FAMILY;
    else if (url.match(/\/api\/builds\/bawk$/)) body = AWAKENED;
    else if (url.match(/\/api\/builds\/bawk13$/)) body = AWAKENING_EARLY;
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
    else if (url.includes("/api/aircraft")) {
      if (failAircraftCatalog) {
        return new Response(JSON.stringify({ error: "boom" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
      body = aircraftCatalog;
    }
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

  it("groups picked skills into families: children follow their parent, one level deeper", async () => {
    renderPage("/builds/bfam");
    const list = await screen.findByRole("list", { name: "Iron Colossus skills" });
    // Wait for the mech's skill pool to load before reading the rows.
    await within(list).findByText("Storm Call", { selector: "span" });

    const rowsOf = (el: HTMLElement) =>
      within(el)
        .getAllByRole("listitem")
        .map((li) => [li.querySelector("span.font-black")?.textContent, li.dataset.depth]);
    expect(rowsOf(list)).toEqual([
      ["Zap", "0"],
      ["Chain Bolt", "1"],
      ["Storm Call", "2"],
      // Spark, picked before Storm Call, reads after Zap's whole family.
      ["Spark", "0"],
      // Freeze's child is a root here: its granted parent lives in the
      // initial section above, not in this row.
      ["Shatter", "0"],
    ]);
    // The hierarchy is announced, not only drawn.
    expect(within(list).getByText("Upgrade of Zap")).toBeInTheDocument();
    expect(within(list).getByText("Upgrade of Chain Bolt")).toBeInTheDocument();

    // Quality-granted skills keep their own section, so the picked row holds
    // only the picks.
    expect(screen.getByRole("heading", { name: /Iron Colossus initial/ })).toBeInTheDocument();
    const initialList = screen.getByRole("list", { name: "Iron Colossus initial skills" });
    expect(rowsOf(initialList)).toEqual([["Freeze", "0"]]);
    expect(within(initialList).getByText("Initial skill")).toBeInTheDocument();
    expect(within(list).queryByText("Initial skill")).not.toBeInTheDocument();
  });

  it("shows the reached awakening cores, stats summed, read-only", async () => {
    renderPage("/builds/bawk");
    const box = await screen.findByRole("region", { name: "Awakening Effect" });
    expect(screen.getByText("Awakening Lv3")).toBeInTheDocument();
    // Lv.1 + Lv.2: HP, ATK and DEF each +10%, and both special effects.
    expect(within(box).getAllByText("+10%")).toHaveLength(3);
    expect(within(box).getByText("DMG from Mechs -50%")).toBeInTheDocument();
    expect(within(box).getByText("Fatal Blade")).toBeInTheDocument();
    // Lv.3's core isn't reached at this step.
    expect(within(box).queryByText("Poisoned Shuriken")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Mech awakening" })).not.toBeInTheDocument();
  });

  it("says no awakening effects yet before the first core step", async () => {
    renderPage("/builds/bawk13");
    const box = await screen.findByRole("region", { name: "Awakening Effect" });
    expect(within(box).getByText("No awakening effects yet.")).toBeInTheDocument();
  });

  it("shows no awakening section when the build has no step", async () => {
    renderPage("/builds/b1");
    await screen.findByRole("heading", { name: "Iron Colossus skills" });
    expect(screen.queryByRole("region", { name: "Awakening Effect" })).not.toBeInTheDocument();
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

  it("omits the section when the aircraft catalog request fails", async () => {
    // The id can't be resolved either way, but a FAILED request must not be
    // mistaken for a still-loading one — otherwise the heading stays up
    // forever over an empty grid.
    failAircraftCatalog = true;
    try {
      renderPage("/builds/bair");
      await screen.findByRole("heading", { level: 1, name: "Zap rush" });
      await waitFor(() =>
        expect(
          screen.queryByRole("heading", { level: 2, name: "Aircraft" })
        ).not.toBeInTheDocument()
      );
    } finally {
      failAircraftCatalog = false;
    }
  });
});
