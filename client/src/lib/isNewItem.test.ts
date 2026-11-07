import { describe, expect, it } from "vitest";
import { isNewItem } from "./isNewItem";

const NOW = Date.parse("2026-11-10T12:00:00.000Z");
const DAY = 24 * 60 * 60 * 1000;
const ago = (ms: number) => new Date(NOW - ms).toISOString();

describe("isNewItem", () => {
  it("is true for an item added just now", () => {
    expect(isNewItem(ago(0), NOW)).toBe(true);
  });

  it("is true up to, but not including, 7 days", () => {
    expect(isNewItem(ago(6 * DAY), NOW)).toBe(true);
    expect(isNewItem(ago(7 * DAY - 1), NOW)).toBe(true);
    expect(isNewItem(ago(7 * DAY), NOW)).toBe(false);
  });

  it("is false for older items", () => {
    expect(isNewItem(ago(30 * DAY), NOW)).toBe(false);
  });

  it("is false for a missing or invalid date", () => {
    expect(isNewItem("", NOW)).toBe(false);
    expect(isNewItem("not-a-date", NOW)).toBe(false);
  });
});
