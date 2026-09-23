import { describe, expect, it } from "vitest";
import { ARSENAL_QUALITIES, arsenalQuality, arsenalQualityName } from "./arsenalQualities";

describe("arsenal qualities", () => {
  it("has 13 rungs numbered 1-13 in order", () => {
    expect(ARSENAL_QUALITIES.map((q) => q.quality)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]);
  });

  it("names the ends of the ladder", () => {
    expect(arsenalQualityName(1)).toBe("Crude");
    expect(arsenalQualityName(11)).toBe("Mythic+3");
    expect(arsenalQualityName(13)).toBe("Supreme");
  });

  it("falls back to Q<n> for numbers off the ladder", () => {
    expect(arsenalQuality(0)).toBeUndefined();
    expect(arsenalQualityName(14)).toBe("Q14");
  });
});
