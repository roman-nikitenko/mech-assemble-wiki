import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CalendarPage } from "./CalendarPage";
import type { CalendarEvent } from "../api/types";

const ev = (over: Partial<CalendarEvent>): CalendarEvent => ({
  id: over.name ?? "x", gameId: null, name: "x", category: "draw", startDate: "2026-11-01", endDate: "2026-11-07",
  minServerDay: null, featuring: null, iconUrl: null, backgroundUrl: null, otherBackgrounds: [], rewards: [], ...over,
});
const EVENTS: CalendarEvent[] = [
  ev({ name: "Gacha", category: "draw", startDate: "2026-11-01", endDate: "2026-11-07" }),
  ev({ name: "Dark Raid", category: "guild", startDate: "2026-11-20", endDate: "2026-11-26" }),
  ev({ name: "Soon Event", category: "rank", startDate: "2026-11-25", endDate: "2026-11-28" }),
  ev({
    name: "Wasteland Expedition", category: "explore", startDate: "2026-10-25", endDate: "2026-11-02", minServerDay: 28,
    rewards: [{ section: "Ranking: Rank 1", note: "7 reward tiers", items: [
      { name: "Diamond", amount: 3000, quality: 4, iconUrl: "/uploads/d.webp" },
      { name: "Mission Gold", amount: null, quality: 0, iconUrl: null },
    ] }],
  }),
  ev({ name: "Dark Starfall", category: "season", startDate: "2026-11-01", endDate: "2026-11-30" }),
];

function renderPage() {
  vi.spyOn(globalThis, "fetch").mockImplementation(() =>
    Promise.resolve(new Response(JSON.stringify(EVENTS), { status: 200, headers: { "Content-Type": "application/json" } })),
  );
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter><CalendarPage /></MemoryRouter>
    </QueryClientProvider>,
  );
}

// Only Date is faked, so react-query/timeouts keep working. "Today" = 22 Nov 2026.
beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-22T12:00:00Z"));
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  localStorage.clear();
});

const timeline = () => screen.findByRole("region", { name: "Event timeline" });

describe("CalendarPage timeline", () => {
  it("shows a bar per event overlapping the month, seasons last", async () => {
    renderPage();
    const tl = await timeline();
    const bars = within(tl).getAllByRole("button").map((b) => b.textContent ?? "");
    expect(bars.some((t) => t.includes("Gacha"))).toBe(true);
    expect(bars.at(-1)).toContain("Dark Starfall");
  });

  it("marks an event that started in the previous month with ‹", async () => {
    renderPage();
    const tl = await timeline();
    const bar = within(tl).getByRole("button", { name: /Wasteland Expedition ·/ });
    expect(bar.textContent).toContain("‹");
  });

  it("opens the detail modal with rewards, server day, and a ? tile for a random drop", async () => {
    renderPage();
    const tl = await timeline();
    await userEvent.click(within(tl).getByRole("button", { name: /Wasteland Expedition ·/ }));
    const dialog = screen.getByRole("dialog", { name: "Wasteland Expedition" });
    expect(within(dialog).getByText(/Ranking: Rank 1/)).toBeInTheDocument();
    expect(within(dialog).getByText(/7 reward tiers/)).toBeInTheDocument();
    expect(within(dialog).getByText(/Server day 28\+/)).toBeInTheDocument();
    expect(within(dialog).getByText("×3,000")).toBeInTheDocument(); // badge only when amount is set
    expect(within(dialog).getByText("?")).toBeInTheDocument(); // icon-less random drop
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "Wasteland Expedition" })).not.toBeInTheDocument();
  });

  it("hides a category when its chip is switched off", async () => {
    renderPage();
    const tl = await timeline();
    expect(within(tl).getByRole("button", { name: /Gacha ·/ })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Draws & lotteries" }));
    expect(within(tl).queryByRole("button", { name: /Gacha ·/ })).not.toBeInTheDocument();
  });

  it("shows an empty state for a month with no events", async () => {
    renderPage();
    await timeline();
    await userEvent.click(screen.getByRole("button", { name: "Next month" }));
    expect(await screen.findByText(/No events in December 2026/)).toBeInTheDocument();
  });
});

describe("CalendarPage time zone", () => {
  it("shows when an event opens/closes in the chosen zone (Kyiv winter = UTC+2)", async () => {
    localStorage.setItem("evcal-tz", "Europe/Kyiv");
    renderPage();
    const tl = await timeline();
    await userEvent.click(within(tl).getByRole("button", { name: /Gacha ·/ }));
    const dialog = screen.getByRole("dialog", { name: "Gacha" });
    // Gacha runs 1–7 Nov: opens 00:00 UTC on the 1st = 02:00 Kyiv; closes 00:00 UTC on the 8th = 02:00 Kyiv.
    expect(within(dialog).getByText(/Opens/)).toHaveTextContent("02:00");
    expect(within(dialog).getByText(/Closes/)).toHaveTextContent("02:00");
  });

  it("changing the preset re-renders the times and remembers the choice", async () => {
    renderPage();
    const tl = await timeline();
    await userEvent.selectOptions(screen.getByLabelText("Show times in"), "UTC");
    expect(localStorage.getItem("evcal-tz")).toBe("UTC");
    await userEvent.click(within(tl).getByRole("button", { name: /Gacha ·/ }));
    expect(within(screen.getByRole("dialog", { name: "Gacha" })).getByText(/Opens/)).toHaveTextContent("00:00");
  });
});

describe("CalendarPage lists", () => {
  it("puts running events under 'Running now' and near-future ones under 'Starting soon'", async () => {
    renderPage();
    await timeline();
    const running = screen.getByRole("region", { name: "Running now" });
    expect(within(running).getByText("Dark Raid")).toBeInTheDocument();
    expect(within(running).queryByText("Gacha")).not.toBeInTheDocument(); // ended
    expect(within(running).queryByText("Dark Starfall")).not.toBeInTheDocument(); // seasons are not "events to join"
    const soon = screen.getByRole("region", { name: "Starting soon" });
    expect(within(soon).getByText("Soon Event")).toBeInTheDocument();
  });
});
