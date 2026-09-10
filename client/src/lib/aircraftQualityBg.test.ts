import { describe, expect, it } from "vitest";
import { aircraftQualityBg } from "./aircraftQualityBg";
import { AIRCRAFT_RANK_TIERS } from "../components/RankUpPreview";

describe("aircraftQualityBg", () => {
  // A renamed or missing asset fails silently at runtime, so assert that every
  // rung an aircraft can actually reach resolves to art.
  it("resolves art for every aircraft quality", () => {
    for (const tier of AIRCRAFT_RANK_TIERS) {
      expect(aircraftQualityBg(tier), `no art for ${tier}`).toBeTruthy();
    }
  });

  // The game calls the Turquoise rung "qing", so that one file needs an alias
  // — this is the mapping most likely to break if the folder is re-exported.
  it("maps the qing file onto Turquoise", () => {
    const url = aircraftQualityBg("Turquoise");
    expect(url).toBeTruthy();
    expect(url).toContain("qing");
  });

  it("gives each quality its own distinct art", () => {
    const urls = AIRCRAFT_RANK_TIERS.map((t) => aircraftQualityBg(t));
    expect(new Set(urls).size).toBe(AIRCRAFT_RANK_TIERS.length);
  });
});
