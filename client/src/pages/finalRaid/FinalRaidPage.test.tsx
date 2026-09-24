import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FinalRaidPage } from "./FinalRaidPage";
import type { ArsenalPiece, ArsenalSet, HiddenAchievement } from "../../api/types";

const piece = (over: Partial<ArsenalPiece> & { id: string; name: string }): ArsenalPiece => ({
  iconUrl: null,
  slot: "Belt",
  qualityMin: 1,
  qualityMax: 13,
  setId: null,
  set: null,
  sortOrder: 0,
  ...over,
});

// Deliberately out of slot order, to prove the page sorts them.
const pieces: ArsenalPiece[] = [
  piece({ id: "p1", name: "Standard Helmet", slot: "Helmet" }),
  piece({ id: "p2", name: "Standard Breastplate", slot: "Breastplate" }),
  // Stops at Epic (6), so it vanishes when a higher quality is chosen.
  piece({ id: "p4", name: "Computation Rune", slot: "Breastplate", qualityMin: 1, qualityMax: 6 }),
  piece({
    id: "p3",
    name: "Swift Belt",
    slot: "Belt",
    qualityMin: 8,
    setId: "s1",
    set: { id: "s1", name: "Swift Set" },
  }),
];

const sets: ArsenalSet[] = [
  {
    id: "s1",
    name: "Swift Set",
    iconUrl: null,
    twoPieceBonus: "Fire Rate +100%",
    fourPieceBonus: "Each shot increases DMG by 15%.",
    sortOrder: 0,
    pieceCount: 1,
  },
];

const achievements: HiddenAchievement[] = [
  // Deliberately lower quality first, to prove the page re-orders them.
  {
    id: "a1",
    name: "Lone Wolf",
    description: "Clear the remaining enemies after your teammate is defeated.",
    iconUrl: null,
    tier: 3,
    rewards: [
      { type: "diamond", amount: "3000" },
      { type: "supply-coin", amount: "100" },
    ],
    sortOrder: 0,
  },
  {
    id: "a2",
    name: "Frenzy Master",
    description: "Rank #1 in Final Raid settlement.",
    iconUrl: null,
    tier: 4,
    rewards: [{ type: "diamond", amount: "3000" }],
    sortOrder: 1,
  },
];

function renderPage(path = "/final-raid") {
  vi.spyOn(globalThis, "fetch").mockImplementation((input) => {
    const url = String(input);
    let body: unknown = sets;
    if (url.includes("/api/arsenal-pieces")) body = pieces;
    else if (url.includes("/api/hidden-achievements")) body = achievements;
    return Promise.resolve(
      new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } })
    );
  });
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[path]}>
        <FinalRaidPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

afterEach(() => vi.restoreAllMocks());

