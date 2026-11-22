import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EventTimeline } from "./EventTimeline";
import type { CalendarEvent } from "../api/types";

const ev = (name: string, startDate: string, endDate: string): CalendarEvent => ({
  id: name, gameId: null, name, category: "draw", startDate, endDate, minServerDay: null, featuring: null,
  iconUrl: null, backgroundUrl: null, otherBackgrounds: [], rewards: [],
});
const EARLY = ev("Early Draw", "2026-11-01", "2026-11-04");
const LATE = ev("Late Raid", "2026-11-25", "2026-11-30"); // far right: the hard-to-track case

const scrollTo = vi.fn();
beforeEach(() => {
  // jsdom has no layout and no Element.scrollTo; stub it so we can see the call.
  Element.prototype.scrollTo = scrollTo as never;
});
afterEach(() => scrollTo.mockClear());

function renderTimeline(onSelect = vi.fn()) {
  render(<EventTimeline events={[EARLY, LATE]} year={2026} month={10} today="2026-11-22" onSelect={onSelect} />);
  return onSelect;
}
const rowOf = (name: string) => screen.getByRole("button", { name: new RegExp(`${name} ·`) }).closest("[data-event-row]") as HTMLElement;
const nameBtn = (name: string) => screen.getByRole("button", { name: `Highlight ${name}` });

describe("EventTimeline row highlight (desktop hover)", () => {
  it("highlights the whole row while the mouse is on the bar, and clears it on leave", async () => {
    renderTimeline();
    const bar = screen.getByRole("button", { name: /Late Raid ·/ });
    expect(rowOf("Late Raid")).not.toHaveAttribute("data-highlighted");
    await userEvent.hover(bar);
    expect(rowOf("Late Raid")).toHaveAttribute("data-highlighted", "true");
    expect(rowOf("Early Draw")).not.toHaveAttribute("data-highlighted");
    await userEvent.unhover(bar);
    expect(rowOf("Late Raid")).not.toHaveAttribute("data-highlighted");
  });

  it("highlights the row when hovering the NAME too (the name is far from a late bar)", async () => {
    renderTimeline();
    await userEvent.hover(nameBtn("Late Raid"));
    expect(rowOf("Late Raid")).toHaveAttribute("data-highlighted", "true");
  });
});

describe("EventTimeline name tap (mobile)", () => {
  it("highlights the row WITHOUT scrolling anywhere", async () => {
    const onSelect = renderTimeline();
    await userEvent.click(nameBtn("Late Raid"));
    expect(scrollTo).not.toHaveBeenCalled();
    expect(nameBtn("Late Raid")).toHaveAttribute("aria-pressed", "true");
    expect(rowOf("Late Raid")).toHaveAttribute("data-highlighted", "true");
    expect(onSelect).not.toHaveBeenCalled(); // a name tap only highlights; the BAR opens the card
  });

  it("moves the highlight to another event, and a second tap on the same name clears it", async () => {
    renderTimeline();
    await userEvent.click(nameBtn("Late Raid"));
    await userEvent.click(nameBtn("Early Draw"));
    expect(nameBtn("Late Raid")).toHaveAttribute("aria-pressed", "false");
    expect(nameBtn("Early Draw")).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(nameBtn("Early Draw"));
    expect(nameBtn("Early Draw")).toHaveAttribute("aria-pressed", "false");
    await userEvent.unhover(nameBtn("Early Draw")); // the (simulated) mouse is still on the name
    expect(rowOf("Early Draw")).not.toHaveAttribute("data-highlighted");
  });

  it("a tap on the bar still opens the detail card", async () => {
    const onSelect = renderTimeline();
    await userEvent.click(screen.getByRole("button", { name: /Late Raid ·/ }));
    expect(onSelect).toHaveBeenCalledWith(LATE);
  });
});

describe("EventTimeline layout", () => {
  it("is the same at every screen width: fixed minimum width (scrolls sideways on a phone) and a plain name column", () => {
    renderTimeline();
    const inner = screen.getByRole("region", { name: "Event timeline" }).firstElementChild as HTMLElement;
    expect(inner.className).toMatch(/(^|\s)min-w-\[860px\]/);
    expect(nameBtn("Late Raid").className).not.toContain("sticky");
    expect(nameBtn("Late Raid").style.position).toBe("");
  });

  it("keeps the dates on the bar, not under the name", () => {
    renderTimeline();
    expect(nameBtn("Late Raid")).toHaveTextContent(/^Late Raid$/);
    expect(screen.getByRole("button", { name: /Late Raid ·/ })).toHaveTextContent("25 Nov–30 Nov");
  });
});
