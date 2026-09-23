import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FinalRaidPage } from "./FinalRaidPage";
import type { ArsenalPiece, ArsenalSet, HiddenAchievement } from "../../api/types";

const sets: ArsenalSet[] = [
  {
    id: "s1",
    name: "Swift Set",
    iconUrl: null,
    twoPieceBonus: "Fire Rate +100%",
    fourPieceBonus: null,
    sortOrder: 0,
    pieceCount: 0,
  },
];

const pieces: ArsenalPiece[] = [
  {
    id: "p1",
    name: "Swift Belt",
    iconUrl: null,
    slot: "Belt",
    qualityMin: 8,
    qualityMax: 13,
    setId: "s1",
    set: { id: "s1", name: "Swift Set" },
    sortOrder: 0,
  },
  {
    id: "p2",
    name: "Computation Rune",
    iconUrl: null,
    slot: "Breastplate",
    qualityMin: 1,
    qualityMax: 6,
    setId: null,
    set: null,
    sortOrder: 0,
  },
];

const achievements: HiddenAchievement[] = [
  {
    id: "a1",
    name: "Lone Wolf",
    description: "Clear the remaining enemies after your teammate is defeated.",
    iconUrl: null,
    tier: 3,
    rewards: ["Diamond x1,000", "Supply Coin x100"],
    sortOrder: 0,
  },
];

/** Each tab calls its own endpoint, so answer by URL. */
function renderPage(path = "/admin/final-raid") {
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

describe("FinalRaidPage", () => {
  it("shows the three tabs with Arsenal selected by default", () => {
    renderPage();
    expect(screen.getByRole("tab", { name: "Arsenal" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Set arsenal" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Hidden achievements" })).toBeInTheDocument();
  });

  it("lists arsenal pieces with slot, quality range and set", async () => {
    renderPage();
    const setRow = (await screen.findByText("Swift Belt")).closest("tr")!;
    expect(setRow).toHaveTextContent("Belt");
    expect(setRow).toHaveTextContent("Mythic");
    expect(setRow).toHaveTextContent("Supreme");
    expect(setRow).toHaveTextContent("Swift Set");
    // A piece without a set is labelled Normal.
    expect(screen.getByText("Computation Rune").closest("tr")).toHaveTextContent("Normal");
  });

  it("filters pieces to normal arsenal only", async () => {
    renderPage();
    await screen.findByText("Swift Belt");
    await userEvent.selectOptions(screen.getByLabelText("Filter by set"), "normal");
    expect(screen.queryByText("Swift Belt")).not.toBeInTheDocument();
    expect(screen.getByText("Computation Rune")).toBeInTheDocument();
  });

  it("filters pieces by slot", async () => {
    renderPage();
    await screen.findByText("Swift Belt");
    await userEvent.selectOptions(screen.getByLabelText("Filter by slot"), "Breastplate");
    expect(screen.queryByText("Swift Belt")).not.toBeInTheDocument();
    expect(screen.getByText("Computation Rune")).toBeInTheDocument();
  });

  it("switches to the Set arsenal tab and lists sets with their bonuses", async () => {
    renderPage();
    await userEvent.click(screen.getByRole("tab", { name: "Set arsenal" }));
    expect(await screen.findByText("Swift Set")).toBeInTheDocument();
    expect(screen.getByText("Fire Rate +100%")).toBeInTheDocument();
    // A missing 4-piece bonus shows a dash rather than an empty cell.
    expect(screen.getByText("—")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "+ New set" })).toHaveAttribute(
      "href",
      "/admin/final-raid/sets/new"
    );
  });

  it("lists hidden achievements with their rewards and quality", async () => {
    renderPage("/admin/final-raid?tab=achievements");
    const row = (await screen.findByText("Lone Wolf")).closest("tr")!;
    expect(row).toHaveTextContent("Diamond x1,000, Supply Coin x100");
    // The quality plate is decorative art, so the tier is announced in text.
    expect(row).toHaveTextContent("Quality 3");
    expect(screen.getByRole("link", { name: "+ New achievement" })).toHaveAttribute(
      "href",
      "/admin/final-raid/achievements/new"
    );
  });

  it("filters achievements by quality", async () => {
    renderPage("/admin/final-raid?tab=achievements");
    await screen.findByText("Lone Wolf");
    await userEvent.selectOptions(screen.getByLabelText("Filter by quality"), "1");
    expect(screen.queryByText("Lone Wolf")).not.toBeInTheDocument();
    expect(screen.getByText("No achievements match your filters.")).toBeInTheDocument();
  });

  it("opens the tab named in the URL", async () => {
    renderPage("/admin/final-raid?tab=sets");
    expect(screen.getByRole("tab", { name: "Set arsenal" })).toHaveAttribute("aria-selected", "true");
    expect(await screen.findByText("Swift Set")).toBeInTheDocument();
  });

  it("falls back to Arsenal for an unknown tab", () => {
    renderPage("/admin/final-raid?tab=nonsense");
    expect(screen.getByRole("tab", { name: "Arsenal" })).toHaveAttribute("aria-selected", "true");
  });

  it("asks for confirmation before deleting a set", async () => {
    renderPage("/admin/final-raid?tab=sets");
    await userEvent.click(await screen.findByRole("button", { name: "Delete" }));
    expect(screen.getByRole("dialog")).toHaveTextContent("Delete Swift Set?");
  });
});
