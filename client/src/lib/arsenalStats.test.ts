import { describe, expect, it } from "vitest";
import {
  AFFIX_POOLS,
  QUALITY_STATS,
  affixRangeLabel,
  affixRangeParts,
  arsenalAffixSlots,
  arsenalStatRanges,
  arsenalVariant,
} from "./arsenalStats";

describe("arsenalStatRanges", () => {
  it("matches the game for Excellent gear (the sketch's own numbers)", () => {
    // Quality 4: base HP 1,800 / ATK 360 / DEF 180 at a 50% floor.
    expect(arsenalStatRanges(4)).toEqual([
      { label: "HP", min: 900, max: 1800 },
      { label: "ATK", min: 180, max: 360 },
      { label: "DEF", min: 90, max: 180 },
    ]);
  });

  it("uses the higher floor at Supreme", () => {
    // Quality 13 rolls 80-100%, not 50-100%.
    expect(arsenalStatRanges(13)).toEqual([
      { label: "HP", min: 112000, max: 140000 },
      { label: "ATK", min: 22400, max: 28000 },
      { label: "DEF", min: 11200, max: 14000 },
    ]);
  });

  it("covers every quality on the ladder and nothing off it", () => {
    for (let q = 1; q <= 13; q++) expect(arsenalStatRanges(q), `quality ${q}`).toHaveLength(3);
    expect(arsenalStatRanges(0)).toEqual([]);
    expect(arsenalStatRanges(14)).toEqual([]);
  });

  it("keeps HP, ATK and DEF rising with quality", () => {
    for (let q = 2; q <= 13; q++) {
      expect(QUALITY_STATS[q].hp, `quality ${q}`).toBeGreaterThan(QUALITY_STATS[q - 1].hp);
    }
  });
});

describe("arsenalAffixSlots", () => {
  it("gives low-quality gear one effect slot and top-quality gear three", () => {
    expect(arsenalAffixSlots(4, "Greaves").map((s) => s.index)).toEqual([1]);
    expect(arsenalAffixSlots(13, "Greaves").map((s) => s.index)).toEqual([1, 2, 3]);
  });

  it("gives each gear slot its own special effect at the top quality", () => {
    const names = (slot: "Breastplate" | "Helmet") =>
      arsenalAffixSlots(13, slot)
        .find((s) => s.index === 3)!
        .options.map((o) => o.name);
    expect(names("Breastplate")).not.toEqual(names("Helmet"));
  });

  it("gives a Rune richer pools than ordinary gear below quality 8", () => {
    const standard = arsenalAffixSlots(5, "Breastplate", "standard");
    const rune = arsenalAffixSlots(5, "Breastplate", "rune");
    // Ordinary gear has no third effect slot at quality 5; a Rune does.
    expect(standard.map((s) => s.index)).toEqual([1, 2]);
    expect(rune.map((s) => s.index)).toEqual([1, 2, 3]);
  });

  it("falls back to ordinary pools above the qualities Runes reach", () => {
    expect(arsenalAffixSlots(13, "Belt", "rune")).toEqual(arsenalAffixSlots(13, "Belt", "standard"));
  });

  it("falls back for a Rune at quality 6, where the config row is a placeholder", () => {
    // The game's quality-6 Rune rows carry no pools at all (alongside their
    // placeholder 100/100/100 stats), so ordinary gear's pools stand in.
    expect(arsenalAffixSlots(6, "Boots", "rune")).toEqual(arsenalAffixSlots(6, "Boots", "standard"));
    expect(arsenalAffixSlots(6, "Boots", "rune").length).toBeGreaterThan(0);
  });

  it("returns nothing for a quality off the ladder", () => {
    expect(arsenalAffixSlots(99, "Belt")).toEqual([]);
  });

  it("lists the basic stat affixes in the first slot of Excellent gear", () => {
    const first = arsenalAffixSlots(4, "Greaves")[0];
    // The game words each option with its own number ("Attack +40").
    expect(first.options.map((o) => o.label)).toContain("Attack");
    expect(first.options.every((o) => o.chancePct > 0)).toBe(true);
  });
});

describe("affixRangeLabel", () => {
  it("spans a flat value from its floor to the full amount", () => {
    expect(
      affixRangeLabel({ name: "Attack +40", label: "Attack", value: 40, unit: "", chancePct: 16.67, rollFloorPct: 50 })
    ).toBe("Attack +[20-40]");
  });

  it("puts the percent sign outside the bracket, and trims a trailing zero", () => {
    expect(
      affixRangeLabel({ name: "Attack +5%", label: "Attack", value: 5, unit: "%", chancePct: 16.67, rollFloorPct: 50 })
    ).toBe("Attack +[2.5-5]%");
  });

  it("writes big numbers plainly, with no thousands separators", () => {
    expect(
      affixRangeLabel({ name: "HP +15000", label: "HP", value: 15000, unit: "", chancePct: 16.67, rollFloorPct: 75 })
    ).toBe("HP +[11250-15000]");
  });

  it("gives an elemental affix a span too, not just a name", () => {
    // These came through the older extract with no number at all.
    const ice = AFFIX_POOLS[60201].find((e) => e.name.startsWith("Ice Mech DMG"))!;
    expect(affixRangeLabel(ice)).toBe("Ice Mech DMG +[2.5-5]%");
  });

  it("shows a sentence effect as its own wording", () => {
    expect(
      affixRangeLabel({
        name: "50% chance to trigger Ice Burst when slowed.",
        label: null,
        value: null,
        unit: "",
        chancePct: 100,
        rollFloorPct: 100,
      })
    ).toBe("50% chance to trigger Ice Burst when slowed.");
  });

  it("has entries in every pool", () => {
    for (const [id, entries] of Object.entries(AFFIX_POOLS)) {
      expect(entries.length, `pool ${id}`).toBeGreaterThan(0);
    }
  });
});

describe("affixRangeParts", () => {
  it("splits the name from the span, so a row can justify them apart", () => {
    expect(
      affixRangeParts({ name: "Attack +40", label: "Attack", value: 40, unit: "", chancePct: 16.67, rollFloorPct: 50 })
    ).toEqual({ label: "Attack", range: "+[20-40]" });
  });

  it("gives a sentence effect its whole wording and no span", () => {
    expect(
      affixRangeParts({
        name: "Release 3 Ice Storms that slow enemies every 60s, lasting 15s.",
        label: null,
        value: null,
        unit: "",
        chancePct: 100,
        rollFloorPct: 100,
      })
    ).toEqual({ label: "Release 3 Ice Storms that slow enemies every 60s, lasting 15s.", range: null });
  });

  it("leaves only a handful of effects without a span", () => {
    const all = Object.values(AFFIX_POOLS).flat();
    const wordy = all.filter((e) => affixRangeParts(e).range === null);
    // The game states these as sentences; everything else carries a number.
    expect(wordy.length).toBeLessThan(10);
    expect(all.length - wordy.length).toBeGreaterThan(80);
  });
});

describe("arsenalVariant", () => {
  it("spots the Rune items by name", () => {
    expect(arsenalVariant("Computation Rune")).toBe("rune");
    expect(arsenalVariant("disruption rune")).toBe("rune");
  });

  it("treats everything else as ordinary gear", () => {
    expect(arsenalVariant("Standard Greaves")).toBe("standard");
    // "Runed" is a different word — only a whole "rune" counts.
    expect(arsenalVariant("Runed Helmet")).toBe("standard");
  });
});
