import { describe, expect, it } from "vitest";
import {
  ARSENAL_QUALITIES,
  arsenalQuality,
  arsenalQualityArt,
  arsenalQualityFrame,
  arsenalQualityName,
} from "./arsenalQualities";

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

describe("arsenalQualityFrame", () => {
  it("has a frame for every quality on the ladder", () => {
    for (const q of ARSENAL_QUALITIES) {
      expect(arsenalQualityFrame(q.quality), `quality ${q.quality}`).toBeTruthy();
    }
  });

  it("shares one gold frame across Mythic and its +1…+4 steps", () => {
    const gold = arsenalQualityFrame(8);
    for (const q of [9, 10, 11, 12]) expect(arsenalQualityFrame(q)).toBe(gold);
    // Supreme steps up to the mythic frame instead of staying gold.
    expect(arsenalQualityFrame(13)).not.toBe(gold);
  });

  it("returns undefined off the ladder", () => {
    expect(arsenalQualityFrame(0)).toBeUndefined();
    expect(arsenalQualityFrame(14)).toBeUndefined();
    expect(arsenalQualityFrame(2.5)).toBeUndefined();
  });
});

describe("arsenalQualityArt", () => {
  it("has a header and an icon frame for every quality", () => {
    for (const q of ARSENAL_QUALITIES) {
      const art = arsenalQualityArt(q.quality);
      expect(art.header, `quality ${q.quality} header`).toBeTruthy();
      expect(art.iconFrame, `quality ${q.quality} frame`).toBeTruthy();
    }
  });

  it("keeps the header and the frame on the same colour", () => {
    // Both come from one colour map, so gold gear can't get a red header.
    expect(arsenalQualityArt(8).iconFrame).toBe(arsenalQualityFrame(8));
    expect(arsenalQualityArt(8).header).toBe(arsenalQualityArt(12).header);
    expect(arsenalQualityArt(13).header).not.toBe(arsenalQualityArt(12).header);
  });

  it("counts one mark per + step, and none for plain Mythic or Supreme", () => {
    expect(arsenalQualityArt(8).markCount).toBe(0); // Mythic
    expect(arsenalQualityArt(9).markCount).toBe(1); // Mythic+1
    expect(arsenalQualityArt(12).markCount).toBe(4); // Mythic+4
    expect(arsenalQualityArt(13).markCount).toBe(0); // Supreme has its own frame
    expect(arsenalQualityArt(5).markCount).toBe(0);
  });

  it("only hands back a mark image when there are marks to draw", () => {
    expect(arsenalQualityArt(10).mark).toBeTruthy();
    expect(arsenalQualityArt(8).mark).toBeUndefined();
  });

  it("gives nothing for a quality off the ladder", () => {
    expect(arsenalQualityArt(14)).toEqual({ markCount: 0 });
    expect(arsenalQualityArt(2.5)).toEqual({ markCount: 0 });
  });
});
