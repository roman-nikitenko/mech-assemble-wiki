import { describe, expect, it } from "vitest";
import { REWARD_TYPES, rewardIcon, rewardLabel } from "./rewardIcons";

describe("reward types", () => {
  it("picks up every icon in the folder", () => {
    expect(REWARD_TYPES.length).toBeGreaterThan(0);
    expect(REWARD_TYPES.every((t) => t.icon !== "")).toBe(true);
  });

  it("includes the ones the game grants most", () => {
    const keys = REWARD_TYPES.map((t) => t.key);
    expect(keys).toContain("diamond");
    expect(keys).toContain("supply-coin");
  });

  it("turns a file name into a readable label, upper-casing one-letter words", () => {
    expect(rewardLabel("diamond")).toBe("Diamond");
    expect(rewardLabel("raid-honor-coin")).toBe("Raid Honor Coin");
    expect(rewardLabel("s-mech-shard")).toBe("S Mech Shard");
  });

  it("is sorted by label", () => {
    const labels = REWARD_TYPES.map((t) => t.label);
    expect(labels).toEqual([...labels].sort((a, b) => a.localeCompare(b)));
  });

  it("returns art for a known key and nothing for an unknown or null one", () => {
    expect(rewardIcon("diamond")).toBeTruthy();
    expect(rewardIcon("not-a-reward")).toBeUndefined();
    expect(rewardIcon(null)).toBeUndefined();
  });

  it("falls back to the raw key as a label when it matches no file", () => {
    expect(rewardLabel("not-a-reward")).toBe("not-a-reward");
    expect(rewardLabel(null)).toBe("");
  });
});
