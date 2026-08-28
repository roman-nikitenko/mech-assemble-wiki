import { describe, expect, it } from "vitest";
import { DRONE_QUALITIES, droneQualityName } from "./droneSlots";

describe("droneQualityName", () => {
  it("names every gem 0-9, lowest to highest", () => {
    expect(DRONE_QUALITIES.map(droneQualityName)).toEqual([
      "Crude",
      "Common",
      "Uncommon",
      "Excellent",
      "Rare",
      "Epic",
      "Legendary",
      "Mythic",
      "Supreme",
      "Divine",
    ]);
  });

  it("falls back to the raw number for a quality outside the ladder", () => {
    // Stored data is the source of truth; an unknown value must still render.
    expect(droneQualityName(42)).toBe("42");
  });
});
