import { describe, expect, it } from "vitest";
import { effectCountForTier } from "./moduleEffects";

describe("effectCountForTier", () => {
  it("gates effects by tier (Purple/Orange now have Effect 1)", () => {
    expect(effectCountForTier("Blue")).toBe(0);
    expect(effectCountForTier("Purple")).toBe(1);
    expect(effectCountForTier("Orange")).toBe(1);
    expect(effectCountForTier("Red")).toBe(1);
    expect(effectCountForTier("Turquoise")).toBe(1);
    expect(effectCountForTier("Gold")).toBe(2);
    expect(effectCountForTier("Mythic")).toBe(3);
  });
});
