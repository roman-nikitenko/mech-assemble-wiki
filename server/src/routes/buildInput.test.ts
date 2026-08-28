import { describe, expect, it } from "vitest";
import { parseBuildInput } from "./builds";

// Pure validation tests — no database. The supertest suite in builds.test.ts
// covers the same fields end-to-end once a DB is available.
const BASE = { name: "Zap rush" };

describe("parseBuildInput — droneSelections", () => {
  it("defaults to {} when absent", () => {
    expect(parseBuildInput(BASE)?.droneSelections).toEqual({});
  });

  it("keeps a well-formed slot", () => {
    const parsed = parseBuildInput({
      ...BASE,
      droneSelections: { "0": { droneId: "drone-1", quality: 7 } },
    });
    expect(parsed?.droneSelections).toEqual({ "0": { droneId: "drone-1", quality: 7 } });
  });

  it("accepts an empty slot with a null droneId", () => {
    const parsed = parseBuildInput({
      ...BASE,
      droneSelections: { "5": { droneId: null, quality: 3 } },
    });
    expect(parsed?.droneSelections["5"]).toEqual({ droneId: null, quality: 3 });
  });

  it("drops slot keys outside 0-5", () => {
    const parsed = parseBuildInput({
      ...BASE,
      droneSelections: {
        "6": { droneId: "d", quality: 1 },
        "-1": { droneId: "d", quality: 1 },
        nope: { droneId: "d", quality: 1 },
      },
    });
    expect(parsed?.droneSelections).toEqual({});
  });

  it("drops entries that aren't objects", () => {
    const parsed = parseBuildInput({
      ...BASE,
      droneSelections: { "0": "not-an-object", "1": null },
    });
    expect(parsed?.droneSelections).toEqual({});
  });

  it("clamps quality into 0-9 and floors fractions", () => {
    const parsed = parseBuildInput({
      ...BASE,
      droneSelections: {
        "0": { droneId: "a", quality: 42 },
        "1": { droneId: "b", quality: -3 },
        "2": { droneId: "c", quality: 4.7 },
        "3": { droneId: "d", quality: "9" },
      },
    });
    expect(parsed?.droneSelections["0"].quality).toBe(9);
    expect(parsed?.droneSelections["1"].quality).toBe(0);
    expect(parsed?.droneSelections["2"].quality).toBe(4);
    // A non-number quality falls back to 0 rather than rejecting the slot.
    expect(parsed?.droneSelections["3"].quality).toBe(0);
  });
});
