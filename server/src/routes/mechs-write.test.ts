import { afterAll, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../app";
import { prisma } from "../lib/prisma";

// These tests WRITE. Cleanup discipline: every record is named with the
// "[test:mechs] " prefix and removed in afterAll. Per-file prefixes are
// mandatory because Vitest runs files in parallel workers — a generic
// "[test] " prefix would let one file's afterAll delete rows another file
// is still using. (A separate test database is the proper long-term answer
// — deferred deliberately.)
afterAll(async () => {
  await prisma.pilot.deleteMany({ where: { name: { startsWith: "[test:mechs] " } } });
  await prisma.weapon.deleteMany({ where: { name: { startsWith: "[test:mechs] " } } });
  await prisma.mech.deleteMany({ where: { name: { startsWith: "[test:mechs] " } } });
  await prisma.trait.deleteMany({ where: { name: { startsWith: "[test:mechs] " } } });
  await prisma.type.deleteMany({ where: { name: { startsWith: "[test:mechs] " } } });
  await prisma.$disconnect();
});

describe("POST /api/mechs", () => {
  it("creates a mech with traits (created from names) and returns 201", async () => {
    const res = await request(app).post("/api/mechs").send({
      name: "[test:mechs] Iron Colossus",
      epithet: "Wall Breaker",
      rank: "Standard",
      iconUrl: "/uploads/colossus-icon.png",
      cardSkillIconUrl: "/uploads/colossus-card.png",
      traitNames: ["[test:mechs] Piercer"],
    });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe("[test:mechs] Iron Colossus");
    expect(res.body.imageUrl).toBeNull();
    // The trait name should have been created in the catalog and linked.
    const trait = await prisma.trait.findUnique({ where: { name: "[test:mechs] Piercer" } });
    expect(trait).not.toBeNull();
    const links = await prisma.mechTrait.findMany({ where: { mechId: res.body.id } });
    expect(links).toHaveLength(1);
    expect(links[0].traitId).toBe(trait!.id);
    // iconUrl isn't in the summary response — verify it landed via the DB.
    const stored = await prisma.mech.findUnique({ where: { id: res.body.id } });
    expect(stored?.iconUrl).toBe("/uploads/colossus-icon.png");
    expect(stored?.cardSkillIconUrl).toBe("/uploads/colossus-card.png");
  });

  it("reuses an existing catalog trait instead of duplicating it", async () => {
    const existing = await prisma.trait.create({ data: { name: "[test:mechs] Shared" } });
    const res = await request(app).post("/api/mechs").send({
      name: "[test:mechs] Reuser",
      rank: "Standard",
      // Duplicate + blank entries also collapse away in parsing.
      traitNames: ["[test:mechs] Shared", " [test:mechs] Shared ", "  "],
    });
    expect(res.status).toBe(201);
    const catalog = await prisma.trait.findMany({ where: { name: "[test:mechs] Shared" } });
    expect(catalog).toHaveLength(1);
    const links = await prisma.mechTrait.findMany({ where: { mechId: res.body.id } });
    expect(links).toHaveLength(1);
    expect(links[0].traitId).toBe(existing.id);
  });

  it("400s on a missing name", async () => {
    const res = await request(app).post("/api/mechs").send({ rank: "S" });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("name");
  });

  it("keeps rank-up preview positions (interior blanks stay, trailing drop)", async () => {
    const res = await request(app).post("/api/mechs").send({
      name: "[test:mechs] Ranker",
      rank: "Standard",
      // slot 3 deliberately empty, slots 5-7 trailing-empty
      rankUpPreview: ["HP +100", "ATK +5%", "", "New skill slot", "", "", ""],
    });
    expect(res.status).toBe(201);
    const stored = await prisma.mech.findUnique({ where: { id: res.body.id } });
    expect(stored?.rankUpPreview).toEqual(["HP +100", "ATK +5%", "", "New skill slot"]);
  });

  it("400s on more than 7 rank-up preview lines", async () => {
    const res = await request(app).post("/api/mechs").send({
      name: "[test:mechs] Overranked",
      rank: "Standard",
      rankUpPreview: ["1", "2", "3", "4", "5", "6", "7", "8"],
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("7");
  });

  it("creates skins with positional star bonuses", async () => {
    const res = await request(app).post("/api/mechs").send({
      name: "[test:mechs] Skinner",
      rank: "S",
      skins: [
        // ★2 left blank on purpose — ★3 must stay star 3.
        { name: "Void Walker", bonuses: ["HP +5%", "", "ATK +10%"], imageUrl: "/uploads/void.png" },
      ],
    });
    expect(res.status).toBe(201);
    const skinRows = await prisma.skin.findMany({
      where: { mechId: res.body.id },
      include: { stars: { orderBy: { star: "asc" } } },
    });
    expect(skinRows).toHaveLength(1);
    expect(skinRows[0].name).toBe("Void Walker");
    expect(skinRows[0].imageUrl).toBe("/uploads/void.png");
    expect(skinRows[0].stars.map((s) => [s.star, s.perk])).toEqual([
      [1, "HP +5%"],
      [3, "ATK +10%"],
    ]);
  });

  it("PUT replaces the skin set", async () => {
    const created = await request(app).post("/api/mechs").send({
      name: "[test:mechs] Reskinned",
      rank: "S",
      skins: [{ name: "Old Coat", bonuses: ["DEF +1%"] }],
    });
    const res = await request(app).put(`/api/mechs/${created.body.id}`).send({
      name: "[test:mechs] Reskinned",
      rank: "S",
      skins: [{ name: "New Coat", bonuses: ["DEF +2%"] }],
    });
    expect(res.status).toBe(200);
    const skinRows = await prisma.skin.findMany({
      where: { mechId: created.body.id },
      include: { stars: true },
    });
    expect(skinRows).toHaveLength(1);
    expect(skinRows[0].name).toBe("New Coat");
    expect(skinRows[0].stars.map((s) => s.perk)).toEqual(["DEF +2%"]);
  });

  it("400s on a skin without a name", async () => {
    const res = await request(app).post("/api/mechs").send({
      name: "[test:mechs] Nameless Skin",
      rank: "S",
      skins: [{ name: "  ", bonuses: [] }],
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("name");
  });

  it("400s when traitNames is not an array of strings", async () => {
    const res = await request(app).post("/api/mechs").send({
      name: "[test:mechs] Ghost Traits",
      rank: "Standard",
      traitNames: [123],
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("traitNames");
  });

  it("409s on a duplicate name", async () => {
    const first = await request(app)
      .post("/api/mechs")
      .send({ name: "[test:mechs] Twin", rank: "S" });
    expect(first.status).toBe(201);
    const res = await request(app)
      .post("/api/mechs")
      .send({ name: "[test:mechs] Twin", rank: "S" });
    expect(res.status).toBe(409);
  });
});

describe("PUT /api/mechs/:id", () => {
  it("updates fields and replaces the trait set", async () => {
    const created = await request(app).post("/api/mechs").send({
      name: "[test:mechs] Editable",
      rank: "Standard",
      traitNames: ["[test:mechs] Old Trait"],
    });
    const res = await request(app).put(`/api/mechs/${created.body.id}`).send({
      name: "[test:mechs] Editable v2",
      rank: "S",
      traitNames: ["[test:mechs] New Trait"],
    });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("[test:mechs] Editable v2");
    expect(res.body.rank).toBe("S");
    const t2 = await prisma.trait.findUnique({ where: { name: "[test:mechs] New Trait" } });
    const links = await prisma.mechTrait.findMany({ where: { mechId: created.body.id } });
    expect(links).toHaveLength(1);
    expect(links[0].traitId).toBe(t2!.id);
  });

  it("404s for an absent id", async () => {
    const res = await request(app)
      .put("/api/mechs/00000000-0000-4000-8000-000000000000")
      .send({ name: "[test:mechs] Nobody", rank: "S" });
    expect(res.status).toBe(404);
  });

  it("404s for a malformed id", async () => {
    const res = await request(app)
      .put("/api/mechs/abc")
      .send({ name: "[test:mechs] Nobody", rank: "S" });
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Mech not found" });
  });
});

describe("DELETE /api/mechs/:id", () => {
  it("deletes the mech and cascades to child rows", async () => {
    const created = await request(app).post("/api/mechs").send({
      name: "[test:mechs] Doomed",
      rank: "Standard",
    });
    const id = created.body.id;
    // give it a child row to prove the cascade
    await prisma.mechSkill.create({ data: { mechId: id, name: "[test:mechs] Boom" } });
    const res = await request(app).delete(`/api/mechs/${id}`);
    expect(res.status).toBe(204);
    expect(await prisma.mech.findUnique({ where: { id } })).toBeNull();
    expect(await prisma.mechSkill.findMany({ where: { mechId: id } })).toEqual([]);
  });

  it("404s for a malformed id", async () => {
    const res = await request(app).delete("/api/mechs/abc");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Mech not found" });
  });

  it("404s for a valid-but-absent uuid (P2025 path)", async () => {
    const res = await request(app).delete(
      "/api/mechs/00000000-0000-4000-8000-000000000000"
    );
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Mech not found" });
  });
});

describe("mech <-> pilot wiring", () => {
  it("creating an S mech with pilotId seats the pilot", async () => {
    const pilot = await prisma.pilot.create({ data: { name: "[test:mechs] Seated" } });
    const res = await request(app).post("/api/mechs").send({
      name: "[test:mechs] Cockpit",
      rank: "S",
      pilotId: pilot.id,
    });
    expect(res.status).toBe(201);
    const seated = await prisma.pilot.findUnique({ where: { id: pilot.id } });
    expect(seated!.mechId).toBe(res.body.id);
  });

  it("assigning an already-assigned pilot MOVES them", async () => {
    const pilot = await prisma.pilot.create({ data: { name: "[test:mechs] Poached" } });
    const first = await request(app).post("/api/mechs").send({
      name: "[test:mechs] Old Ride",
      rank: "S",
      pilotId: pilot.id,
    });
    const second = await request(app).post("/api/mechs").send({
      name: "[test:mechs] New Ride",
      rank: "S",
      pilotId: pilot.id,
    });
    expect(second.status).toBe(201);
    const moved = await prisma.pilot.findUnique({ where: { id: pilot.id } });
    expect(moved!.mechId).toBe(second.body.id);
    // the old mech's cockpit is now empty
    const oldPilot = await prisma.pilot.findFirst({ where: { mechId: first.body.id } });
    expect(oldPilot).toBeNull();
  });

  it("400s when a Standard mech gets a pilot", async () => {
    const pilot = await prisma.pilot.create({ data: { name: "[test:mechs] Grounded" } });
    const res = await request(app).post("/api/mechs").send({
      name: "[test:mechs] No Cockpit",
      rank: "Standard",
      pilotId: pilot.id,
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("S-tier");
  });

  it("deleting a mech frees its pilot (SetNull, not cascade)", async () => {
    const pilot = await prisma.pilot.create({ data: { name: "[test:mechs] Ejected" } });
    const mech = await request(app).post("/api/mechs").send({
      name: "[test:mechs] Doomed Ride",
      rank: "S",
      pilotId: pilot.id,
    });
    const del = await request(app).delete(`/api/mechs/${mech.body.id}`);
    expect(del.status).toBe(204);
    const freed = await prisma.pilot.findUnique({ where: { id: pilot.id } });
    expect(freed).not.toBeNull(); // pilot survives
    expect(freed!.mechId).toBeNull(); // cockpit vacated
  });

  it("seating a pilot into a mech un-seats them from any weapon", async () => {
    const weapon = await prisma.weapon.create({ data: { name: "[test:mechs] Left Arm" } });
    const pilot = await prisma.pilot.create({
      data: { name: "[test:mechs] Defector", weaponId: weapon.id },
    });
    const res = await request(app).post("/api/mechs").send({
      name: "[test:mechs] Poacher",
      rank: "S",
      pilotId: pilot.id,
    });
    expect(res.status).toBe(201);
    const moved = await prisma.pilot.findUnique({ where: { id: pilot.id } });
    expect(moved!.mechId).toBe(res.body.id);
    expect(moved!.weaponId).toBeNull();
  });

  it("PUT seating a weapon-fronting pilot clears their weapon link", async () => {
    const weapon = await prisma.weapon.create({ data: { name: "[test:mechs] Prior Arm" } });
    const pilot = await prisma.pilot.create({
      data: { name: "[test:mechs] Late Defector", weaponId: weapon.id },
    });
    const created = await request(app).post("/api/mechs").send({
      name: "[test:mechs] Late Poacher",
      rank: "S",
    });
    const res = await request(app).put(`/api/mechs/${created.body.id}`).send({
      name: "[test:mechs] Late Poacher",
      rank: "S",
      pilotId: pilot.id,
    });
    expect(res.status).toBe(200);
    const moved = await prisma.pilot.findUnique({ where: { id: pilot.id } });
    expect(moved!.mechId).toBe(created.body.id);
    expect(moved!.weaponId).toBeNull();
  });
});

describe("mech type link", () => {
  it("creates a mech with a typeId and returns the type object", async () => {
    const t = await prisma.type.create({ data: { name: "[test:mechs] Plasma" } });
    const res = await request(app).post("/api/mechs").send({
      name: "[test:mechs] Typed",
      rank: "Standard",
      typeId: t.id,
    });
    expect(res.status).toBe(201);
    expect(res.body.type).toMatchObject({ name: "[test:mechs] Plasma" });
  });

  it("400s on an unknown typeId", async () => {
    const res = await request(app).post("/api/mechs").send({
      name: "[test:mechs] Mystery Type",
      rank: "Standard",
      typeId: "00000000-0000-4000-8000-000000000000",
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("Unknown type id");
  });
});

describe("mech skill tree", () => {
  it("creates a 3-level tree on a mech via parentIndex", async () => {
    const res = await request(app).post("/api/mechs").send({
      name: "[test:mechs] Skilled Mech",
      rank: "S",
      skills: [
        { name: "Slash", description: "base", appearanceLevel: 1, type: "Normal", parentIndex: null },
        { name: "Double Slash", description: null, appearanceLevel: 4, type: "Premium", parentIndex: 0 },
        { name: null, description: "hidden core", appearanceLevel: 10, type: "Core", parentIndex: 1 },
      ],
    });
    expect(res.status).toBe(201);
    const nodes = await prisma.skillNode.findMany({ where: { mechId: res.body.id } });
    expect(nodes).toHaveLength(3);
    const root = nodes.find((n) => n.name === "Slash")!;
    const child = nodes.find((n) => n.name === "Double Slash")!;
    const core = nodes.find((n) => n.type === "Core")!;
    expect(child.parentId).toBe(root.id);
    expect(core.parentId).toBe(child.id);
    expect(core.name).toBeNull();
    expect(core.weaponId).toBeNull(); // mech-owned, not weapon-owned
  });

  it("PUT replaces the mech's whole tree", async () => {
    const created = await request(app).post("/api/mechs").send({
      name: "[test:mechs] Retrained Mech",
      rank: "Standard",
      skills: [{ name: "Old", description: null, appearanceLevel: 1, type: "Normal", parentIndex: null }],
    });
    const res = await request(app).put(`/api/mechs/${created.body.id}`).send({
      name: "[test:mechs] Retrained Mech",
      rank: "Standard",
      skills: [{ name: "New", description: null, appearanceLevel: 2, type: "Normal", parentIndex: null }],
    });
    expect(res.status).toBe(200);
    const nodes = await prisma.skillNode.findMany({ where: { mechId: created.body.id } });
    expect(nodes.map((n) => n.name)).toEqual(["New"]);
  });

  it("DELETE mech cascades its skill nodes", async () => {
    const created = await request(app).post("/api/mechs").send({
      name: "[test:mechs] Forgetful Mech",
      rank: "Standard",
      skills: [{ name: "Doomed", description: null, appearanceLevel: 1, type: "Normal", parentIndex: null }],
    });
    const id = created.body.id;
    const res = await request(app).delete(`/api/mechs/${id}`);
    expect(res.status).toBe(204);
    expect(await prisma.skillNode.findMany({ where: { mechId: id } })).toEqual([]);
  });
});
