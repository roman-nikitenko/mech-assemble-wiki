import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type {
  BuildStatus,
  GameType,
  MechDetail,
  MechSummary,
  ModuleQuality,
  ModuleSummary,
  PostedBuild,
  WeaponSummary,
} from "../../api/types";
import { BuildEditorPage } from "./BuildEditorPage";

// Builds the editor can load in edit mode (GET /api/builds/mine).
let myBuilds: PostedBuild[] = [];

const postedBuild = (over: Partial<PostedBuild> = {}): PostedBuild => ({
  id: "b1",
  name: "Saved rush",
  description: "",
  mechId: "m1",
  weaponId: null,
  skillIds: [],
  weaponIds: [],
  weaponSkillIds: {},
  status: "Draft" as BuildStatus,
  hearts: 0, quality: "Blue", weaponQualities: {}, moduleSelections: {},
  createdAt: "2026-07-15T00:00:00.000Z",
  updatedAt: "2026-07-15T00:00:00.000Z",
  author: { nickname: "Tester", server: "" },
  ...over,
});

/** The JSON body of the last create/edit request (POST or PUT /api/builds). */
function lastSavedInput(): Record<string, unknown> {
  const calls = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls;
  const call = [...calls].reverse().find(([u, init]) => {
    const url = String(u);
    const method = (init as RequestInit | undefined)?.method;
    return (
      (url.endsWith("/api/builds") && method === "POST") ||
      (/\/api\/builds\/[^/]+$/.test(url) && method === "PUT")
    );
  });
  return JSON.parse((call![1] as RequestInit).body as string);
}

// Auth derives from GET /api/me: logged in = 200 with a user, guest = 401.
const authState = vi.hoisted(() => ({ loggedIn: true }));

const summary: MechSummary = {
  id: "m1",
  slug: "iron-colossus",
  name: "Iron Colossus",
  epithet: null,
  type: null,
  rank: "Standard",
  imageUrl: null,
};

// Four skills exercising every gate: two free ones, a child, a level-3.
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
    { id: "s1", parentId: null, name: "Zap", description: "Bolt", appearanceLevel: 1, type: "Normal", sortOrder: 0, repeatable: false, linkedWeaponId: null, linkedMechId: null, initialAtTier: null },
    { id: "s2", parentId: "s1", name: "Zap II", description: "Bigger bolt", appearanceLevel: 1, type: "Premium", sortOrder: 1, repeatable: false, linkedWeaponId: null, linkedMechId: null, initialAtTier: null },
    { id: "s3", parentId: null, name: "Overdrive", description: null, appearanceLevel: 3, type: "Normal", sortOrder: 2, repeatable: false, linkedWeaponId: null, linkedMechId: null, initialAtTier: null },
    { id: "s4", parentId: null, name: "Dash", description: null, appearanceLevel: 1, type: "Normal", sortOrder: 3, repeatable: false, linkedWeaponId: null, linkedMechId: null, initialAtTier: null },
    { id: "s5", parentId: null, name: null, description: "Core power", appearanceLevel: 1, type: "Core", sortOrder: 4, repeatable: false, linkedWeaponId: null, linkedMechId: null, initialAtTier: null },
    // Linked skill: only pickable once weapon w2 (Thunder Pike) is equipped.
    { id: "ls1", parentId: null, name: "Frost Synergy", description: "combo bonus", appearanceLevel: 1, type: "Normal", sortOrder: 5, repeatable: false, linkedWeaponId: "w2", linkedMechId: null, initialAtTier: null },
    // Quality grant: Freeze is pre-granted at Gold; its child Icicle needs it.
    { id: "q1", parentId: null, name: "Freeze", description: "freeze", appearanceLevel: 1, type: "Normal", sortOrder: 6, repeatable: false, linkedWeaponId: null, linkedMechId: null, initialAtTier: "Gold" },
    { id: "q2", parentId: "q1", name: "Icicle", description: "spike", appearanceLevel: 1, type: "Normal", sortOrder: 7, repeatable: false, linkedWeaponId: null, linkedMechId: null, initialAtTier: null },
  ],
};

