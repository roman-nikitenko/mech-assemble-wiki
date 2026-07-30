import { describe, expect, it } from "vitest";
import { slugify } from "./slug";

describe("slugify", () => {
  it("lowercases and hyphenates a normal name", () => {
    expect(slugify("Abyssal Knight")).toBe("abyssal-knight");
  });

  it("collapses punctuation and multiple spaces into single hyphens", () => {
    expect(slugify("Mech Assemble: Zombie   Swarm!")).toBe(
      "mech-assemble-zombie-swarm",
    );
  });

  it("trims leading and trailing separators", () => {
    expect(slugify("  [test:Nova]  ")).toBe("test-nova");
  });

  it("strips accents down to plain ASCII letters", () => {
    expect(slugify("Kaïto Ürïk")).toBe("kaito-urik");
  });

  it("keeps digits", () => {
    expect(slugify("Titan MK II 2000")).toBe("titan-mk-ii-2000");
  });

  it("returns an empty string when nothing usable remains", () => {
    expect(slugify("!!!")).toBe("");
  });
});
