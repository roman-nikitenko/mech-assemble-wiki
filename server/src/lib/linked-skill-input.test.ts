import { describe, expect, it } from "vitest";
import { parseLinkedSkills } from "./linked-skill-input";

const UUID = "11111111-1111-4111-8111-111111111111";

describe("parseLinkedSkills", () => {
  it("defaults undefined to an empty array", () => {
    expect(parseLinkedSkills(undefined)).toEqual({ ok: true, value: [] });
  });
  it("parses a valid row (trims name, empty description → null)", () => {
    const r = parseLinkedSkills([{ name: " Frost Synergy ", description: "", partnerId: UUID }]);
    expect(r).toEqual({ ok: true, value: [{ name: "Frost Synergy", description: null, partnerId: UUID }] });
  });
  it("rejects a missing name", () => {
    const r = parseLinkedSkills([{ name: "  ", partnerId: UUID }]);
    expect(r.ok).toBe(false);
  });
  it("rejects a bad partnerId", () => {
    const r = parseLinkedSkills([{ name: "X", partnerId: "not-a-uuid" }]);
    expect(r.ok).toBe(false);
  });
});
