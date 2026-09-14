import { describe, expect, it } from "vitest";
import type { SkillNodeRow } from "../api/types";
import { UNIVERSAL_CORE_SKILLS, withUniversalCores } from "./universalCoreSkills";

const mechNode = (id: string): SkillNodeRow => ({
  id, parentId: null, name: id, description: null, appearanceLevel: 1, type: "Normal",
  sortOrder: 0, repeatable: false, linkedWeaponId: null, linkedMechId: null, initialAtTier: null,
});

describe("UNIVERSAL_CORE_SKILLS", () => {
  it("are the game's four always-available cores", () => {
    expect(UNIVERSAL_CORE_SKILLS.map((s) => s.description)).toEqual([
      "Speed +50%, size decrease",
      "HP +50%, size increase",
      "Mech DMG +150%",
      "EXP +30%",
    ]);
  });

  // These ids are stored inside saved builds — pin them so a rename can't
  // silently orphan every pick.
  it("keep their stored ids", () => {
    expect(UNIVERSAL_CORE_SKILLS.map((s) => s.id)).toEqual([
      "universal-core-speed",
      "universal-core-hp",
      "universal-core-mech-dmg",
      "universal-core-exp",
    ]);
  });

  it("are nameless level-1 root Core skills with no gates", () => {
    for (const s of UNIVERSAL_CORE_SKILLS) {
      expect(s).toMatchObject({
        type: "Core",
        name: null,
        appearanceLevel: 1,
        parentId: null,
        repeatable: false,
        linkedWeaponId: null,
        linkedMechId: null,
        initialAtTier: null,
      });
    }
  });
});

describe("withUniversalCores", () => {
  it("appends the four cores after the mech's own skills", () => {
    const own = [mechNode("a"), mechNode("b")];
    expect(withUniversalCores(own).map((s) => s.id)).toEqual([
      "a",
      "b",
      ...UNIVERSAL_CORE_SKILLS.map((s) => s.id),
    ]);
  });

  it("never duplicates a core whose id is already in the pool", () => {
    const own = [mechNode("a"), { ...UNIVERSAL_CORE_SKILLS[2] }];
    const ids = withUniversalCores(own).map((s) => s.id);
    expect(ids.filter((id) => id === "universal-core-mech-dmg")).toHaveLength(1);
    expect(ids).toHaveLength(5);
  });
});
