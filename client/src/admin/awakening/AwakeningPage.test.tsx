import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AwakeningPage } from "./AwakeningPage";

const mech = { id: "m1", name: "Fire Judgement", rank: "S" };
const levels = [
  {
    id: "l1", level: 1, isLive: true, coreAttr: ["HP +5%"], coreSkill: "Fire Field",
    coreInfo: null, coreCd: [0, 0], corePower: 1000, coreLuckyId: 1301,
    coreReward: null, coreSkin: null,
    nodes: [{
      id: "n1", position: 1, icon: "UI_Attr_hp", mechStat: "HP +15%", enhText: null,
      enhModes: [], condEntry: null, condTargetId: null, condThreshold: null,
      condText: "Accessory Fire Gauntlet reached 6 quality", condRaw: null,
    }],
  },
];
const tiers = [{ level: 1, outerPoints: 100, outerShards: 30, coreMajor: 1, coreShards: 150, acctStats: ["HP +3,000"] }];

function renderPage() {
  vi.spyOn(globalThis, "fetch").mockImplementation((input) => {
    const url = String(input);
    const body = url.includes("/api/awakening/cost-tiers") ? tiers
      : url.includes("/api/awakening/mechs/") ? levels
      : url.includes("/api/mechs/m1") ? mech
      : [];
    return Promise.resolve(new Response(JSON.stringify(body), {
      status: 200, headers: { "Content-Type": "application/json" },
    }));
  });
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={["/admin/mechs/m1/awakening"]}>
        <Routes>
          <Route path="/admin/mechs/:id/awakening" element={<AwakeningPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

afterEach(() => vi.restoreAllMocks());

describe("AwakeningPage", () => {
  it("shows all six level panels", async () => {
    renderPage();
    expect(await screen.findByRole("button", { name: /Awakening Lv\.1/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Awakening Lv\.6/ })).toBeInTheDocument();
  });

  it("marks levels that are not enabled", async () => {
    renderPage();
    const six = await screen.findByRole("button", { name: /Awakening Lv\.6/ });
    expect(six).toHaveTextContent("not enabled");
  });

  it("loads saved node values into the form", async () => {
    renderPage();
    await userEvent.click(await screen.findByRole("button", { name: /Awakening Lv\.1/ }));
    expect(screen.getByLabelText("Level 1 node 1 mech stat")).toHaveValue("HP +15%");
  });

  it("shows the cost ladder read-only inside a level", async () => {
    renderPage();
    await userEvent.click(await screen.findByRole("button", { name: /Awakening Lv\.1/ }));
    expect(screen.getByText(/100 pts \+ 30 shards/)).toBeInTheDocument();
  });

  // Regression test for the critical bug: setNode used to map over the
  // UNPADDED `value.nodes` array. Level 2 has no saved nodes at all
  // (`nodes: []` from `emptyLevel`), so mapping over `value.nodes` visits
  // zero rows and every keystroke into node 1 is silently dropped — the
  // controlled input snaps back to empty. Typing here must stick.
  it("keeps a typed value on a node with no saved nodes at all", async () => {
    renderPage();
    await userEvent.click(await screen.findByRole("button", { name: /Awakening Lv\.2/ }));
    const input = screen.getByLabelText("Level 2 node 1 mech stat");
    await userEvent.type(input, "HP +20%");
    expect(input).toHaveValue("HP +20%");
  });

  it("lets the core attributes textarea hold more than one line", async () => {
    renderPage();
    await userEvent.click(await screen.findByRole("button", { name: /Awakening Lv\.1/ }));
    const textarea = screen.getByLabelText("Level 1 core attributes");
    await userEvent.clear(textarea);
    await userEvent.type(textarea, "HP +5%{enter}ATK +10%");
    expect(textarea).toHaveValue("HP +5%\nATK +10%");
  });
});
