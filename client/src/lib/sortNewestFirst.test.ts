import { describe, expect, it } from "vitest";
import { sortNewestFirst } from "./sortNewestFirst";

const item = (name: string, createdAt: string) => ({ name, createdAt });

describe("sortNewestFirst", () => {
  it("puts the most recently created item first", () => {
    const out = sortNewestFirst([
      item("Old", "2026-01-01T00:00:00.000Z"),
      item("New", "2026-03-01T00:00:00.000Z"),
      item("Mid", "2026-02-01T00:00:00.000Z"),
    ]);
    expect(out.map((i) => i.name)).toEqual(["New", "Mid", "Old"]);
  });

  it("breaks equal timestamps by name", () => {
    const t = "2026-01-01T00:00:00.000Z";
    const out = sortNewestFirst([item("Zed", t), item("Abe", t), item("Moe", t)]);
    expect(out.map((i) => i.name)).toEqual(["Abe", "Moe", "Zed"]);
  });

  it("does not mutate the input array", () => {
    const input = [item("B", "2026-01-01T00:00:00.000Z"), item("A", "2026-02-01T00:00:00.000Z")];
    sortNewestFirst(input);
    expect(input.map((i) => i.name)).toEqual(["B", "A"]);
  });
});
