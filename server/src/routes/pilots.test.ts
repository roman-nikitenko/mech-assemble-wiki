import { afterAll, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../app";
import { prisma } from "../lib/prisma";

// Write-capable tests share the dev DB. Per-file prefix "[test:pilots] " for
// EVERYTHING this file creates (pilots AND mechs), so parallel test files
// never touch each other's rows.
afterAll(async () => {
  await prisma.pilot.deleteMany({ where: { name: { startsWith: "[test:pilots] " } } });
  await prisma.mech.deleteMany({ where: { name: { startsWith: "[test:pilots] " } } });
  await prisma.$disconnect();
});

async function createSMech(name: string) {
  return prisma.mech.create({ data: { name, rank: "S" } });
}

describe("GET /api/pilots", () => {
  it("lists pilots with their linked mech", async () => {
    const mech = await createSMech("[test:pilots] Listed Mech");
    await prisma.pilot.create({
      data: { name: "[test:pilots] Lister", mechId: mech.id },
    });
    const res = await request(app).get("/api/pilots");
    expect(res.status).toBe(200);
    const pilot = res.body.find(
      (p: { name: string }) => p.name === "[test:pilots] Lister"
    );
    expect(pilot.mech).toMatchObject({ name: "[test:pilots] Listed Mech", rank: "S" });
  });
});

describe("POST /api/pilots", () => {
  it("creates a pilot with all fields and returns 201", async () => {
    const mech = await createSMech("[test:pilots] Full Kit Mech");
    const res = await request(app).post("/api/pilots").send({
      name: "[test:pilots] Kael",
      unlockBoost: "ATK +5%",
      relationshipBonus: "Thunder damage +10%",
      bonusPerLevel: ["HP +2%", "ATK +2%", "DEF +2%", "Crit +1%"],
      iconUrl: "/uploads/fake-icon.png",
      backgroundUrl: "/uploads/fake-bg.png",
      mechId: mech.id,
    });
    expect(res.status).toBe(201);
    expect(res.body.bonusPerLevel).toHaveLength(4);
    expect(res.body.mech.name).toBe("[test:pilots] Full Kit Mech");
  });

  it("400s on a blank name", async () => {
    const res = await request(app).post("/api/pilots").send({ name: " " });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("name");
  });

  it("400s on more than 4 level bonuses", async () => {
    const res = await request(app).post("/api/pilots").send({
      name: "[test:pilots] Overachiever",
      bonusPerLevel: ["a", "b", "c", "d", "e"],
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("4");
  });

  it("400s when linking to a Standard mech", async () => {
    const standard = await prisma.mech.create({
      data: { name: "[test:pilots] Standard Mech", rank: "Standard" },
    });
    const res = await request(app).post("/api/pilots").send({
      name: "[test:pilots] Wrong Cockpit",
      mechId: standard.id,
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("S-tier");
  });

  it("409s on a duplicate pilot name", async () => {
    const first = await request(app)
      .post("/api/pilots")
      .send({ name: "[test:pilots] Twin" });
    expect(first.status).toBe(201);
    const res = await request(app)
      .post("/api/pilots")
      .send({ name: "[test:pilots] Twin" });
    expect(res.status).toBe(409);
  });

  it("409s when the mech already has a pilot", async () => {
    const mech = await createSMech("[test:pilots] Crowded Mech");
    await request(app)
      .post("/api/pilots")
      .send({ name: "[test:pilots] First In", mechId: mech.id });
    const res = await request(app)
      .post("/api/pilots")
      .send({ name: "[test:pilots] Second In", mechId: mech.id });
    expect(res.status).toBe(409);
    expect(res.body.error).toContain("already has a pilot");
  });
});

describe("PUT /api/pilots/:id", () => {
  it("updates fields and relinks to another S mech", async () => {
    const m1 = await createSMech("[test:pilots] First Ride");
    const m2 = await createSMech("[test:pilots] Second Ride");
    const created = await request(app)
      .post("/api/pilots")
      .send({ name: "[test:pilots] Mover", mechId: m1.id });
    const res = await request(app).put(`/api/pilots/${created.body.id}`).send({
      name: "[test:pilots] Mover v2",
      unlockBoost: "DEF +10%",
      bonusPerLevel: ["a", "b"],
      mechId: m2.id,
    });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("[test:pilots] Mover v2");
    expect(res.body.mech.name).toBe("[test:pilots] Second Ride");
    expect(res.body.bonusPerLevel).toEqual(["a", "b"]);
  });

  it("404s for an absent id", async () => {
    const res = await request(app)
      .put("/api/pilots/00000000-0000-4000-8000-000000000000")
      .send({ name: "[test:pilots] Nobody" });
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Pilot not found" });
  });
});

describe("DELETE /api/pilots/:id", () => {
  it("deletes the pilot and leaves the mech alone", async () => {
    const mech = await createSMech("[test:pilots] Survivor Mech");
    const created = await request(app)
      .post("/api/pilots")
      .send({ name: "[test:pilots] Doomed Pilot", mechId: mech.id });
    const res = await request(app).delete(`/api/pilots/${created.body.id}`);
    expect(res.status).toBe(204);
    expect(await prisma.pilot.findUnique({ where: { id: created.body.id } })).toBeNull();
    // the mech is untouched
    expect(await prisma.mech.findUnique({ where: { id: mech.id } })).not.toBeNull();
  });

  it("404s for a malformed id", async () => {
    const res = await request(app).delete("/api/pilots/abc");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Pilot not found" });
  });
});
