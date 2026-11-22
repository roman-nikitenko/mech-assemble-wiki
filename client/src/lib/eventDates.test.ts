import { afterEach, describe, expect, it, vi } from "vitest";
import {
  SERVER_OFFSET_HOURS, TZ_PRESETS, addDays, daysInMonth, eventStatus, eventWindow, formatInstant, overlapsMonth,
  readTzChoice, resolveZone, saveTzChoice, timerLabel, todayIso,
} from "./eventDates";

const gacha = { startDate: "2026-11-01", endDate: "2026-11-07" };
const at = (iso: string) => Date.parse(iso);

describe("todayIso", () => {
  it("uses the server offset, not the viewer's zone", () => {
    const now = new Date("2026-11-22T23:30:00Z");
    expect(todayIso(0, now)).toBe("2026-11-22");
    expect(todayIso(2, now)).toBe("2026-11-23");
    expect(todayIso(-12, now)).toBe("2026-11-22");
  });
});

describe("timerLabel", () => {
  it("shows days+hours (green) while more than a day is left", () => {
    // closes 2026-11-08 00:00; 2d 13h 30m left
    expect(timerLabel(gacha, at("2026-11-05T10:30:00Z"), 0)).toEqual({ text: "2D 13H", tone: "live" });
  });
  it("shows HH:MM:SS under a day", () => {
    expect(timerLabel(gacha, at("2026-11-07T20:15:30Z"), 0)).toEqual({ text: "03:44:30", tone: "live" });
  });
  it("shows 'in XD YH' (muted) before it starts", () => {
    expect(timerLabel(gacha, at("2026-10-30T19:00:00Z"), 0)).toEqual({ text: "in 1D 5H", tone: "muted" });
  });
  it("shows 'Ended' once the day after the end begins", () => {
    expect(timerLabel(gacha, at("2026-11-08T00:00:00Z"), 0)).toEqual({ text: "Ended", tone: "muted" });
  });
  it("a positive offset moves the end earlier in the viewer's clock", () => {
    const now = at("2026-11-07T23:00:00Z");
    expect(timerLabel(gacha, now, 0)).toEqual({ text: "01:00:00", tone: "live" });
    expect(timerLabel(gacha, now, 2)).toEqual({ text: "Ended", tone: "muted" });
  });
});

describe("eventStatus", () => {
  it("is running on the first and last day, upcoming before, ended after", () => {
    expect(eventStatus(gacha, "2026-11-01")).toBe("running");
    expect(eventStatus(gacha, "2026-11-07")).toBe("running");
    expect(eventStatus(gacha, "2026-10-31")).toBe("upcoming");
    expect(eventStatus(gacha, "2026-11-08")).toBe("ended");
  });
});

describe("date helpers", () => {
  it("addDays crosses month and year boundaries", () => {
    expect(addDays("2026-11-30", 1)).toBe("2026-12-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });
  it("daysInMonth uses a zero-based month and handles leap years", () => {
    expect(daysInMonth(2026, 10)).toBe(30);
    expect(daysInMonth(2028, 1)).toBe(29);
  });
  it("overlapsMonth is true for an event spanning the boundary, false outside", () => {
    const span = { startDate: "2026-10-25", endDate: "2026-11-02" };
    expect(overlapsMonth(span, 2026, 10)).toBe(true);
    expect(overlapsMonth(span, 2026, 9)).toBe(true);
    expect(overlapsMonth(span, 2026, 11)).toBe(false);
  });
});

describe("the game server clock", () => {
  it("is UTC: a 02:00 (winter) / 03:00 (summer) Kyiv daily reset is 00:00 server time", () => {
    expect(SERVER_OFFSET_HOURS).toBe(0);
    const winter = eventWindow({ startDate: "2026-11-22", endDate: "2026-11-22" });
    const summer = eventWindow({ startDate: "2026-07-01", endDate: "2026-07-01" });
    expect(formatInstant(winter.opensMs, "Europe/Kyiv")).toContain("02:00");
    expect(formatInstant(summer.opensMs, "Europe/Kyiv")).toContain("03:00");
  });
});

describe("eventWindow", () => {
  it("opens at 00:00 on the start day and closes at 00:00 the day AFTER the end day", () => {
    const w = eventWindow(gacha);
    expect(new Date(w.opensMs).toISOString()).toBe("2026-11-01T00:00:00.000Z");
    expect(new Date(w.closesMs).toISOString()).toBe("2026-11-08T00:00:00.000Z");
  });
});

describe("formatInstant", () => {
  it("renders the same moment in different zones", () => {
    const ms = Date.parse("2026-11-22T00:00:00Z");
    expect(formatInstant(ms, "UTC")).toContain("00:00");
    expect(formatInstant(ms, "America/New_York")).toContain("19:00"); // previous evening, UTC-5
  });
});

describe("resolveZone", () => {
  it("'local' becomes the browser's detected zone; a named zone stays as is", () => {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    expect(resolveZone("local")).toBe(detected);
    expect(resolveZone("Europe/Kyiv")).toBe("Europe/Kyiv");
  });
});

describe("time-zone preference", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });
  it("defaults to 'local' (auto-detect), round-trips a preset, and ignores garbage", () => {
    expect(readTzChoice()).toBe("local");
    saveTzChoice("Europe/Kyiv");
    expect(readTzChoice()).toBe("Europe/Kyiv");
    localStorage.setItem("evcal-tz", "Mars/Olympus");
    expect(readTzChoice()).toBe("local");
  });
  it("offers Server (UTC), Ukraine and My local time first", () => {
    expect(TZ_PRESETS.slice(0, 3).map((p) => p.value)).toEqual(["local", "UTC", "Europe/Kyiv"]);
  });
  it("never throws when storage is blocked", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("SecurityError"); });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("SecurityError"); });
    expect(readTzChoice()).toBe("local");
    expect(() => saveTzChoice("UTC")).not.toThrow();
  });
});
