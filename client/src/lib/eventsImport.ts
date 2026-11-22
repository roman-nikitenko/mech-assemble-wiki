// Reading event JSON files (the admin's "Import JSON") and writing our own export.
// Two shapes are accepted:
//   1. The game export (wiki export/events.json): { events: [{id, start, end,
//      background, icon, rewards...}], seasons: [...], final_raid: [...] }
//   2. Our own export: { format: "mech-assemble-events", events: [{gameId,
//      startDate, endDate, iconUrl...}] } — image urls are already resolved.
//
// Images: the game refers to art by path ("images/reward-icons/item-9-diamond.png").
// The media library renames uploads, so we reduce each path to a KEY
// ("item-9-diamond") and look it up in the event_assets registry later
// (resolveImages). To keep one event type through the whole pipeline, an image
// field holds either a finished "/uploads/..." url or a not-yet-resolved key.

import type { CalendarEvent, EventCategory, EventInput, RewardItem, RewardSection } from "../api/types";
import { addDays } from "./eventDates";

export const EXPORT_FORMAT = "mech-assemble-events";
const CATEGORIES: EventCategory[] = ["draw", "guild", "explore", "rank", "shop", "season"];
// Seasons/Final Raid come with small ids (22, 12) that could equal an event run id,
// and game_id is the import's upsert key — so shift them into their own ranges.
const SEASON_ID_BASE = 900_000;
const FINAL_RAID_ID_BASE = 910_000;
const FINAL_RAID_DAYS = 28; // a Final Raid block is 4 weeks

/** "images/reward-icons/item-9-diamond.png" -> "item-9-diamond" (folder and
    extension dropped, so a .png in the JSON still matches a .webp on disk). */
