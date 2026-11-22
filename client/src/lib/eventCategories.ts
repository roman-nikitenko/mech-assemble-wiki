import type { EventCategory } from "../api/types";

// One place for the six event categories: label + colour. The colours match the
// game's calendar demo (draw violet, guild amber, explore teal, rank blue,
// shop pink, season grey). Used by the admin filter, the timeline and the popup.
export const EVENT_CATEGORIES: { value: EventCategory; label: string; color: string }[] = [
  { value: "draw", label: "Draws & lotteries", color: "#8b5cf6" },
  { value: "guild", label: "Guild & PvP", color: "#f59e0b" },
  { value: "explore", label: "Exploration", color: "#14b8a6" },
  { value: "rank", label: "Power & Air War", color: "#3b82f6" },
  { value: "shop", label: "Recharge", color: "#ec4899" },
  { value: "season", label: "Seasons & Final Raid", color: "#64748b" },
];

export const categoryInfo = (c: EventCategory) => EVENT_CATEGORIES.find((x) => x.value === c)!;

const FILTER_KEY = "evcal-filter";

/** Categories the visitor switched OFF (saved, so the choice survives a reload).
    We store the hidden ones so a category added later shows up by default. */
export function readHiddenCategories(): EventCategory[] {
  try {
    const raw = JSON.parse(localStorage.getItem(FILTER_KEY) ?? "[]");
    return Array.isArray(raw) ? raw.filter((c): c is EventCategory => EVENT_CATEGORIES.some((x) => x.value === c)) : [];
  } catch {
    return [];
  }
}

export function saveHiddenCategories(hidden: EventCategory[]): void {
  try {
    localStorage.setItem(FILTER_KEY, JSON.stringify(hidden));
  } catch {
    // Storage blocked: the filter just won't be remembered.
  }
}
