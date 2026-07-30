import { describe, expect, it } from "vitest";
import { mechMeta, weaponMeta, buildMeta } from "./ogMeta";

describe("mechMeta", () => {
  it("titles with the site prefix + quoted name and uses the generated blurb", () => {
    const meta = mechMeta({
      id: "m1", slug: "iron-colossus", name: "Iron Colossus",
      epithet: null, rank: "Standard", type: null, specialBonus: null,
      pilot: null, traits: [], weapon: null, accessory: null,
      imageUrl: "/uploads/colossus.png",
    });
    expect(meta.title).toBe('Mech Assemble Wiki — "Iron Colossus"');
    expect(meta.description).toBe("Iron Colossus is a Standard mech in Mech Assemble.");
    expect(meta.url).toBe("https://mech-assemble-wiki.online/mechs/iron-colossus");
    expect(meta.image).toBe("https://mech-assemble-wiki.online/uploads/colossus.png");
    expect(meta.largeImage).toBe(true);
  });

  it("falls back to the UUID in the URL and null image when there is no art", () => {
    const meta = mechMeta({
      id: "m1", slug: null, name: "Iron Colossus",
      epithet: null, rank: "Standard", type: null, specialBonus: null,
      pilot: null, traits: [], weapon: null, accessory: null, imageUrl: null,
    });
    expect(meta.url).toBe("https://mech-assemble-wiki.online/mechs/m1");
    expect(meta.image).toBeNull();
    expect(meta.largeImage).toBe(false);
  });
});

describe("weaponMeta", () => {
  it("uses the authored description when present", () => {
    const meta = weaponMeta({
      id: "w1", slug: "blade", name: "Blade", tier: "S",
      description: "Big boom.", imageUrl: "/uploads/blade.png",
    });
    expect(meta.title).toBe('Mech Assemble Wiki — "Blade"');
    expect(meta.description).toBe("Big boom.");
    expect(meta.image).toBe("https://mech-assemble-wiki.online/uploads/blade.png");
  });

  it("generates a fallback description when none is authored", () => {
    const meta = weaponMeta({
      id: "w1", slug: "blade", name: "Blade", tier: "S", description: null, imageUrl: null,
    });
    expect(meta.description).toContain("Blade — S-tier weapon in Mech Assemble: Zombie Swarm.");
  });
});

describe("buildMeta", () => {
  it("uses the build description and the passed-in image", () => {
    const meta = buildMeta(
      { id: "b1", name: "My Build", description: "Crit comp." },
      "https://mech-assemble-wiki.online/uploads/mech.png",
    );
    expect(meta.title).toBe('Mech Assemble Wiki — "My Build"');
    expect(meta.description).toBe("Crit comp.");
    expect(meta.url).toBe("https://mech-assemble-wiki.online/builds/b1");
    expect(meta.image).toBe("https://mech-assemble-wiki.online/uploads/mech.png");
    expect(meta.largeImage).toBe(true);
  });

  it("falls back to the site description when the build has none", () => {
    const meta = buildMeta({ id: "b1", name: "My Build", description: "" }, null);
    expect(meta.description).toContain("The community database for Mech Assemble");
    expect(meta.image).toBeNull();
    expect(meta.largeImage).toBe(false);
  });
});
