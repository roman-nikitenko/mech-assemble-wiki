import { afterAll, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../app";
import { prisma } from "../lib/prisma";

// Per-file prefix "[test:weapons] " for EVERYTHING this file creates.
// Cleanup order: pilots first (they reference weapons), then weapons,
// then mechs, then types (Restrict).
afterAll(async () => {
  await prisma.pilot.deleteMany({ where: { name: { startsWith: "[test:weapons] " } } });
  await prisma.weapon.deleteMany({ where: { name: { startsWith: "[test:weapons] " } } });
  await prisma.mech.deleteMany({ where: { name: { startsWith: "[test:weapons] " } } });
  await prisma.type.deleteMany({ where: { name: { startsWith: "[test:weapons] " } } });
  await prisma.$disconnect();
});

describe("GET /api/weapons", () => {
  it("lists weapons with type, mech, pilot, and skins", async () => {
    const w = await prisma.weapon.create({
      data: {
        name: "[test:weapons] Lister",
        tier: "S",
        weaponSkins: { create: [{ name: "[test:weapons] Chrome", bonuses: ["ATK +1%"] }] },
      },
    });
    const res = await request(app).get("/api/weapons");
    expect(res.status).toBe(200);
    const weapon = res.body.find((x: { id: string }) => x.id === w.id);
    expect(weapon.tier).toBe("S");
    expect(weapon.mech).toBeNull();
    expect(weapon.pilot).toBeNull();
    expect(weapon.weaponSkins).toHaveLength(1);
  });
});

describe("POST /api/weapons", () => {
  it("creates a weapon with everything and seats the pilot exclusively", async () => {
    const type = await prisma.type.create({ data: { name: "[test:weapons] Beam" } });
    const mech = await prisma.mech.create({ data: { name: "[test:weapons] Owner", rank: "S" } });
    // pilot currently seated in a MECH — creating the weapon must move them
    const otherMech = await prisma.mech.create({ data: { name: "[test:weapons] Old Seat", rank: "S" } });
    const pilot = await prisma.pilot.create({
      data: { name: "[test:weapons] Face", mechId: otherMech.id },
    });

    const res = await request(app).post("/api/weapons").send({
      name: "[test:weapons] Doom Cannon",
      description: "Big boom.",
      tier: "S",
      typeId: type.id,
      mechId: mech.id,
      pilotId: pilot.id,
      rankUpPreview: ["DMG +30%", "Cooldown -25%", "", "", "", "", ""],
      imageUrl: "/uploads/fake-weapon.png",
      iconUrl: "/uploads/fake-weapon-icon.png",
      skins: [
        {
          name: "[test:weapons] Gold",
          bonuses: ["ATK +2%", "Crit +4%", "", ""],
          imageUrl: "/uploads/fake-skin.png",
        },
        { name: "[test:weapons] Void", bonuses: [] },
      ],
    });
    expect(res.status).toBe(201);
    expect(res.body.rankUpPreview).toEqual(["DMG +30%", "Cooldown -25%"]); // blanks dropped
    expect(res.body.weaponSkins).toHaveLength(2);
    const gold = res.body.weaponSkins.find((s: { name: string }) => s.name.endsWith("Gold"));
    expect(gold.bonuses).toEqual(["ATK +2%", "Crit +4%"]);
    expect(gold.imageUrl).toBe("/uploads/fake-skin.png");
    expect(res.body.mech.name).toBe("[test:weapons] Owner");
    expect(res.body.pilot.name).toBe("[test:weapons] Face");
    // both art slots round-trip
    expect(res.body.imageUrl).toBe("/uploads/fake-weapon.png");
    expect(res.body.iconUrl).toBe("/uploads/fake-weapon-icon.png");

    // either/or: the pilot left their mech
    const moved = await prisma.pilot.findUnique({ where: { id: pilot.id } });
    expect(moved!.weaponId).toBe(res.body.id);
    expect(moved!.mechId).toBeNull();
  });

  it("400s on a blank name", async () => {
    const res = await request(app).post("/api/weapons").send({ name: " " });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("name");
  });

  it("400s on more than 7 rank-up lines", async () => {
    const res = await request(app).post("/api/weapons").send({
      name: "[test:weapons] Overranked",
      rankUpPreview: ["1", "2", "3", "4", "5", "6", "7", "8"],
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("7");
  });

  it("400s on a skin without a name", async () => {
    const res = await request(app).post("/api/weapons").send({
      name: "[test:weapons] Nameless Skin",
      skins: [{ name: "  ", bonuses: [] }],
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("skin");
  });

  it("accepts a skin with exactly 5 bonuses and 400s on 6", async () => {
    const ok = await request(app).post("/api/weapons").send({
      name: "[test:weapons] Five Stars",
      skins: [{ name: "[test:weapons] Maxed", bonuses: ["a", "b", "c", "d", "e"] }],
    });
    expect(ok.status).toBe(201);
    expect(ok.body.weaponSkins[0].bonuses).toHaveLength(5);

    const res = await request(app).post("/api/weapons").send({
      name: "[test:weapons] Bonus Overload",
      skins: [{ name: "[test:weapons] Greedy", bonuses: ["a", "b", "c", "d", "e", "f"] }],
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("5");
  });

  it("400s when the owner mech is not S-tier", async () => {
    const standard = await prisma.mech.create({
      data: { name: "[test:weapons] Small Owner", rank: "Standard" },
    });
    const res = await request(app).post("/api/weapons").send({
      name: "[test:weapons] Misowned",
      mechId: standard.id,
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("S-tier");
  });

  it("409s when the mech already owns a weapon", async () => {
    const mech = await prisma.mech.create({ data: { name: "[test:weapons] Greedy Owner", rank: "S" } });
    const first = await request(app)
      .post("/api/weapons")
      .send({ name: "[test:weapons] First Arm", mechId: mech.id });
    expect(first.status).toBe(201);
    const res = await request(app)
      .post("/api/weapons")
      .send({ name: "[test:weapons] Second Arm", mechId: mech.id });
    expect(res.status).toBe(409);
    expect(res.body.error).toContain("already owns a weapon");
  });

  it("400s on an unknown pilot id", async () => {
    const res = await request(app).post("/api/weapons").send({
      name: "[test:weapons] Ghost Pilot",
      pilotId: "00000000-0000-4000-8000-000000000000",
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("Unknown pilot id");
  });
});

describe("PUT /api/weapons/:id", () => {
  it("updates fields and REPLACES the skins set", async () => {
    const created = await request(app).post("/api/weapons").send({
      name: "[test:weapons] Editable",
      skins: [{ name: "[test:weapons] Old Skin", bonuses: ["a"] }],
    });
    const res = await request(app).put(`/api/weapons/${created.body.id}`).send({
      name: "[test:weapons] Editable v2",
      tier: "S",
      skins: [
        { name: "[test:weapons] New Skin A", bonuses: ["x", "y"] },
        { name: "[test:weapons] New Skin B", bonuses: [] },
      ],
    });
    expect(res.status).toBe(200);
    expect(res.body.tier).toBe("S");
    const names = res.body.weaponSkins.map((s: { name: string }) => s.name).sort();
    expect(names).toEqual(["[test:weapons] New Skin A", "[test:weapons] New Skin B"]);
  });

  it("vacates the pilot with pilotId null and leaves them free", async () => {
    const pilot = await prisma.pilot.create({ data: { name: "[test:weapons] Freed" } });
    const created = await request(app)
      .post("/api/weapons")
      .send({ name: "[test:weapons] Crewed", pilotId: pilot.id });
    const res = await request(app)
      .put(`/api/weapons/${created.body.id}`)
      .send({ name: "[test:weapons] Crewed", pilotId: null });
    expect(res.status).toBe(200);
    expect(res.body.pilot).toBeNull();
    const freed = await prisma.pilot.findUnique({ where: { id: pilot.id } });
    expect(freed!.weaponId).toBeNull();
  });

  it("404s for an absent id", async () => {
    const res = await request(app)
      .put("/api/weapons/00000000-0000-4000-8000-000000000000")
      .send({ name: "[test:weapons] Nobody" });
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Weapon not found" });
  });

  it("seating a mech-seated pilot via PUT moves them (mech link cleared)", async () => {
    const mech = await prisma.mech.create({ data: { name: "[test:weapons] Prior Seat", rank: "S" } });
    const pilot = await prisma.pilot.create({
      data: { name: "[test:weapons] Transferee", mechId: mech.id },
    });
    const created = await request(app)
      .post("/api/weapons")
      .send({ name: "[test:weapons] Poaching Arm" });
    const res = await request(app)
      .put(`/api/weapons/${created.body.id}`)
      .send({ name: "[test:weapons] Poaching Arm", pilotId: pilot.id });
    expect(res.status).toBe(200);
    const moved = await prisma.pilot.findUnique({ where: { id: pilot.id } });
    expect(moved!.weaponId).toBe(created.body.id);
    expect(moved!.mechId).toBeNull();
  });
});

describe("DELETE /api/weapons/:id", () => {
  it("cascades skins, frees the pilot, spares mech and type", async () => {
    const type = await prisma.type.create({ data: { name: "[test:weapons] Spared Type" } });
    const mech = await prisma.mech.create({ data: { name: "[test:weapons] Spared Mech", rank: "S" } });
    const pilot = await prisma.pilot.create({ data: { name: "[test:weapons] Ejected" } });
    const created = await request(app).post("/api/weapons").send({
      name: "[test:weapons] Doomed Arm",
      typeId: type.id,
      mechId: mech.id,
      pilotId: pilot.id,
      skins: [{ name: "[test:weapons] Doomed Skin", bonuses: [] }],
    });
    const res = await request(app).delete(`/api/weapons/${created.body.id}`);
    expect(res.status).toBe(204);
    expect(await prisma.weaponSkin.findMany({ where: { weaponId: created.body.id } })).toEqual([]);
    const freed = await prisma.pilot.findUnique({ where: { id: pilot.id } });
    expect(freed).not.toBeNull();
    expect(freed!.weaponId).toBeNull();
    expect(await prisma.mech.findUnique({ where: { id: mech.id } })).not.toBeNull();
    expect(await prisma.type.findUnique({ where: { id: type.id } })).not.toBeNull();
  });

  it("404s for a malformed id", async () => {
    const res = await request(app).delete("/api/weapons/abc");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Weapon not found" });
  });
});

describe("weapon skill tree", () => {
  it("creates a 3-level tree via parentIndex and returns flat nodes", async () => {
    const res = await request(app).post("/api/weapons").send({
      name: "[test:weapons] Skilled",
      skills: [
        { name: "Root Strike", description: "Base.", appearanceLevel: 1, type: "Normal", parentIndex: null },
        { name: "Twin Strike", description: null, appearanceLevel: 3, type: "Premium", parentIndex: 0 },
        { name: null, description: "Hidden core power.", appearanceLevel: 10, type: "Core", parentIndex: 1 },
        { name: "Side Strike", description: null, appearanceLevel: 2, type: "Normal", parentIndex: 0 },
      ],
    });
    expect(res.status).toBe(201);
    const nodes = res.body.skillNodes;
    expect(nodes).toHaveLength(4);
    const root = nodes.find((n: { name: string | null }) => n.name === "Root Strike");
    const twin = nodes.find((n: { name: string | null }) => n.name === "Twin Strike");
    const core = nodes.find((n: { type: string }) => n.type === "Core");
    const side = nodes.find((n: { name: string | null }) => n.name === "Side Strike");
    expect(root.parentId).toBeNull();
    expect(twin.parentId).toBe(root.id);
    expect(core.parentId).toBe(twin.id);
    expect(core.name).toBeNull();
    expect(side.parentId).toBe(root.id);
    // sibling order among root's children: Twin (0), Side (1)
    expect(twin.sortOrder).toBe(0);
    expect(side.sortOrder).toBe(1);
  });

  it("nulls the name on Core skills even when one is sent", async () => {
    const res = await request(app).post("/api/weapons").send({
      name: "[test:weapons] Core Namer",
      skills: [
        { name: "should vanish", description: "core", appearanceLevel: 5, type: "Core", parentIndex: null },
      ],
    });
    expect(res.status).toBe(201);
    expect(res.body.skillNodes[0].name).toBeNull();
  });

  it("400s a Normal skill without a name", async () => {
    const res = await request(app).post("/api/weapons").send({
      name: "[test:weapons] Nameless Skill",
      skills: [{ name: "  ", description: null, appearanceLevel: 1, type: "Normal", parentIndex: null }],
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("name");
  });

  it("400s appearanceLevel outside 1-10", async () => {
    for (const appearanceLevel of [0, 11]) {
      const res = await request(app).post("/api/weapons").send({
        name: "[test:weapons] Bad Level",
        skills: [{ name: "X", description: null, appearanceLevel, type: "Normal", parentIndex: null }],
      });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain("1");
      expect(res.body.error).toContain("10");
    }
  });

  it("400s a parentIndex that doesn't reference an earlier entry", async () => {
    const res = await request(app).post("/api/weapons").send({
      name: "[test:weapons] Time Traveler",
      skills: [{ name: "X", description: null, appearanceLevel: 1, type: "Normal", parentIndex: 0 }],
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("earlier");
  });

  it("PUT replaces the whole tree", async () => {
    const created = await request(app).post("/api/weapons").send({
      name: "[test:weapons] Retrained",
      skills: [{ name: "Old Skill", description: null, appearanceLevel: 1, type: "Normal", parentIndex: null }],
    });
    const res = await request(app).put(`/api/weapons/${created.body.id}`).send({
      name: "[test:weapons] Retrained",
      skills: [
        { name: "New Root", description: null, appearanceLevel: 2, type: "Normal", parentIndex: null },
        { name: "New Child", description: null, appearanceLevel: 4, type: "Premium", parentIndex: 0 },
      ],
    });
    expect(res.status).toBe(200);
    const names = res.body.skillNodes.map((n: { name: string | null }) => n.name).sort();
    expect(names).toEqual(["New Child", "New Root"]);
  });

  it("DELETE cascades skill nodes", async () => {
    const created = await request(app).post("/api/weapons").send({
      name: "[test:weapons] Forgetful",
      skills: [{ name: "Doomed Skill", description: null, appearanceLevel: 1, type: "Normal", parentIndex: null }],
    });
    const res = await request(app).delete(`/api/weapons/${created.body.id}`);
    expect(res.status).toBe(204);
    expect(await prisma.skillNode.findMany({ where: { weaponId: created.body.id } })).toEqual([]);
  });
});
