import { describe, expect, it } from "vitest";
import { ACHIEVEMENT_TIERS, achievementQualityImage } from "./achievementQuality";

describe("achievementQualityImage", () => {
  it("returns art for every tier in the ladder", () => {
    for (const tier of ACHIEVEMENT_TIERS) {
      expect(achievementQualityImage(tier), `tier ${tier}`).toBeTruthy();
    }
  });

  it("returns undefined for tiers off the ladder", () => {
    expect(achievementQualityImage(0)).toBeUndefined();
    expect(achievementQualityImage(5)).toBeUndefined();
  });

  it("returns undefined for a value that isn't a whole number", () => {
    expect(achievementQualityImage(2.5)).toBeUndefined();
    expect(achievementQualityImage(Number.NaN)).toBeUndefined();
  });
});