describe("FinalRaidPage (public)", () => {
  it("shows each default piece's stat ranges at the chosen quality", async () => {
    renderPage();
    const card = (await screen.findByText("Standard Helmet")).closest("article")!;
    // The default quality is the best the default gear reaches (13, Supreme):
    // HP 140,000 at an 80% floor.
    expect(card).toHaveTextContent("HP");
    expect(card).toHaveTextContent("[112000-140000]");
    expect(card).toHaveTextContent("[22400-28000]");
  });

  it("re-reads the numbers when another quality is picked", async () => {
    renderPage();
    await screen.findByText("Standard Helmet");
    await userEvent.click(screen.getByRole("button", { name: /Quality/ }));
    await userEvent.click(await screen.findByRole("option", { name: "Excellent" }));

    const card = screen.getByText("Standard Helmet").closest("article")!;
    // Quality 4: HP 1,800 at a 50% floor — the sketch's own numbers.
    expect(card).toHaveTextContent("[900-1800]");
    expect(card).toHaveTextContent("[180-360]");
  });

  it("hides gear that does not exist at the chosen quality", async () => {
    renderPage();
    // Supreme by default: the Rune stops at Epic.
    await screen.findByText("Standard Helmet");
    expect(screen.queryByText("Computation Rune")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /Quality/ }));
    await userEvent.click(await screen.findByRole("option", { name: "Epic" }));
    expect(screen.getByText("Computation Rune")).toBeInTheDocument();
  });

  it("marks a Mythic+2 card with two diamonds, and a Rare card with none", async () => {
    renderPage();
    const marks = async (qualityName: string) => {
      await userEvent.click(screen.getByRole("button", { name: /Quality/ }));
      await userEvent.click(await screen.findByRole("option", { name: qualityName }));
      const card = screen.getByText("Standard Helmet").closest("article")!;
      return [...card.querySelectorAll("img")].filter((img) =>
        img.getAttribute("src")?.includes("quality-ladder-marks")
      );
    };
    await screen.findByText("Standard Helmet");
    expect(await marks("Mythic+2")).toHaveLength(2);
    expect(await marks("Rare")).toHaveLength(0);
  });

  it("offers the effect slots the piece has at that quality", async () => {
    renderPage();
    const card = (await screen.findByText("Standard Helmet")).closest("article")!;
    // Supreme gear rolls from all three effect slots.
    expect([...card.querySelectorAll('[role="tab"]')].map((t) => t.textContent)).toEqual([
      "Effect 1",
      "Effect 2",
      "Effect 3",
    ]);
  });

  it("opens on Arsenal and lists the default gear in slot order", async () => {
    renderPage();
    expect(screen.getByRole("tab", { name: "Arsenal" })).toHaveAttribute("aria-selected", "true");

    const defaults = await screen.findByRole("heading", { name: "Default arsenal" });
    const block = defaults.closest("section")!;
    // Breastplate comes before Helmet in the game's slot order.
    const names = [...block.querySelectorAll("h3")].map((h) => h.textContent);
    expect(names.indexOf("Standard Breastplate")).toBeLessThan(names.indexOf("Standard Helmet"));
    // A set piece is not part of the default block.
    expect(block.textContent).not.toContain("Swift Belt");
  });

  it("shows each set with both bonuses and its own pieces", async () => {
    renderPage();
    const heading = await screen.findByRole("heading", { name: "Swift Set" });
    const card = heading.closest("section")!;
    expect(card).toHaveTextContent("Fire Rate +100%");
    expect(card).toHaveTextContent("Each shot increases DMG by 15%.");
    // The pieces are listed by name, and the set's quality span sits beside
    // the set name as a coloured label pair.
    expect(card).toHaveTextContent("Swift Belt");
    expect(card).toHaveTextContent("Mythic");
    expect(card).toHaveTextContent("Supreme");
  });

  it("filters the arsenal by name", async () => {
    renderPage();
    await screen.findByText("Standard Helmet");
    await userEvent.type(screen.getByLabelText("Search arsenal"), "helmet");
    expect(screen.queryByText("Standard Breastplate")).not.toBeInTheDocument();
    expect(screen.getByText("Standard Helmet")).toBeInTheDocument();
    // The set no longer has a matching piece, so it drops out too.
    expect(screen.queryByRole("heading", { name: "Swift Set" })).not.toBeInTheDocument();
  });

  it("switches to Hidden Achievements and shows an achievement with its rewards", async () => {
    renderPage();
    await userEvent.click(screen.getByRole("tab", { name: "Hidden Achievements" }));
    const card = (await screen.findByText("Lone Wolf")).closest("article")!;
    // Each reward is an icon tile with its amount, like the game's boxes.
    expect(card).toHaveTextContent("Diamond 3000");
    expect(card).toHaveTextContent("Supply Coin 100");
    // The plate is decorative art, so the quality is announced as text.
    expect(card).toHaveTextContent("quality 3");
  });

  it("opens the achievements sub-tab straight from the URL", async () => {
    renderPage("/final-raid?tab=achievements");
    expect(screen.getByRole("tab", { name: "Hidden Achievements" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    expect(await screen.findByText("Lone Wolf")).toBeInTheDocument();
  });

  it("falls back to Arsenal for an unknown ?tab=", async () => {
    renderPage("/final-raid?tab=nonsense");
    expect(screen.getByRole("tab", { name: "Arsenal" })).toHaveAttribute("aria-selected", "true");
  });

  it("lists achievements with the highest quality first", async () => {
    renderPage("/final-raid?tab=achievements");
    await screen.findByText("Lone Wolf");
    const names = [...document.querySelectorAll("article")].map(
      (card) => card.querySelector("span")?.textContent
    );
    // "Frenzy Master" is quality 4, "Lone Wolf" quality 3, and the server sent
    // them the other way round.
    expect(names).toEqual(["Frenzy Master", "Lone Wolf"]);
  });

  it("filters achievements by name", async () => {
    renderPage("/final-raid?tab=achievements");
    await screen.findByText("Lone Wolf");
    await userEvent.type(screen.getByLabelText("Search achievements"), "frenzy");
    expect(screen.queryByText("Lone Wolf")).not.toBeInTheDocument();
    expect(screen.getByText("Frenzy Master")).toBeInTheDocument();
  });
});
