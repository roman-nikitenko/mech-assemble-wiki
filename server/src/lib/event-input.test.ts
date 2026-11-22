import { describe, expect, it } from "vitest";
import { MAX_IMPORT_EVENTS, parseAssetBulk, parseEventImport, parseEventInput } from "./event-input";

const base = { name: "Gacha", category: "draw", startDate: "2026-11-01", endDate: "2026-11-07" };

describe("parseEventInput", () => {
  it("accepts a minimal valid event and fills defaults", () => {
    const r = parseEventInput(base);
    expect(r).toEqual({
      ok: true,
      value: {
        gameId: null, name: "Gacha", category: "draw", startDate: "2026-11-01", endDate: "2026-11-07",
        minServerDay: null, featuring: null, iconUrl: null, backgroundUrl: null, otherBackgrounds: [], rewards: [],
      },
    });
  });

  it("rejects end before start", () => {
    const r = parseEventInput({ ...base, endDate: "2026-10-31" });
    expect(r.ok).toBe(false);
  });

  it("rejects an unknown category", () => {
    expect(parseEventInput({ ...base, category: "party" }).ok).toBe(false);
  });

  it("rejects an impossible calendar date", () => {
    expect(parseEventInput({ ...base, startDate: "2026-13-40" }).ok).toBe(false);
    expect(parseEventInput({ ...base, startDate: "2026-02-30" }).ok).toBe(false);
  });

  it("keeps a null reward amount (a pool) and rejects a text amount", () => {
    const ok = parseEventInput({
      ...base,
      rewards: [{ section: "Pool", note: null, items: [{ name: "Diamond", amount: null, quality: 4, iconUrl: null }] }],
    });
    expect(ok.ok && ok.value.rewards[0].items[0].amount).toBe(null);
    const bad = parseEventInput({
      ...base,
      rewards: [{ section: "Pool", items: [{ name: "Diamond", amount: "x", quality: 4 }] }],
    });
    expect(bad.ok).toBe(false);
  });

  it("turns a blank reward icon into null and rejects a non-upload url", () => {
    const ok = parseEventInput({
      ...base,
      rewards: [{ section: "S", items: [{ name: "A", amount: 1, quality: 1, iconUrl: "  " }] }],
    });
    expect(ok.ok && ok.value.rewards[0].items[0].iconUrl).toBe(null);
    expect(parseEventInput({ ...base, iconUrl: "http://evil.example/x.png" }).ok).toBe(false);
    expect(parseEventInput({ ...base, iconUrl: "/uploads/a.webp" }).ok).toBe(true);
  });
});

describe("parseEventImport", () => {
  it("rejects two events with the same gameId, naming it", () => {
    const r = parseEventImport({ events: [{ ...base, gameId: 5 }, { ...base, name: "B", gameId: 5 }] });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toContain("5");
  });

  it("rejects more than the cap", () => {
    const events = Array.from({ length: MAX_IMPORT_EVENTS + 1 }, (_, i) => ({ ...base, gameId: i }));
    expect(parseEventImport({ events }).ok).toBe(false);
  });

  it("prefixes a validation error with the event name", () => {
    const r = parseEventImport({ events: [{ ...base, category: "nope" }] });
    expect(!r.ok && r.message.startsWith("Event Gacha: ")).toBe(true);
  });
});

describe("parseAssetBulk", () => {
  it("accepts key/url pairs and rejects a url outside /uploads/", () => {
    expect(parseAssetBulk({ assets: [{ key: "item-9-diamond", url: "/uploads/a.webp" }] }).ok).toBe(true);
    expect(parseAssetBulk({ assets: [{ key: "x", url: "https://x.y/z.png" }] }).ok).toBe(false);
  });
});
