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

describe("parseBuildInput — aircraft", () => {
  const roll = { attributeId: "attr-1", grade: "SS" };

  it("defaults to no aircraft at all", () => {
    expect(parseBuildInput(BASE)?.aircraftSelections).toEqual({});
  });

  it("keeps two aircraft, each with its own quality and its own rolls", () => {
    const parsed = parseBuildInput({
      ...BASE,
      aircraftSelections: {
        "0": { aircraftId: "air-1", quality: "Mythic", resetSlots: { "0": roll } },
        "1": { aircraftId: "air-2", quality: "Gold", resetSlots: {} },
      },
    });
    expect(parsed?.aircraftSelections).toEqual({
      "0": { aircraftId: "air-1", quality: "Mythic", resetSlots: { "0": roll } },
      "1": { aircraftId: "air-2", quality: "Gold", resetSlots: {} },
    });
  });

  it("drops a third aircraft — a build carries exactly two", () => {
    const parsed = parseBuildInput({
      ...BASE,
      aircraftSelections: {
        "0": { aircraftId: "air-1", quality: "Gold", resetSlots: {} },
        "2": { aircraftId: "air-3", quality: "Gold", resetSlots: {} },
        nope: { aircraftId: "air-4", quality: "Gold", resetSlots: {} },
      },
    });
    expect(Object.keys(parsed!.aircraftSelections)).toEqual(["0"]);
  });

  it("drops entries that aren't objects", () => {
    const parsed = parseBuildInput({
      ...BASE,
      aircraftSelections: { "0": "not-an-object", "1": null },
    });
    expect(parsed?.aircraftSelections).toEqual({});
  });

  // Aircraft use the colour ladder's top five, not Blue/Purple and not Q1-Q13.
  it("falls back to Orange for a quality off the aircraft ladder", () => {
    for (const bad of ["Blue", "Purple", "Q8", "Supreme", 7]) {
      const parsed = parseBuildInput({
        ...BASE,
        aircraftSelections: { "0": { aircraftId: "a", quality: bad, resetSlots: {} } },
      });
      expect(parsed?.aircraftSelections["0"].quality, String(bad)).toBe("Orange");
    }
  });

  it("drops reset rolls outside slots 0-4", () => {
    const parsed = parseBuildInput({
      ...BASE,
      aircraftSelections: {
        "0": {
          aircraftId: "a",
          quality: "Gold",
          resetSlots: { "4": roll, "5": roll, nope: roll },
        },
      },
    });
    expect(Object.keys(parsed!.aircraftSelections["0"].resetSlots)).toEqual(["4"]);
  });

  it("falls back to the lowest grade for anything off the whitelist", () => {
    const parsed = parseBuildInput({
      ...BASE,
      aircraftSelections: {
        "0": {
          aircraftId: "a",
          quality: "Gold",
          // Case-sensitive by design: the dropdown only ever emits "SS".
          resetSlots: {
            "0": { attributeId: "x", grade: "Z" },
            "1": { attributeId: "y", grade: "ss" },
            "2": { attributeId: "z" },
          },
        },
      },
    });
    const rolls = parsed!.aircraftSelections["0"].resetSlots;
    expect(rolls["0"].grade).toBe("G");
    expect(rolls["1"].grade).toBe("G");
    expect(rolls["2"].grade).toBe("G");
  });

  // No number is stored: the grade implies the range.
  it("ignores a stray value field on a roll", () => {
    const parsed = parseBuildInput({
      ...BASE,
      aircraftSelections: {
        "0": {
          aircraftId: "a",
          quality: "Gold",
          resetSlots: { "0": { attributeId: "x", grade: "S", value: 91.89 } },
        },
      },
    });
    expect(parsed!.aircraftSelections["0"].resetSlots["0"]).toEqual({
      attributeId: "x",
      grade: "S",
    });
  });

  it("nulls a non-string aircraftId and defaults missing rolls", () => {
    const parsed = parseBuildInput({
      ...BASE,
      aircraftSelections: { "0": { aircraftId: 42, quality: "Red" } },
    });
    expect(parsed?.aircraftSelections["0"]).toEqual({
      aircraftId: null,
      quality: "Red",
      resetSlots: {},
    });
  });
});
