import { describe, expect, it } from "vitest";
import {
  AIRCRAFT_QUALITIES,
  aircraftResetSlot,
  aircraftSelection,
  pickedAircraftIds,
  attributeGroup,
  formatResetRange,
  pickedAttributeIds,
  resetRange,
} from "./aircraftResetSlots";
import type { AircraftAttributeGroup } from "../api/types";

const percent: AircraftAttributeGroup = {
  id: "g1",
  name: "Element DMG",
  unit: "Percent",
  q1Max: 5,
  q8Max: 80,
  q13Max: 100,
  sortOrder: 7,
  attributes: [
    { id: "attr1", name: "Thunder DMG", sortOrder: 3 },
    { id: "attr2", name: "Fire DMG", sortOrder: 2 },
  ],
};
const flat: AircraftAttributeGroup = {
  id: "g2",
  name: "Flat HP",
  unit: "Flat",
  q1Max: 1000,
  q8Max: 15000,
  q13Max: 20000,
  sortOrder: 1,
  attributes: [{ id: "attr3", name: "HP", sortOrder: 1 }],
};
const groups = [percent, flat];

describe("aircraftResetSlot", () => {
  it("defaults a missing slot to no attribute at the lowest grade", () => {
    expect(aircraftResetSlot({}, 2)).toEqual({ attributeId: null, grade: "G" });
  });

  it("reads a stored slot by its index key", () => {
    const slots = { "1": { attributeId: "attr1", grade: "SS" as const } };
    expect(aircraftResetSlot(slots, 1)).toEqual({ attributeId: "attr1", grade: "SS" });
  });
});

describe("pickedAttributeIds", () => {
  it("lists the attributes in use and skips empty slots", () => {
    const slots = {
      "0": { attributeId: "attr1", grade: "SS" as const },
      "1": { attributeId: null, grade: "G" as const },
      "3": { attributeId: "attr3", grade: "A" as const },
    };
    expect(pickedAttributeIds(slots)).toEqual(["attr1", "attr3"]);
  });
});

describe("attributeGroup", () => {
  it("finds the group holding an attribute", () => {
    expect(attributeGroup(groups, "attr2")?.name).toBe("Element DMG");
    expect(attributeGroup(groups, "attr3")?.name).toBe("Flat HP");
  });

  it("is undefined for no attribute or an unknown one", () => {
    expect(attributeGroup(groups, null)).toBeUndefined();
    expect(attributeGroup(groups, "nope")).toBeUndefined();
  });
});

describe("resetRange", () => {
  // The two bands the published caps let us state outright.
  it("gives G and SS exact bands", () => {
    expect(resetRange("G", percent)).toEqual({ min: 0, max: 5, exact: true });
    expect(resetRange("SS", percent)).toEqual({ min: 80, max: 100, exact: true });
  });

  it("marks every middle grade — S included — as the wide band", () => {
    for (const grade of ["F", "E", "D", "C", "B", "A", "S"] as const) {
      expect(resetRange(grade, percent), grade).toEqual({ min: 5, max: 80, exact: false });
    }
  });

  it("reads the same way for a flat group", () => {
    expect(resetRange("SS", flat)).toEqual({ min: 15000, max: 20000, exact: true });
  });

  it("is undefined when no attribute is chosen yet", () => {
    expect(resetRange("SS", undefined)).toBeUndefined();
  });
});

describe("formatResetRange", () => {
  it("suffixes percent groups", () => {
    expect(formatResetRange({ min: 80, max: 100, exact: true }, "Percent")).toBe("80 – 100%");
  });

  it("separates thousands and drops trailing zeros on flat groups", () => {
    expect(formatResetRange({ min: 15000, max: 20000, exact: true }, "Flat")).toBe(
      "15,000 – 20,000"
    );
  });

  it("keeps a fractional cap readable", () => {
    expect(formatResetRange({ min: 2.5, max: 40, exact: false }, "Percent")).toBe("2.5 – 40%");
  });
});

describe("aircraft slots", () => {
  it("defaults an empty slot to no aircraft at the lowest colour rung", () => {
    expect(aircraftSelection({}, 1)).toEqual({
      aircraftId: null,
      quality: "Orange",
      resetSlots: {},
    });
  });

  it("reads a stored aircraft by its slot index", () => {
    const selections = {
      "1": { aircraftId: "a2", quality: "Gold" as const, resetSlots: {} },
    };
    expect(aircraftSelection(selections, 1).aircraftId).toBe("a2");
    expect(aircraftSelection(selections, 0).aircraftId).toBeNull();
  });

  it("lists equipped aircraft so the picker can hide them", () => {
    const selections = {
      "0": { aircraftId: "a1", quality: "Gold" as const, resetSlots: {} },
      "1": { aircraftId: null, quality: "Orange" as const, resetSlots: {} },
    };
    expect(pickedAircraftIds(selections)).toEqual(["a1"]);
  });

  // Aircraft use the ladder's top five, not the whole Blue→Mythic run and not
  // the Q1-Q13 table on the aircraft page.
  it("offers only the top five colour tiers", () => {
    expect(AIRCRAFT_QUALITIES).toEqual(["Orange", "Red", "Turquoise", "Gold", "Mythic"]);
  });
});
