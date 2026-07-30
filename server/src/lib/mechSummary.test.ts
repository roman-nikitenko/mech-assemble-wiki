import { describe, expect, it } from "vitest";
import { mechSummary, type MechSummaryInput } from "./mechSummary";

const base: MechSummaryInput = {
  name: "Abyssal Knight",
  epithet: null,
  rank: "Standard",
  type: null,
  specialBonus: null,
  pilot: null,
  traits: [],
  weapon: null,
  accessory: null,
};

describe("mechSummary", () => {
  it("builds a full sentence from every available field", () => {
    const text = mechSummary({
      ...base,
      epithet: "Shadow Hunter",
      rank: "S",
      type: { name: "Physical" },
      specialBonus: "ATK +10%",
      pilot: { name: "Akira" },
      traits: [{ trait: { name: "Thunder" } }, { trait: { name: "Spreadshots" } }],
    });
    expect(text).toContain(
      "Abyssal Knight, the Shadow Hunter, is an S-tier Physical mech in Mech Assemble.",
    );
    expect(text).toContain("Its signature bonus is ATK +10%.");
    expect(text).toContain("It is piloted by Akira.");
    expect(text).toContain("Its traits include Thunder and Spreadshots.");
  });

  it("omits clauses for missing fields (a bare Standard mech)", () => {
    expect(mechSummary(base)).toBe("Abyssal Knight is a Standard mech in Mech Assemble.");
  });

  it("mentions the linked weapon and accessory with their effects", () => {
    const text = mechSummary({
      ...base,
      weapon: { name: "Void Reaver", description: "cleaves swarms" },
      accessory: { name: "Abyss Core", exclusiveEffect: "Crit +20%" },
    });
    expect(text).toContain("Its unique weapon is the Void Reaver (cleaves swarms).");
    expect(text).toContain("Its accessory is the Abyss Core (Crit +20%).");
  });
});
