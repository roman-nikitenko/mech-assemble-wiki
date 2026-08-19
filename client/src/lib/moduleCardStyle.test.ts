import { describe, expect, it } from "vitest";
import { qualityCardStyle } from "./moduleCardStyle";
import { QUALITY_TIERS } from "../api/types";

describe("qualityCardStyle", () => {
  it("returns a {header, iconBorder} shape for every tier without throwing", () => {
    for (const t of QUALITY_TIERS) {
      const s = qualityCardStyle(t);
      // No assets committed yet → undefined is the safe fallback; must not throw.
      expect(s).toHaveProperty("header");
      expect(s).toHaveProperty("iconBorder");
    }
  });
});