export function imageKey(path: string | null | undefined): string | null {
  if (!path) return null;
  const file = path.split("/").pop() ?? "";
  const key = file.replace(/\.[a-z0-9]+$/i, "");
  return key === "" ? null : key;
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
// A REAL day: "2026-02-30" matches the pattern but rolls over to March, so round-trip it.
const isDay = (v: unknown): v is string => {
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
};

export interface ParsedEventsFile {
  /** Image fields hold a finished "/uploads/…" url or an unresolved key. */
  events: EventInput[];
  /** Every key that still needs a registry lookup / uploaded file. */
  imageKeys: string[];
  /** Things the admin should know about (defaults we applied). */
  notes: string[];
  error?: string;
}

function parseFile(json: unknown): ParsedEventsFile {
  const keys = new Set<string>();
  const notes: string[] = [];
  // A finished upload url stays; anything else is a game path -> key (remembered).
  const ref = (v: unknown): string | null => {
    if (typeof v !== "string" || v.trim() === "") return null;
    if (v.startsWith("/uploads/")) return v;
    const k = imageKey(v);
    if (k) keys.add(k);
    return k;
  };
  const err = (error: string): ParsedEventsFile => ({ events: [], imageKeys: [], notes: [], error });

  if (!isRecord(json)) return err("The file must be a JSON object like { \"events\": [ ... ] }.");
  if (!Array.isArray(json.events)) return err("The file needs an \"events\" array.");

  const events: EventInput[] = [];
  const seenIds = new Set<number>();
  for (const [i, raw] of json.events.entries()) {
    if (!isRecord(raw)) return err(`Event #${i + 1} must be an object.`);
    const name = typeof raw.name === "string" ? raw.name.trim() : "";
    const label = name || `#${i + 1}`;
    const start = raw.startDate ?? raw.start;
    const end = raw.endDate ?? raw.end;
    if (name === "") return err(`Event ${label} needs a name.`);
    if (!CATEGORIES.includes(raw.category as EventCategory)) {
      return err(`Event ${label}: category must be one of ${CATEGORIES.join(", ")}.`);
    }
    if (!isDay(start) || !isDay(end)) return err(`Event ${label}: start and end must be dates like 2026-11-01.`);
    if (end < start) return err(`Event ${label}: the end date is before the start date.`);

    const rewards: RewardSection[] = [];
    for (const s of Array.isArray(raw.rewards) ? raw.rewards : []) {
      if (!isRecord(s)) continue;
      const items: RewardItem[] = [];
      for (const it of Array.isArray(s.items) ? s.items : []) {
        if (!isRecord(it)) continue;
        // The server insists on a whole, non-negative amount; say so here, before any upload.
        if (typeof it.amount === "number" && (!Number.isInteger(it.amount) || it.amount < 0)) {
          return err(`Event ${label}: the reward amount of "${String(it.name ?? "")}" must be a whole number.`);
        }
        items.push({
          name: String(it.name ?? ""),
          amount: typeof it.amount === "number" ? it.amount : null,
          quality: typeof it.quality === "number" ? it.quality : 0,
          iconUrl: ref(it.iconUrl ?? it.icon),
        });
      }
      rewards.push({ section: String(s.section ?? ""), note: typeof s.note === "string" ? s.note : null, items });
    }

    const others = raw.otherBackgrounds ?? raw.other_backgrounds;
    const gameId = typeof raw.gameId === "number" ? raw.gameId : typeof raw.id === "number" ? raw.id : null;
    // Two rows with one id would fight over the same upsert key (the server refuses too).
    if (gameId !== null) {
      if (seenIds.has(gameId)) return err(`Event id ${gameId} appears twice in the file.`);
      seenIds.add(gameId);
    }
    events.push({
      gameId: typeof raw.gameId === "number" ? raw.gameId : typeof raw.id === "number" ? raw.id : null,
      name,
      category: raw.category as EventCategory,
      startDate: start,
      endDate: end,
      minServerDay: typeof (raw.minServerDay ?? raw.min_server_day) === "number" ? ((raw.minServerDay ?? raw.min_server_day) as number) : null,
      featuring: typeof raw.featuring === "string" && raw.featuring.trim() ? raw.featuring.trim() : null,
      iconUrl: ref(raw.iconUrl ?? raw.icon),
      backgroundUrl: ref(raw.backgroundUrl ?? raw.background),
      otherBackgrounds: (Array.isArray(others) ? others : []).map(ref).filter((u): u is string => u !== null),
      rewards,
    });
  }

  // Seasons and Final Raid: just a name + date range, stored as "season" events.
  const ranges: [unknown, number, boolean][] = [[json.seasons, SEASON_ID_BASE, false], [json.final_raid, FINAL_RAID_ID_BASE, true]];
  for (const [list, base, openEnded] of ranges) {
    for (const s of Array.isArray(list) ? list : []) {
      if (!isRecord(s) || typeof s.name !== "string" || !isDay(s.start) || typeof s.id !== "number") {
        return err("A season / final_raid entry needs name, start (YYYY-MM-DD) and id.");
      }
      let end = s.end;
      if (end === null || end === undefined) {
        if (!openEnded) return err(`Season ${s.name} needs an end date.`);
        end = addDays(s.start, FINAL_RAID_DAYS - 1);
        notes.push(`${s.name} has no end date yet — set to ${end} (a ${FINAL_RAID_DAYS}-day block). Re-import when the game fixes it.`);
      }
      if (!isDay(end)) return err(`${s.name}: end must be a date like 2026-11-01.`);
      events.push({
        gameId: base + s.id, name: s.name, category: "season", startDate: s.start, endDate: end,
        minServerDay: null, featuring: null, iconUrl: null, backgroundUrl: null, otherBackgrounds: [], rewards: [],
      });
    }
  }
  return { events, imageKeys: [...keys], notes };
}

/** Reads an already-JSON.parse'd file. Never throws: problems come back as `error`. */
export function parseEventsFile(json: unknown): ParsedEventsFile {
  return parseFile(json);
}

/** Replaces keys with registered urls. A key nobody has uploaded becomes null (the
    event still imports without that picture) and is listed in `missing`. */
export function resolveImages(
  events: EventInput[],
  registry: Map<string, string>,
): { events: EventInput[]; missing: string[] } {
  const missing = new Set<string>();
  const url = (v: string | null): string | null => {
    if (v === null || v.startsWith("/uploads/")) return v;
    const hit = registry.get(v);
    if (hit) return hit;
    missing.add(v);
    return null;
  };
  const resolved = events.map((e) => ({
    ...e,
    iconUrl: url(e.iconUrl),
    backgroundUrl: url(e.backgroundUrl),
    otherBackgrounds: e.otherBackgrounds.map(url).filter((u): u is string => u !== null),
    rewards: e.rewards.map((s) => ({ ...s, items: s.items.map((i) => ({ ...i, iconUrl: url(i.iconUrl) })) })),
  }));
  return { events: resolved, missing: [...missing] };
}

/** Our own export file (what "Export JSON" downloads). */
export function eventsToExportJson(events: CalendarEvent[]): string {
  const rows = events.map((e) => ({
    gameId: e.gameId, name: e.name, category: e.category, startDate: e.startDate, endDate: e.endDate,
    minServerDay: e.minServerDay, featuring: e.featuring, iconUrl: e.iconUrl, backgroundUrl: e.backgroundUrl,
    otherBackgrounds: e.otherBackgrounds, rewards: e.rewards,
  }));
  return JSON.stringify({ format: EXPORT_FORMAT, events: rows }, null, 2);
}

/** Shown in the import dialog's hint panel: the game's own shape, shortened. */
export const EXAMPLE_EVENTS_JSON = JSON.stringify(
  {
    events: [
      {
        id: 1021,
        name: "Gacha",
        category: "draw",
        start: "2026-11-01",
        end: "2026-11-07",
        min_server_day: 28,
        featuring: null,
        icon: "images/event-icons/main-lefticon-gacha.png",
        background: "images/backgrounds/timelimitedrecharge-ad.png",
        other_backgrounds: [],
        rewards: [
          {
            section: "Collect rewards",
            note: null,
            items: [
              { name: "Diamond", amount: null, quality: 4, icon: "images/reward-icons/item-9-diamond.png" },
              { name: "Mission Gold", amount: 500, quality: 0, icon: null },
            ],
          },
        ],
      },
    ],
    seasons: [{ id: 22, name: "Shadow Judgement", start: "2026-10-01", end: "2026-10-31" }],
    final_raid: [{ id: 12, name: "Final Raid S11", start: "2027-04-05", end: null }],
  },
  null,
  2,
);
