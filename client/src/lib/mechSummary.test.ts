import { describe, expect, it } from "vitest";
import { mechSummary } from "./mechSummary";
import type { MechDetail } from "../api/types";

// Minimal MechDetail with everything empty; each test fills only what it needs.
const base: MechDetail = {
  id: "m1",
  slug: "abyssal-knight",
  name: "Abyssal Knight",
  epithet: null,
  type: null,
  rank: "Standard",
  imageUrl: null,
  iconUrl: null,
  cardSkillIconUrl: null,
  specialBonus: null,
  lore: null,
  rankUpPreview: [],
  skills: [],
  traits: [],
  awakeningLevels: [],
  weapon: null,
  accessory: null,
  pilot: null,
  skins: [],
  helpers: [],
  skillNodes: [],
};

describe("mechSummary", () => {
  it("builds a full sentence from every available field", () => {
    const text = mechSummary({
      ...base,
      epithet: "Shadow Hunter",
      rank: "S",
      type: { id: "t1", name: "Physical", iconUrl: null },
      specialBonus: "ATK +10%",
      pilot: { id: "p1", name: "Akira", iconUrl: null, relationshipBonus: null },
      traits: [
        { id: "1", trait: { id: "a", name: "Thunder", color: null } },
        { id: "2", trait: { id: "b", name: "Spreadshots", color: null } },
      ],
    });
    expect(text).toContain(
      "Abyssal Knight, the Shadow Hunter, is an S-tier Physical mech in Mech Assemble.",
    );
    expect(text).toContain("Its signature bonus is ATK +10%.");
    expect(text).toContain("It is piloted by Akira.");
    expect(text).toContain("Its traits include Thunder and Spreadshots.");
  });

  it("omits clauses for missing fields (a bare Standard mech)", () => {
    const text = mechSummary(base);
    expect(text).toBe(
      "Abyssal Knight is a Standard mech in Mech Assemble.",
    );
  });

  it("mentions the linked weapon and accessory with their effects", () => {
    const text = mechSummary({
      ...base,
      weapon: {
        id: "w1",
        slug: "void-reaver",
        name: "Void Reaver",
        description: "cleaves swarms",
        linkedEffect: null,
        baseStats: null,
        tier: "S",
        rankUpPreview: [],
        imageUrl: null,
        iconUrl: null,
        type: null,
        upgrades: [],
        weaponSkins: [],
        helpers: [],
        pilot: null,
        skillNodes: [],
      },
      accessory: {
        id: "ac1",
        name: "Abyss Core",
        tier: "S",
        attributes: [],
        exclusiveEffect: "Crit +20%",
        imageUrl: null,
        iconUrl: null,
      },
    });
    expect(text).toContain("Its unique weapon is the Void Reaver (cleaves swarms).");
    expect(text).toContain("Its accessory is the Abyss Core (Crit +20%).");
  });

  it("uses the Oxford-style 'A, B and C' for three or more traits", () => {
    const text = mechSummary({
      ...base,
      traits: [
        { id: "1", trait: { id: "a", name: "Thunder", color: null } },
        { id: "2", trait: { id: "b", name: "Spreadshots", color: null } },
        { id: "3", trait: { id: "c", name: "Fire", color: null } },
      ],
    });
    expect(text).toContain("Its traits include Thunder, Spreadshots and Fire.");
  });
});
