import { describe, expect, it } from "vitest";
import { noteExcerpt, parseInline, parseNote } from "./noteMarkup";

describe("parseNote (blocks)", () => {
  it("parses h2 and h3 lines, skipping blanks", () => {
    expect(parseNote("## Opening\n\n### Details\ntext")).toEqual([
      { kind: "h2", text: "Opening" },
      { kind: "h3", text: "Details" },
      { kind: "p", parts: [{ kind: "text", text: "text" }] },
    ]);
  });

  it("returns [] for empty input", () => {
    expect(parseNote("")).toEqual([]);
    expect(parseNote("  \n \n")).toEqual([]);
  });
});

describe("parseInline", () => {
  it("mixes text, bold, italic and mentions in order", () => {
    expect(parseInline("Use **Zap** with *care* on #[Iron Colossus]!")).toEqual([
      { kind: "text", text: "Use " },
      { kind: "bold", text: "Zap" },
      { kind: "text", text: " with " },
      { kind: "italic", text: "care" },
      { kind: "text", text: " on " },
      { kind: "mention", name: "Iron Colossus" },
      { kind: "text", text: "!" },
    ]);
  });

  it("leaves unmatched markers as literal text", () => {
    expect(parseInline("2 * 3 = 6")).toEqual([{ kind: "text", text: "2 * 3 = 6" }]);
    expect(parseInline("**open")).toEqual([{ kind: "text", text: "**open" }]);
    expect(parseInline("#[unclosed")).toEqual([{ kind: "text", text: "#[unclosed" }]);
  });

  it("bold wins over italic when both could match", () => {
    expect(parseInline("**really**")).toEqual([{ kind: "bold", text: "really" }]);
  });
});

describe("noteExcerpt", () => {
  it("strips markers and turns mentions into bare names", () => {
    expect(noteExcerpt("## Plan\nUse **Zap** on #[Iron Colossus]")).toBe(
      "Plan Use Zap on Iron Colossus"
    );
  });

  it("truncates long notes with an ellipsis", () => {
    expect(noteExcerpt("a".repeat(200), 10)).toBe("aaaaaaaaaa…");
  });
});
