import { describe, expect, it } from "vitest";
import { EXAMPLE_EVENTS_JSON, eventsToExportJson, imageKey, parseEventsFile, resolveImages } from "./eventsImport";

// Verbatim shape of two records from the game export (wiki export/events.json).
const gacha = {
  id: 1021, config_table: "OpenTimeActivity", name: "Gacha", type: "CollectActivity", category: "draw",
  start: "2026-11-01", end: "2026-11-07", days: 7, min_server_day: 28, featuring: null, icon: null,
  icon_source: null, background: "images/backgrounds/timelimitedrecharge-ad.png", other_backgrounds: [],
  rewards: [{ section: "Collect rewards", note: null, items: [
    { name: "Diamond", amount: null, quality: 4, icon: "images/reward-icons/item-9-diamond.png" },
    { name: "Mission Gold", amount: 5, quality: 0, icon: null },
  ] }],
  dev_label: "26-11月-集字兑换-机甲强化",
};
const airWar = {
  id: 5032, config_table: "OpenTimeActivity", name: "Air War Simulation", type: "Tactic", category: "rank",
  start: "2026-11-08", end: "2026-11-10", days: 3, min_server_day: 28, featuring: "Slash Fighter + Volt Kunai",
  icon: "images/event-icons/main-lefticon-tactic-150021.png", background: "images/backgrounds/tactics-ads-bg-150021.png",
  other_backgrounds: ["images/backgrounds/bg-quest-01.png"], rewards: [],
};

describe("imageKey", () => {
  it("drops folder and extension, so .png in the JSON matches a .webp on disk", () => {
    expect(imageKey("images/reward-icons/item-9-diamond.png")).toBe("item-9-diamond");
    expect(imageKey("item-9-diamond.webp")).toBe("item-9-diamond");
    expect(imageKey(null)).toBe(null);
    expect(imageKey("")).toBe(null);
  });
});

describe("parseEventsFile — the game's export", () => {
  it("maps fields, drops dev-only ones, and collects image keys", () => {
    const r = parseEventsFile({ events: [gacha, airWar] });
    expect(r.error).toBeUndefined();
    expect(r.events).toHaveLength(2);
    expect(r.events[0]).toMatchObject({
      gameId: 1021, name: "Gacha", category: "draw", startDate: "2026-11-01", endDate: "2026-11-07",
      minServerDay: 28, featuring: null, iconUrl: null, backgroundUrl: "timelimitedrecharge-ad", otherBackgrounds: [],
    });
    expect(r.events[0]).not.toHaveProperty("dev_label");
    expect(r.events[0].rewards[0].items[0]).toEqual({ name: "Diamond", amount: null, quality: 4, iconUrl: "item-9-diamond" });
    expect(r.events[0].rewards[0].items[1].iconUrl).toBe(null);
    expect(r.events[1].otherBackgrounds).toEqual(["bg-quest-01"]);
    expect(r.imageKeys.sort()).toEqual([
      "bg-quest-01", "item-9-diamond", "main-lefticon-tactic-150021", "tactics-ads-bg-150021", "timelimitedrecharge-ad",
    ]);
  });

  it("imports seasons and Final Raid as 'season' events with ids that cannot clash", () => {
    const r = parseEventsFile({
      events: [],
      seasons: [{ name: "Shadow Judgement", start: "2026-10-01", end: "2026-10-31", id: 22 }],
      final_raid: [{ name: "Final Raid S11", start: "2027-04-05", end: null, id: 12 }],
    });
    expect(r.events.map((e) => [e.name, e.category, e.gameId])).toEqual([
      ["Shadow Judgement", "season", 900022],
      ["Final Raid S11", "season", 910012],
    ]);
    // An open-ended Final Raid gets the usual 4-week block (28 days) and says so.
    expect(r.events[1].endDate).toBe("2027-05-02");
    expect(r.notes.join(" ")).toContain("Final Raid S11");
  });

  it("reports a readable error for a file that is not an events file", () => {
    expect(parseEventsFile({ hello: 1 }).error).toBeTruthy();
    expect(parseEventsFile("nope").error).toBeTruthy();
    expect(parseEventsFile({ events: [{ ...gacha, start: "soon" }] }).error).toContain("Gacha");
  });
});

describe("parseEventsFile — checks the server would make anyway", () => {
  // The preview must catch these BEFORE any image is uploaded.
  it("rejects a repeated id, naming it", () => {
    const r = parseEventsFile({ events: [gacha, { ...gacha, name: "Gacha 2" }] });
    expect(r.error).toContain("1021");
  });
  it("rejects a date that does not exist (2026-02-30)", () => {
    expect(parseEventsFile({ events: [{ ...gacha, start: "2026-02-30", end: "2026-03-02" }] }).error).toContain("Gacha");
  });
  it("rejects a negative or fractional reward amount", () => {
    const bad = { ...gacha, rewards: [{ section: "S", items: [{ name: "X", amount: 1.5, quality: 1, icon: null }] }] };
    expect(parseEventsFile({ events: [bad] }).error).toContain("amount");
  });
});

describe("parseEventsFile — our own export", () => {
  it("round-trips through eventsToExportJson without touching urls", () => {
    const own = [{
      id: "uuid-1", gameId: 7, name: "Mine", category: "shop", startDate: "2026-12-01", endDate: "2026-12-02",
      minServerDay: null, featuring: null, iconUrl: "/uploads/i.webp", backgroundUrl: "/uploads/b.webp",
      otherBackgrounds: [], rewards: [],
    }];
    const r = parseEventsFile(JSON.parse(eventsToExportJson(own as never)));
    expect(r.error).toBeUndefined();
    expect(r.events[0]).toMatchObject({ gameId: 7, name: "Mine", iconUrl: "/uploads/i.webp", backgroundUrl: "/uploads/b.webp" });
    expect(r.imageKeys).toEqual([]); // urls are already resolved — nothing to look up
  });
});

describe("resolveImages", () => {
  const parsed = parseEventsFile({ events: [gacha] });
  it("swaps registered keys for urls and lists keys nobody has uploaded", () => {
    const out = resolveImages(parsed.events, new Map([["item-9-diamond", "/uploads/d.webp"]]));
    expect(out.events[0].rewards[0].items[0].iconUrl).toBe("/uploads/d.webp");
    expect(out.events[0].backgroundUrl).toBe(null); // unknown key -> null, event still imports
    expect(out.missing).toEqual(["timelimitedrecharge-ad"]);
  });
});

describe("EXAMPLE_EVENTS_JSON", () => {
  it("is valid JSON that the importer itself accepts", () => {
    const r = parseEventsFile(JSON.parse(EXAMPLE_EVENTS_JSON));
    expect(r.error).toBeUndefined();
    expect(r.events.length).toBeGreaterThan(0);
  });
});
