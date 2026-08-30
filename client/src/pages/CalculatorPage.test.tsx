import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CalculatorPage } from "./CalculatorPage";

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="url">{location.pathname + location.search}</output>;
}

const mechs = [
  { id: "m1", slug: "wukong", name: "Wukong", epithet: null, type: null, rank: "S", imageUrl: null },
];

const skill = (id: string, name: string, extra = {}) => ({
  id, parentId: null, name, description: null, appearanceLevel: 1,
  type: "Normal", sortOrder: 0, repeatable: false,
  linkedWeaponId: null, linkedMechId: null, initialAtTier: null, ...extra,
});

const mechDetail = {
  id: "m1", slug: "wukong", name: "Wukong", epithet: null, type: null, rank: "S",
  imageUrl: null, iconUrl: null, cardSkillIconUrl: null,
  skillNodes: [skill("aaaaaa11-1111-4111-8111-111111111111", "Cloud Somersault")],
};

const weapons = [
  {
    id: "w1", slug: "ice-drill", name: "Ice Drill", description: null, linkedEffect: null,
    tier: "S", rankUpPreview: [], imageUrl: null, iconUrl: null, type: null,
    mech: null, pilot: null, weaponSkins: [],
    skillNodes: [skill("bbbbbb22-2222-4222-8222-222222222222", "Frost Bore")],
  },
];

function renderPage(initialEntry = "/calculator") {
  vi.spyOn(globalThis, "fetch").mockImplementation((input) => {
    const url = String(input);
    const body = url.includes("/api/mechs/wukong")
      ? mechDetail
      : url.includes("/api/mechs")
        ? mechs
        : url.includes("/api/weapons")
          ? weapons
          : [];
    return Promise.resolve(
      new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } })
    );
  });
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <CalculatorPage />
        <LocationProbe />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

afterEach(() => vi.restoreAllMocks());

describe("CalculatorPage", () => {
  it("lists mechs to choose from", async () => {
    renderPage();
    expect(await screen.findByRole("button", { name: "Wukong" })).toBeInTheDocument();
  });

  it("shows the mech's skills after choosing it", async () => {
    renderPage();
    await userEvent.click(await screen.findByRole("button", { name: "Wukong" }));
    expect(await screen.findByText("Cloud Somersault")).toBeInTheDocument();
  });

  it("offers a quality tier for the chosen mech", async () => {
    renderPage();
    await userEvent.click(await screen.findByRole("button", { name: "Wukong" }));
    expect(await screen.findByLabelText("Mech quality")).toBeInTheDocument();
  });

  it("lets a weapon be equipped and shows its skills", async () => {
    renderPage();
    await userEvent.click(await screen.findByRole("button", { name: "Wukong" }));
    await userEvent.click(await screen.findByRole("button", { name: "Ice Drill" }));
    // A newly-equipped weapon's skills block starts collapsed, same as the
    // build editor (BuildEditorPage.test.tsx: "collapsed until clicked") —
    // expand it before looking for the skill name inside.
    await userEvent.click(await screen.findByRole("button", { name: /Ice Drill skills/ }));
    expect(await screen.findByText("Frost Bore")).toBeInTheDocument();
  });
});

describe("CalculatorPage URL state", () => {
  it("restores a mech, its tier and its picks from the link", async () => {
    renderPage("/calculator?m=wukong.G:aaaaaa");
    // The picked skill shows as a removable pick slot — proof it's actually
    // picked, not just present in the palette (a picked skill's name also
    // renders again in the "All skills" card, so a plain findByText would
    // match both and fail on ambiguity).
    expect(
      await screen.findByRole("button", { name: "Remove Cloud Somersault from the build" })
    ).toBeInTheDocument();
    // The tier came from the link: the Dropdown trigger carries aria-label
    // "Mech quality" directly and renders the selected option's label as its
    // own text, so this really does prove Gold was restored (default is Blue).
    expect(await screen.findByLabelText("Mech quality")).toHaveTextContent("Gold");
  });

  it("restores an equipped weapon from the link", async () => {
    renderPage("/calculator?m=wukong.B&w=ice-drill.B");
    // A newly-equipped weapon's skills block starts collapsed (same as the
    // build editor) — expand it before looking for the skill name inside.
    await userEvent.click(await screen.findByRole("button", { name: /Ice Drill skills/ }));
    expect(await screen.findByText("Frost Bore")).toBeInTheDocument();
  });

  it("writes the mech into the URL when one is chosen", async () => {
    renderPage();
    await userEvent.click(await screen.findByRole("button", { name: "Wukong" }));
    expect(screen.getByTestId("url")).toHaveTextContent("/calculator?m=wukong.B");
  });

  it("writes separators literally, not percent-escaped", async () => {
    renderPage("/calculator?m=wukong.B");
    await userEvent.click(await screen.findByRole("button", { name: "Ice Drill" }));
    const url = screen.getByTestId("url").textContent ?? "";
    expect(url).toContain("&w=ice-drill.B");
    expect(url).not.toContain("%3A");
    expect(url).not.toContain("%2C");
  });

  it("warns when a link references a skill that no longer exists", async () => {
    renderPage("/calculator?m=wukong.B:deadbe,cafeba");
    expect(await screen.findByText(/2 skills in this link no longer exist/i)).toBeInTheDocument();
  });

  it("does not warn when every key resolves", async () => {
    renderPage("/calculator?m=wukong.B:aaaaaa");
    // Picked, so its name renders twice (slot + palette card) — wait for the
    // slot specifically rather than a plain findByText, which would be
    // ambiguous.
    await screen.findByRole("button", { name: "Remove Cloud Somersault from the build" });
    expect(screen.queryByText(/no longer exist/i)).not.toBeInTheDocument();
  });
});
