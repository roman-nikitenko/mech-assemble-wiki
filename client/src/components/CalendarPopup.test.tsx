import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CalendarPopup } from "./CalendarPopup";
import type { CalendarEvent } from "../api/types";

const ev = (over: Partial<CalendarEvent>): CalendarEvent => ({
  id: over.name ?? "x", gameId: null, name: "x", category: "draw", startDate: "2026-11-01", endDate: "2026-11-07",
  minServerDay: null, featuring: null, iconUrl: null, backgroundUrl: null, otherBackgrounds: [],
  rewards: [{ section: "Pool", note: null, items: [] }], ...over,
});
let reply: CalendarEvent[];
let urls: string[];

function renderPopup() {
  vi.spyOn(globalThis, "fetch").mockImplementation((input) => {
    urls.push(String(input));
    return Promise.resolve(new Response(JSON.stringify(reply), { status: 200, headers: { "Content-Type": "application/json" } }));
  });
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter><CalendarPopup /></MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  // "Today" is 22 Nov 2026: Gacha is running, Air War is upcoming.
  reply = [ev({ name: "Gacha", startDate: "2026-11-20", endDate: "2026-11-26" }), ev({ name: "Air War Simulation", category: "rank", startDate: "2026-11-25", endDate: "2026-11-28" })];
  urls = [];
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-22T12:00:00Z"));
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  localStorage.clear();
});

const open = () => userEvent.click(screen.getByRole("button", { name: "Event calendar" }));

describe("CalendarPopup", () => {
  it("is closed until the icon is clicked, then lists the current month's events", async () => {
    renderPopup();
    expect(screen.queryByRole("dialog", { name: "Events this month" })).not.toBeInTheDocument();
    expect(urls).toHaveLength(0); // nothing fetched while closed
    await open();
    const panel = await screen.findByRole("dialog", { name: "Events this month" });
    expect(within(panel).getByText("November 2026")).toBeInTheDocument();
    expect(await within(panel).findByText("Gacha")).toBeInTheDocument();
    expect(within(panel).getByText("Air War Simulation")).toBeInTheDocument();
    expect(urls[0]).toContain("from=2026-11-01&to=2026-11-30");
  });

  it("hides events that already ended, but keeps one that ends today", async () => {
    reply = [
      ev({ name: "Old Draw", startDate: "2026-11-01", endDate: "2026-11-07" }),
      ev({ name: "Ends Today", startDate: "2026-11-16", endDate: "2026-11-22" }),
      ev({ name: "Later", startDate: "2026-11-27", endDate: "2026-11-30" }),
    ];
    renderPopup();
    await open();
    const panel = await screen.findByRole("dialog", { name: "Events this month" });
    expect(await within(panel).findByText("Ends Today")).toBeInTheDocument();
    expect(within(panel).getByText("Later")).toBeInTheDocument();
    expect(within(panel).queryByText("Old Draw")).not.toBeInTheDocument();
  });

  it("says so when the month only had ended events", async () => {
    reply = [ev({ name: "Old Draw", startDate: "2026-11-01", endDate: "2026-11-07" })];
    renderPopup();
    await open();
    expect(await screen.findByText(/No running or upcoming events in November 2026/)).toBeInTheDocument();
  });

  it("can't go back before the current month (it could only show ended events)", async () => {
    renderPopup();
    await open();
    await screen.findByText("Gacha");
    expect(screen.getByRole("button", { name: "Previous month" })).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: "Next month" }));
    expect(screen.getByRole("button", { name: "Previous month" })).toBeEnabled();
  });

  it("closes on Escape and on an outside click", async () => {
    renderPopup();
    await open();
    await screen.findByRole("dialog", { name: "Events this month" });
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "Events this month" })).not.toBeInTheDocument();
    await open();
    await screen.findByRole("dialog", { name: "Events this month" });
    await userEvent.click(document.body);
    expect(screen.queryByRole("dialog", { name: "Events this month" })).not.toBeInTheDocument();
  });

  it("moves focus into the popup on open and back to the icon on Escape", async () => {
    renderPopup();
    await open();
    const panel = await screen.findByRole("dialog", { name: "Events this month" });
    expect(panel.contains(document.activeElement)).toBe(true);
    await userEvent.keyboard("{Escape}");
    expect(screen.getByRole("button", { name: "Event calendar" })).toHaveFocus();
  });

  it("returns focus to the icon after the detail card from a row is closed", async () => {
    renderPopup();
    await open();
    await userEvent.click(await screen.findByRole("button", { name: /Gacha/ }));
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "Gacha" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Event calendar" })).toHaveFocus();
  });

  it("Next month asks the server for December", async () => {
    renderPopup();
    await open();
    await screen.findByText("Gacha");
    await userEvent.click(screen.getByRole("button", { name: "Next month" }));
    expect(await screen.findByText("December 2026")).toBeInTheDocument();
    await waitFor(() => expect(urls.some((u) => u.includes("from=2026-12-01&to=2026-12-31"))).toBe(true));
  });

  it("wraps from December into the next year", async () => {
    renderPopup();
    await open();
    await userEvent.click(screen.getByRole("button", { name: "Next month" }));
    await userEvent.click(screen.getByRole("button", { name: "Next month" }));
    expect(await screen.findByText("January 2027")).toBeInTheDocument();
  });

  it("opens the detail card when a row is clicked", async () => {
    renderPopup();
    await open();
    await userEvent.click(await screen.findByRole("button", { name: /Gacha/ }));
    expect(screen.getByRole("dialog", { name: "Gacha" })).toBeInTheDocument();
  });

  it("shows an empty state and a link to the full calendar", async () => {
    reply = [];
    renderPopup();
    await open();
    expect(await screen.findByText(/No running or upcoming events in November 2026/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Open full calendar/ })).toHaveAttribute("href", "/calendar");
  });
});