const fireType: GameType = { id: "t1", name: "Fire", iconUrl: null };

const moduleQualityFixture: ModuleQuality = {
  id: "mq1",
  name: "Blue",
  iconUrl: null,
  hp: "100",
  atk: "10",
  def: "5",
  effect1Value: null,
  effectCount: 0,
  sortOrder: 0,
};

const moduleFixture: ModuleSummary = {
  id: "mod1",
  name: "Ion Reactor",
  iconUrl: null,
  effect2Target: "Mech",
  effect3Target: "Weapon",
  effects: [],
};

const weaponFixture = (over: Partial<WeaponSummary>): WeaponSummary => ({
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
  skillNodes: [],
  ...over,
});

const weaponsFixture: WeaponSummary[] = [
  weaponFixture({
    id: "w1",
    name: "Blade of Dawn",
    tier: "S",
    type: fireType,
    skillNodes: [
      { id: "ws1", parentId: null, name: "Slash", description: "Cuts", appearanceLevel: 1, type: "Normal", sortOrder: 0, repeatable: false, linkedWeaponId: null, linkedMechId: null, initialAtTier: null },
      // Weapon-owned linked skill gated on a mech partner (m2). Must stay hidden
      // in a weapon-only build (no mech to pair with).
      { id: "wls1", parentId: null, name: "Combo Strike", description: "pair bonus", appearanceLevel: 1, type: "Normal", sortOrder: 1, repeatable: false, linkedWeaponId: null, linkedMechId: "m2", initialAtTier: null },
    ],
  }),
  weaponFixture({ id: "w2", name: "Thunder Pike", tier: "Standard" }),
];

// Mutable so individual tests can override it to simulate no nickname.
let meNickname: string | null = "Tester";

function renderEditor(path = "/profile/builds/new") {
  vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
    const url = String(input);
    const method = (init as RequestInit | undefined)?.method ?? "GET";
    let body: unknown;
    let status = 200;
    // /api/me check must come before /api/mechs to avoid false-prefix match
    // ("/api/mechs/m1" starts with "/api/me", so we use endsWith for /api/me)
    if (url.endsWith("/api/me")) {
      if (!authState.loggedIn) {
        return Promise.resolve(
          new Response(JSON.stringify({ error: "Login required" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          })
        );
      }
      body = { id: "u1", name: null, nickname: meNickname, server: "", isNew: false };
    } else if (url.includes("/api/builds/mine")) {
      body = myBuilds;
    } else if (url.endsWith("/api/builds") && method === "POST") {
      // Create — echo the input back as a new Draft row.
      const input = JSON.parse((init as RequestInit).body as string);
      body = postedBuild({ id: "new1", ...input });
      status = 201;
    } else if (/\/api\/builds\/[^/]+$/.test(url) && method === "PUT") {
      const input = JSON.parse((init as RequestInit).body as string);
      body = postedBuild({ ...input });
    } else if (url.includes("/api/mechs/m1")) {
      body = detail;
    } else if (url.includes("/api/weapons")) {
      body = weaponsFixture;
    } else if (url.includes("/api/types")) {
      body = [fireType];
    } else if (url.includes("/api/module-qualities")) {
      body = [moduleQualityFixture];
    } else if (url.includes("/api/modules")) {
      body = [moduleFixture];
    } else {
      body = [summary];
    }
    return Promise.resolve(
      new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json" },
      })
    );
  });
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/profile/builds/new" element={<BuildEditorPage />} />
          <Route path="/profile/builds/:buildId/edit" element={<BuildEditorPage />} />
          <Route path="/profile" element={<p>profile list</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  authState.loggedIn = true;
  meNickname = "Tester";
  myBuilds = [];
  localStorage.clear();
});
afterEach(() => vi.restoreAllMocks());

