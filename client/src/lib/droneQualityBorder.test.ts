import { describe, expect, it } from "vitest";
import { droneQualityBorder } from "./droneQualityBorder";

describe("droneQualityBorder", () => {
  it("returns a frame URL for every quality gem 0-9", () => {
    for (let q = 0; q <= 9; q++) {
      expect(droneQualityBorder(q), `quality ${q}`).toBeTruthy();
    }
  });

  it("returns undefined for a quality with no art file", () => {
    expect(droneQualityBorder(10)).toBeUndefined();
    expect(droneQualityBorder(-1)).toBeUndefined();
  });
});
