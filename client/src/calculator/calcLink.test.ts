import { describe, expect, it } from "vitest";
import { decodeCalcLink, encodeCalcLink, skillKey, type CalcLink } from "./calcLink";

const full: CalcLink = {
  mech: { slug: "thunderous-judgment", tier: "Gold", picks: ["05ffe2", "6c2881"] },
  weapons: [
    { slug: "neon-speaker", tier: "Red", picks: ["54ec00"] },
    { slug: "ice-drill", tier: "Blue", picks: [] },
  ],
};

describe("encodeCalcLink", () => {
  it("writes separators literally, without percent-escaping", () => {
    expect(encodeCalcLink(full)).toBe(
      "m=thunderous-judgment.G:05ffe2,6c2881&w=neon-speaker.R:54ec00&w=ice-drill.B"
    );
  });

  it("omits the colon for an owner with no picks", () => {
    expect(encodeCalcLink({ mech: { slug: "wukong", tier: "Blue", picks: [] }, weapons: [] }))
      .toBe("m=wukong.B");
  });

  it("returns an empty string for empty state", () => {
    expect(encodeCalcLink({ mech: null, weapons: [] })).toBe("");
  });
});

describe("decodeCalcLink", () => {
  it("round-trips a full link", () => {
    expect(decodeCalcLink(encodeCalcLink(full))).toEqual(full);
  });

  it("preserves pick ORDER (the level gate depends on it)", () => {
    const a = decodeCalcLink("m=wukong.B:aaaaaa,bbbbbb");
    const b = decodeCalcLink("m=wukong.B:bbbbbb,aaaaaa");
    expect(a.mech?.picks).toEqual(["aaaaaa", "bbbbbb"]);
    expect(b.mech?.picks).toEqual(["bbbbbb", "aaaaaa"]);
  });

  it("tolerates a percent-escaped link (older clients, chat apps that re-encode)", () => {
    expect(decodeCalcLink("m=wukong.G%3Aaaaaaa%2Cbbbbbb").mech).toEqual({
      slug: "wukong", tier: "Gold", picks: ["aaaaaa", "bbbbbb"],
    });
  });

  it("drops an owner with an unknown tier letter", () => {
    expect(decodeCalcLink("m=wukong.Z:aaaaaa").mech).toBeNull();
  });

  it("drops non-hex junk in the pick list", () => {
    expect(decodeCalcLink("m=wukong.B:aaaaaa,<script>,bbbbbb").mech?.picks)
      .toEqual(["aaaaaa", "bbbbbb"]);
  });

  it("returns empty state for an empty query", () => {
    expect(decodeCalcLink("")).toEqual({ mech: null, weapons: [] });
  });
});

describe("skillKey", () => {
  it("takes the first 6 hex characters of a UUID", () => {
    expect(skillKey("05ffe2a1-1234-4321-8888-abcdefabcdef")).toBe("05ffe2");
  });
});