describe("BuildEditorPage (new build)", () => {
  it("redirects to the profile when not logged in", async () => {
    authState.loggedIn = false;
    renderEditor();
    expect(await screen.findByText("profile list")).toBeInTheDocument();
    expect(screen.queryByText("Choose a mech")).not.toBeInTheDocument();
  });

  it("redirects to the profile when logged in but nickname is null", async () => {
    meNickname = null;
    renderEditor();
    expect(await screen.findByText("profile list")).toBeInTheDocument();
  });

  it("shows a mech linked skill only after its partner weapon is equipped", async () => {
    renderEditor();
    await userEvent.click(await screen.findByRole("button", { name: /Iron Colossus/ }));
    // Hidden until the gate partner (w2 = Thunder Pike) is equipped.
    expect(screen.queryByRole("button", { name: /Frost Synergy/ })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Thunder Pike" }));
    expect(await screen.findByRole("button", { name: /Frost Synergy/ })).toBeInTheDocument();
  });

  it("pre-grants a node once the mech quality reaches its tier, unlocking its child", async () => {
    renderEditor();
    await userEvent.click(await screen.findByRole("button", { name: /Iron Colossus/ }));
    // At Blue (default), Icicle is locked — its parent Freeze isn't taken.
    expect(screen.getByRole("button", { name: /Icicle/ })).toBeDisabled();
    // Raise the mech quality to Gold → Freeze is pre-granted → Icicle unlocks.
    await userEvent.click(screen.getByRole("button", { name: "Mech quality" }));
    await userEvent.click(screen.getByRole("option", { name: "Gold" }));
    expect(await screen.findByRole("button", { name: /Icicle/ })).toBeEnabled();
  });

  it("starts with the mech picker, then shows 8 slots and the skill palette", async () => {
    renderEditor();
    await userEvent.click(await screen.findByRole("button", { name: /Iron Colossus/ }));
    expect(await screen.findByText("Slot 1")).toBeInTheDocument();
    expect(screen.getByText("Slot 8")).toBeInTheDocument();
    // palette states: Zap free, Zap II needs parent, Overdrive needs 3 picks
    expect(screen.getByRole("button", { name: /^Zap Bolt/ })).toBeEnabled();
    const child = screen.getByRole("button", { name: /Zap II/ });
    expect(child).toBeDisabled();
    expect(child).toHaveTextContent("Requires Zap");
    const late = screen.getByRole("button", { name: /Overdrive/ });
    expect(late).toBeDisabled();
    expect(late).toHaveTextContent("Unlocks after 3 picks");
  });

  it("picking a skill fills slot 1 and unlocks its child; second click un-picks", async () => {
    renderEditor();
    await userEvent.click(await screen.findByRole("button", { name: /Iron Colossus/ }));
    await userEvent.click(await screen.findByRole("button", { name: /^Zap Bolt/ }));
    // the filled slot is a remove button now
    expect(screen.getByRole("button", { name: "Remove Zap from the build" })).toBeInTheDocument();
    expect(screen.queryByText("Slot 1")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Zap II/ })).toBeEnabled();
    // clicking the picked palette card again removes it from the slots
    await userEvent.click(screen.getByRole("button", { name: /^Zap Bolt/ }));
    expect(screen.getByText("Slot 1")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove Zap from the build" })).not.toBeInTheDocument();
  });

  it("saves a named build through the API and navigates back", async () => {
    renderEditor();
    await userEvent.click(await screen.findByRole("button", { name: /Iron Colossus/ }));
    await userEvent.click(await screen.findByRole("button", { name: /^Zap Bolt/ }));
    const save = screen.getByRole("button", { name: "Save build" });
    expect(save).toBeDisabled(); // no name yet
    await userEvent.click(await screen.findByRole("button", { name: /Blade of Dawn/ }));
    await userEvent.type(screen.getByLabelText("Build name *"), "Zap rush");
    await userEvent.click(screen.getByRole("button", { name: "Save build" }));
    expect(await screen.findByText("profile list")).toBeInTheDocument();
    expect(lastSavedInput()).toMatchObject({
      name: "Zap rush",
      mechId: "m1",
      skillIds: ["s1"],
      weaponIds: ["w1"],
    });
  });

  it("removing a parent pops its picked child out with a note", async () => {
    renderEditor();
    await userEvent.click(await screen.findByRole("button", { name: /Iron Colossus/ }));
    await userEvent.click(await screen.findByRole("button", { name: /^Zap Bolt/ }));
    await userEvent.click(screen.getByRole("button", { name: /Zap II/ }));
    await userEvent.click(screen.getByRole("button", { name: "Remove Zap from the build" }));
    expect(screen.getByText(/Also removed: Zap II/)).toBeInTheDocument();
    expect(screen.getByText("Slot 1")).toBeInTheDocument(); // all slots empty again
  });

  it("a level-3 skill unlocks once 3 picks exist", async () => {
    renderEditor();
    await userEvent.click(await screen.findByRole("button", { name: /Iron Colossus/ }));
    await userEvent.click(await screen.findByRole("button", { name: /^Zap Bolt/ }));
    await userEvent.click(screen.getByRole("button", { name: /Zap II/ }));
    expect(screen.getByRole("button", { name: /Overdrive/ })).toBeDisabled(); // 2 picks < 3
    await userEvent.click(screen.getByRole("button", { name: /Dash/ }));
    expect(screen.getByRole("button", { name: /Overdrive/ })).toBeEnabled(); // 3 picks
  });

  it("equips a weapon into a corner square; second click (card or square) removes it", async () => {
    renderEditor();
    await userEvent.click(await screen.findByRole("button", { name: /Iron Colossus/ }));
    expect(screen.getByLabelText("Empty weapon slot 1")).toBeInTheDocument();
    await userEvent.click(await screen.findByRole("button", { name: /Blade of Dawn/ }));
    expect(
      screen.getByRole("button", { name: "Remove Blade of Dawn from weapon slots" })
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Empty weapon slot 1")).not.toBeInTheDocument();
    // second click on the strip card un-equips (exact-name match hits the
    // icon-only strip card, not the corner square)
    await userEvent.click(screen.getByRole("button", { name: "Blade of Dawn" }));
    expect(screen.getByLabelText("Empty weapon slot 1")).toBeInTheDocument();
    // re-equip and remove via the corner square instead
    await userEvent.click(screen.getByRole("button", { name: "Blade of Dawn" }));
    await userEvent.click(
      screen.getByRole("button", { name: "Remove Blade of Dawn from weapon slots" })
    );
    expect(screen.getByLabelText("Empty weapon slot 1")).toBeInTheDocument();
  });

  it("a picked Core skill fills a Core slot, not one of the 8", async () => {
    renderEditor();
    await userEvent.click(await screen.findByRole("button", { name: /Iron Colossus/ }));
    expect(await screen.findByText("Core slot 1")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Core skill Core power/ }));
    expect(
      screen.getByRole("button", { name: "Remove Core skill from the build" })
    ).toBeInTheDocument();
    expect(screen.getByText("Slot 1")).toBeInTheDocument(); // the 8 regular slots stay empty
    expect(screen.queryByText("Core slot 1")).not.toBeInTheDocument();
  });

  it("weapon-only build hides the weapon's linked skills (no mech to pair)", async () => {
    renderEditor();
    await userEvent.click(await screen.findByRole("button", { name: /Blade of Dawn/ }));
    await screen.findByRole("button", { name: /Blade of Dawn skills/ });
    // The ordinary Slash skill shows; the linked Combo Strike (needs mech m2)
    // must NOT appear in a weapon-only build.
    expect(screen.getByRole("button", { name: /^Slash Cuts/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Combo Strike/ })).not.toBeInTheDocument();
  });

  it("creates a weapon-only build from the picker's weapon section", async () => {
    renderEditor();
    // the picker offers weapons below the mechs
    await userEvent.click(await screen.findByRole("button", { name: /Blade of Dawn/ }));
    // weapon board: its skills block is open; no strip, no corner squares
    expect(await screen.findByRole("button", { name: /Blade of Dawn skills/ })).toHaveAttribute(
      "aria-expanded",
      "true"
    );
    expect(screen.queryByLabelText("Filter weapons by name")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Empty weapon slot 1")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /^Slash Cuts/ }));
    await userEvent.type(screen.getByLabelText("Build name *"), "Blade only");
    await userEvent.click(screen.getByRole("button", { name: "Save build" }));
    await screen.findByText("profile list");
    expect(lastSavedInput()).toMatchObject({
      name: "Blade only",
      mechId: null,
      weaponId: "w1",
      skillIds: ["ws1"],
      weaponIds: [],
      weaponSkillIds: {},
    });
  });

  it("each equipped weapon gets its own expandable skills block", async () => {
    renderEditor();
    await userEvent.click(await screen.findByRole("button", { name: /Iron Colossus/ }));
    // no weapon block before equipping
    expect(screen.queryByRole("button", { name: /Blade of Dawn skills/ })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Blade of Dawn" }));
    const header = screen.getByRole("button", { name: /Blade of Dawn skills/ });
    expect(header).toHaveAttribute("aria-expanded", "false"); // collapsed until clicked
    await userEvent.click(header);
    // the weapon's own palette and slots live inside
    await userEvent.click(screen.getByRole("button", { name: /^Slash Cuts/ }));
    expect(screen.getByRole("button", { name: "Remove Slash from the build" })).toBeInTheDocument();
    // save persists per-weapon picks
    await userEvent.type(screen.getByLabelText("Build name *"), "Armed build");
    await userEvent.click(screen.getByRole("button", { name: "Save build" }));
    await screen.findByText("profile list");
    expect(lastSavedInput().weaponSkillIds).toEqual({ w1: ["ws1"] });
  });

  it("shows the Attack Module section", async () => {
    renderEditor();
    // The module section lives in the shared meta form, which only mounts
    // once a subject (mech or weapon) has been picked past step 1.
    await userEvent.click(await screen.findByRole("button", { name: /Iron Colossus/ }));
    expect(await screen.findByRole("heading", { name: "Attack Module" })).toBeInTheDocument();
  });

  it("filters the weapon strip by name and tier", async () => {
    renderEditor();
    await userEvent.click(await screen.findByRole("button", { name: /Iron Colossus/ }));
    await screen.findByRole("button", { name: /Blade of Dawn/ });
    await userEvent.type(screen.getByLabelText("Filter weapons by name"), "Thunder");
    expect(screen.queryByRole("button", { name: /Blade of Dawn/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Thunder Pike/ })).toBeInTheDocument();
    await userEvent.clear(screen.getByLabelText("Filter weapons by name"));
    await userEvent.selectOptions(screen.getByLabelText("Filter weapons by tier"), "S");
    expect(screen.queryByRole("button", { name: /Thunder Pike/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Blade of Dawn/ })).toBeInTheDocument();
  });
});

describe("BuildEditorPage (edit mode)", () => {
  it("skips the picker and prefills the stored build", async () => {
    myBuilds = [
      postedBuild({
        id: "b1",
        name: "Saved rush",
        description: "old notes",
        mechId: "m1",
        weaponId: null,
        skillIds: ["s1"],
        weaponIds: ["w1"],
        weaponSkillIds: {},
      }),
    ];
    renderEditor("/profile/builds/b1/edit");
    // no picker step — straight to the board with the picks restored
    expect(screen.queryByText("Choose a mech")).not.toBeInTheDocument();
    expect(
      await screen.findByRole("button", { name: "Remove Zap from the build" })
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("button", { name: "Remove Blade of Dawn from weapon slots" })
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Build name *")).toHaveValue("Saved rush");
    expect(screen.getByLabelText("Notes")).toHaveValue("old notes");
  });

  it("shows a friendly state for an unknown build id", async () => {
    renderEditor("/profile/builds/nope/edit");
    expect(await screen.findByText("Build not found.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to profile" })).toHaveAttribute(
      "href",
      "/profile"
    );
  });
});
