import { describe, expect, it } from "vitest";
import { ACHIEVEMENT_TIERS, achievementQualityImage, achievementRewardFrame } from "./achievementQuality";

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

describe("achievementRewardFrame", () => {
  it("frames qualities 1-3 in purple and quality 4 in gold", () => {
    const purple = achievementRewardFrame(1);
    expect(purple).toBeTruthy();
    expect(achievementRewardFrame(2)).toBe(purple);
    expect(achievementRewardFrame(3)).toBe(purple);

    const gold = achievementRewardFrame(4);
    expect(gold).toBeTruthy();
    expect(gold).not.toBe(purple);
  });

  it("returns undefined off the ladder", () => {
    expect(achievementRewardFrame(0)).toBeUndefined();
    expect(achievementRewardFrame(5)).toBeUndefined();
    expect(achievementRewardFrame(2.5)).toBeUndefined();
  });
});
