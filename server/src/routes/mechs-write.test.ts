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
  await prisma.mech.deleteMany({ where: { name: { startsWith: "[test:mechs] " } } });
  await prisma.trait.deleteMany({ where: { name: { startsWith: "[test:mechs] " } } });
  await prisma.type.deleteMany({ where: { name: { startsWith: "[test:mechs] " } } });
  await prisma.$disconnect();
});

describe("POST /api/mechs", () => {
  it("creates a mech with traits and returns 201", async () => {
    const trait = await prisma.trait.create({ data: { name: "[test:mechs] Piercer" } });
    const res = await request(app).post("/api/mechs").send({
      name: "[test:mechs] Iron Colossus",
      epithet: "Wall Breaker",
      rank: "Standard",
      traitIds: [trait.id],
    });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe("[test:mechs] Iron Colossus");
    expect(res.body.imageUrl).toBeNull();
    const links = await prisma.mechTrait.findMany({ where: { mechId: res.body.id } });
    expect(links).toHaveLength(1);
  });

  it("400s on a missing name", async () => {
    const res = await request(app).post("/api/mechs").send({ rank: "S" });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("name");
  });

  it("400s on unknown trait ids", async () => {
    const res = await request(app).post("/api/mechs").send({
      name: "[test:mechs] Ghost Traits",
      rank: "Standard",
      traitIds: ["00000000-0000-4000-8000-000000000000"],
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("Unknown trait ids");
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
    const t1 = await prisma.trait.create({ data: { name: "[test:mechs] Old Trait" } });
    const t2 = await prisma.trait.create({ data: { name: "[test:mechs] New Trait" } });
    const created = await request(app).post("/api/mechs").send({
      name: "[test:mechs] Editable",
      rank: "Standard",
      traitIds: [t1.id],
    });
    const res = await request(app).put(`/api/mechs/${created.body.id}`).send({
      name: "[test:mechs] Editable v2",
      rank: "S",
      traitIds: [t2.id],
    });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("[test:mechs] Editable v2");
    expect(res.body.rank).toBe("S");
    const links = await prisma.mechTrait.findMany({ where: { mechId: created.body.id } });
    expect(links).toHaveLength(1);
    expect(links[0].traitId).toBe(t2.id);
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
