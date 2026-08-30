import { describe, expect, it } from "vitest";
import { idsToKeys, keysToIds } from "./calcResolve";
import type { SkillNodeRow } from "../api/types";

const node = (id: string): SkillNodeRow => ({
  id,
  parentId: null,
  name: "Test skill",
  description: null,
  appearanceLevel: 1,
  type: "Normal",
  sortOrder: 0,
  repeatable: false,
  linkedWeaponId: null,
  linkedMechId: null,
  initialAtTier: null,
});

const pool = [
  node("05ffe2a1-1111-4111-8111-111111111111"),
  node("6c2881b2-2222-4222-8222-222222222222"),
];

describe("keysToIds", () => {
  it("maps keys back to full ids, in order", () => {
    expect(keysToIds(pool, ["6c2881", "05ffe2"])).toEqual({
      ids: ["6c2881b2-2222-4222-8222-222222222222", "05ffe2a1-1111-4111-8111-111111111111"],
      missing: 0,
    });
  });

  it("counts keys whose skill no longer exists instead of dropping them silently", () => {
    expect(keysToIds(pool, ["05ffe2", "deadbe", "cafeba"])).toEqual({
      ids: ["05ffe2a1-1111-4111-8111-111111111111"],
      missing: 2,
    });
  });

  it("keeps a repeated key repeated (repeatable skills take a slot each)", () => {
    expect(keysToIds(pool, ["05ffe2", "05ffe2"]).ids).toHaveLength(2);
  });

  it("returns nothing for an empty key list", () => {
    expect(keysToIds(pool, [])).toEqual({ ids: [], missing: 0 });
  });
});

describe("idsToKeys", () => {
  it("shortens ids to their key", () => {
    expect(idsToKeys(["05ffe2a1-1111-4111-8111-111111111111"])).toEqual(["05ffe2"]);
  });
});
