import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AccessorySetsTab } from "./AccessorySetsTab";

const sets = [
  {
    id: "s1", name: "Abyssal Regalia", bonus: "ATK +10% when all three are equipped", sortOrder: 0,
    accessories: [
      {
        id: "a1", name: "Abyssal Gauntlet", tier: "S", iconUrl: null, imageUrl: null,
        attributes: [
          { name: "DEF", value: "15%" },
          { name: "DEF", value: "450" },
        ],
      },
      { id: "a2", name: "Shadow Mask", tier: "S", iconUrl: null, imageUrl: null, attributes: [] },
    ],
  },
];

function renderTab(data = sets) {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(JSON.stringify(data), {
      status: 200, headers: { "Content-Type": "application/json" },
    })
  );
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <AccessorySetsTab />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

afterEach(() => vi.restoreAllMocks());

describe("public AccessorySetsTab", () => {
  it("shows each set's name, its pieces and its bonus", async () => {
    renderTab();
    expect(await screen.findByText("Abyssal Regalia")).toBeInTheDocument();
    // Pieces render as art-only tiles, so their names live in the tooltip and
    // the image alt rather than as visible text.
    expect(screen.getByTitle("Abyssal Gauntlet")).toBeInTheDocument();
    expect(screen.getByTitle("Shadow Mask")).toBeInTheDocument();
    expect(
      screen.getByText("ATK +10% when all three are equipped")
    ).toBeInTheDocument();
  });

  it("says how many pieces a set has", async () => {
    renderTab();
    expect(await screen.findByText(/2 pieces/i)).toBeInTheDocument();
  });

  it("says so when no sets exist", async () => {
    renderTab([]);
    expect(await screen.findByText(/no accessory sets/i)).toBeInTheDocument();
  });

  it("badges a piece that is S-tier", async () => {
    renderTab();
    await screen.findByText("Abyssal Regalia");
    // STierIcon carries role="img" + aria-label="S-tier"; both fixture pieces
    // are S, so both tiles get one.
    expect(screen.getAllByRole("img", { name: "S-tier" })).toHaveLength(2);
  });

  it("leaves a Standard piece unbadged", async () => {
    renderTab([
      {
        ...sets[0],
        accessories: [
          { id: "a3", name: "Armor Belt", tier: "Standard", iconUrl: null, imageUrl: null, attributes: [] },
        ],
      },
    ]);
    await screen.findByText("Abyssal Regalia");
    expect(screen.queryByRole("img", { name: "S-tier" })).not.toBeInTheDocument();
  });

  it("opens a piece's details on click, with its name, set and attributes", async () => {
    renderTab();
    await userEvent.click(await screen.findByRole("button", { name: "Abyssal Gauntlet" }));

    const card = screen.getByRole("dialog", { name: "Abyssal Gauntlet details" });
    expect(card).toHaveTextContent("Abyssal Gauntlet");
    expect(card).toHaveTextContent("Abyssal Regalia");
    expect(card).toHaveTextContent("Basic Attr.");
    // Both stat rows, the percent one and the flat one.
    expect(card).toHaveTextContent("15%");
    expect(card).toHaveTextContent("450");
  });

  it("stays shut until clicked", async () => {
    renderTab();
    await screen.findByRole("button", { name: "Abyssal Gauntlet" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes again on a second click", async () => {
    renderTab();
    const tile = await screen.findByRole("button", { name: "Abyssal Gauntlet" });
    await userEvent.click(tile);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await userEvent.click(tile);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes on Escape", async () => {
    renderTab();
    await userEvent.click(await screen.findByRole("button", { name: "Abyssal Gauntlet" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes when clicking outside it", async () => {
    renderTab();
    await userEvent.click(await screen.findByRole("button", { name: "Abyssal Gauntlet" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await userEvent.click(document.body);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("says so when a piece has no attributes recorded", async () => {
    renderTab();
    await userEvent.click(await screen.findByRole("button", { name: "Shadow Mask" }));
    expect(
      screen.getByRole("dialog", { name: "Shadow Mask details" })
    ).toHaveTextContent(/no attributes recorded/i);
  });

  /** jsdom reports every rect as zeros, so a collision has to be staged.
      `left`/`right` describe where the card WOULD land at its default
      position; the component then decides how far to slide it. */
  function stageViewport(rect: Partial<DOMRect>, w = 800, h = 600) {
    vi.spyOn(window, "innerWidth", "get").mockReturnValue(w);
    vi.spyOn(window, "innerHeight", "get").mockReturnValue(h);
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
      left: 0, right: 0, top: 0, bottom: 0, width: 256, height: 200,
      x: 0, y: 0, toJSON: () => ({}), ...rect,
    } as DOMRect);
  }

  async function openCard() {
    await userEvent.click(await screen.findByRole("button", { name: "Abyssal Gauntlet" }));
    return screen.getByRole("dialog", { name: "Abyssal Gauntlet details" });
  }

  it("leaves the card alone when it already fits", async () => {
    renderTab();
    stageViewport({ left: 100, right: 356, bottom: 300 });
    expect((await openCard()).style.left).toBe("0px");
  });

  it("slides the card left when it runs past the right edge", async () => {
    renderTab();
    // Card would end at 900 on an 800-wide screen: 108px past the 792 limit.
    stageViewport({ left: 644, right: 900, bottom: 300 });
    expect((await openCard()).style.left).toBe("-108px");
  });

  it("does not push a mid-screen card off the LEFT edge while fixing the right", async () => {
    renderTab();
    // The bug this replaced: flipping anchored the card's right edge to the
    // tile and shoved it off the opposite side. Here the leftward correction
    // (-108) would put it at -8, so it must stop at the left margin instead.
    stageViewport({ left: 100, right: 900, bottom: 300 });
    const card = await openCard();
    expect(card.style.left).toBe("-92px"); // 8 - 100, i.e. clamped to EDGE_GAP
  });

  it("opens upward when it would run past the bottom", async () => {
    renderTab();
    stageViewport({ left: 100, right: 356, bottom: 700 });
    const card = await openCard();
    expect(card.className).toContain("bottom-full");
    expect(card.className).not.toContain("top-full");
  });
});
