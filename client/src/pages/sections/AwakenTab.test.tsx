import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AwakenTab } from "./AwakenTab";
import type { AwakeningCostTier, AwakeningLevel } from "../../api/types";

const node = (position: number, over: Partial<AwakeningLevel["nodes"][0]> = {}) => ({
  id: `n${position}`,
  position,
  icon: "UI_Attr_hp",
  mechStat: "HP +15%",
  enhText: null,
  enhModes: [] as number[],
  condEntry: null,
  condTargetId: null,
  condThreshold: null,
  condText: "Accessory Fire Gauntlet reached 6 quality",
  condRaw: null,
  ...over,
});

const level = (n: number, over: Partial<AwakeningLevel> = {}): AwakeningLevel => ({
  id: `l${n}`,
  level: n,
  isLive: n <= 3,
  coreAttr: ["HP +5%", "ATK +5%"],
  coreSkill: "Fire Field DMG +100%",
  coreInfo: null,
  coreCd: [0, 0],
  corePower: 1000,
  coreLuckyId: 1301,
  coreReward: null,
  coreSkin: null,
  nodes: [node(1)],
  ...over,
});

const TIERS: AwakeningCostTier[] = [
  {
    level: 1,
    outerPoints: 100,
    outerShards: 30,
    coreMajor: 1,
    coreShards: 150,
    acctStats: ["HP +3,000", "ATK +600"],
  },
];

function renderTab(levels: AwakeningLevel[], tiers: AwakeningCostTier[] = TIERS) {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(JSON.stringify(tiers), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  );
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <AwakenTab levels={levels} />
    </QueryClientProvider>
  );
}


function renderOne(lvl: AwakeningLevel) {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(JSON.stringify(TIERS), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  );
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <AwakenTab levels={[lvl]} />
    </QueryClientProvider>
  );
}

afterEach(() => vi.restoreAllMocks());

describe("AwakenTab", () => {
  it("says so when a mech has no awakening data", () => {
    renderTab([]);
    expect(screen.getByText(/no awakening data recorded/i)).toBeInTheDocument();
  });

  it("shows a node's stat, its position label and what unlocks it", async () => {
    renderTab([level(1)]);
    expect(await screen.findByText("HP +15%")).toBeInTheDocument();
    expect(screen.getByText("1-1")).toBeInTheDocument();
    // The condition is no longer one text node — the named thing is a nested
    // bold span — so match on the line's full text instead.
    expect(
      screen.getByText(
        (_, el) => el?.textContent === "Accessory Fire Gauntlet reached 6 quality",
        { selector: "span" }
      )
    ).toBeInTheDocument();
  });

  it("shows live levels and hides the ones not enabled in-game", async () => {
    renderTab([level(1), level(4)]);
    expect(
      await screen.findByRole("heading", { name: "Awakening Lv.1" })
    ).toBeInTheDocument();
    // Level 4 is authored but not switched on, so it gets no level block. Its
    // NAME still appears in the coming-soon note, hence the role query.
    expect(
      screen.queryByRole("heading", { name: "Awakening Lv.4" })
    ).not.toBeInTheDocument();
  });

  it("names the unreleased levels as coming soon", async () => {
    renderTab([level(1), level(4), level(5), level(6)]);
    expect(await screen.findByText(/Awakening Lv\.4–6/)).toBeInTheDocument();
    expect(screen.getByText(/coming soon/i)).toBeInTheDocument();
  });

  it("names a single unreleased level without a range", async () => {
    renderTab([level(1), level(4)]);
    expect(await screen.findByText(/Awakening Lv\.4 — coming soon/)).toBeInTheDocument();
  });

  it("renders costs and the account grant from the global ladder", async () => {
    renderTab([level(1)]);
    // The per-node cost, the header strip and the footer all come from the ladder.
    expect(await screen.findAllByText("100")).not.toHaveLength(0);
    expect(screen.getByText(/each outer node also grants account-wide/i)).toBeInTheDocument();
    // Regex, not an exact string: the DOM collapses the separator's whitespace.
    expect(screen.getByText(/HP \+3,000\s*\/\s*ATK \+600/)).toBeInTheDocument();
  });

  it("omits every cost figure while the ladder is empty", async () => {
    renderTab([level(1)], []);
    // The tree still renders — only the costs are absent, since inventing a
    // number would be worse than showing none.
    expect(await screen.findByText("HP +15%")).toBeInTheDocument();
    expect(screen.queryByText(/pts/)).not.toBeInTheDocument();
    expect(screen.queryByText(/each outer node also grants/i)).not.toBeInTheDocument();
  });

  it("lists the modes an enhancement is excluded from", async () => {
    renderTab([
      level(1, {
        nodes: [node(1, { mechStat: null, enhText: "DMG to monsters +10%", enhModes: [22, 23, 24] })],
      }),
    ]);
    expect(await screen.findByText("DMG to monsters +10%")).toBeInTheDocument();
    expect(screen.getByText("Not applied in modes 22, 23, 24")).toBeInTheDocument();
  });

  it("shows the core node with its attributes and skill", async () => {
    renderTab([level(1)]);
    expect(await screen.findByText(/core node/i)).toBeInTheDocument();
    expect(screen.getByText(/HP \+5%\s*\/\s*ATK \+5%/)).toBeInTheDocument();
    expect(screen.getByText("Fire Field DMG +100%")).toBeInTheDocument();
  });

  it("emphasises the named thing inside an unlock condition", async () => {
    // Real shapes, one per entity-naming condition type.
    const shapes: [string, string][] = [
      ["Accessory Shadow Mask reached 6 quality", "Shadow Mask"],
      ["Weapon Ninja Spikes Gun has reached 11 quality", "Ninja Spikes Gun"],
      ["Driver Akira arrived at 5 quality", "Akira"],
      ["Mech Skin Oni Samurai reached 3 Star.", "Oni Samurai"],
      ["Weapon Skin Dragon Cannon reached 1 Star.", "Dragon Cannon"],
    ];
    for (const [text, name] of shapes) {
      const { unmount } = renderOne(level(1, { nodes: [node(1, { condText: text })] }));
      const bold = await screen.findByText(name);
      expect(bold.tagName).toBe("SPAN");
      expect(bold).toHaveClass("font-bold");
      unmount();
      vi.restoreAllMocks();
    }
  });

  it("leaves a count-style condition alone — it names nothing to emphasise", async () => {
    renderTab([
      level(1, { nodes: [node(1, { condText: "2 Mech(s) reached Awakening Phase 4." })] }),
    ]);
    const line = await screen.findByText("2 Mech(s) reached Awakening Phase 4.");
    expect(line.querySelector(".font-bold")).toBeNull();
  });
});
