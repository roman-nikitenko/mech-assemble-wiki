import { afterAll, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../app";
import { prisma } from "../lib/prisma";

// Per-file prefix "[test:accessories] " for everything this file creates.
afterAll(async () => {
  await prisma.accessory.deleteMany({ where: { name: { startsWith: "[test:accessories] " } } });
  await prisma.mech.deleteMany({ where: { name: { startsWith: "[test:accessories] " } } });
  await prisma.$disconnect();
});

async function createSMech(name: string) {
  return prisma.mech.create({ data: { name, rank: "S" } });
}

describe("GET /api/accessories", () => {
  it("lists accessories with their linked mech", async () => {
    const mech = await createSMech("[test:accessories] Wearer");
    await prisma.accessory.create({
      data: { name: "[test:accessories] Listed", tier: "S", mechId: mech.id },
    });
    const res = await request(app).get("/api/accessories");
    expect(res.status).toBe(200);
    const row = res.body.find((a: { name: string }) => a.name === "[test:accessories] Listed");
    expect(row.mech.name).toBe("[test:accessories] Wearer");
  });
});

describe("POST /api/accessories", () => {
  it("creates a full S-tier accessory", async () => {
    const mech = await createSMech("[test:accessories] Full Wearer");
    const res = await request(app).post("/api/accessories").send({
      name: "[test:accessories] Pendant",
      tier: "S",
      mechId: mech.id,
      attributes: [
        { name: "HP", value: "42.00k" },
        { name: "ATK", value: "8400" },
      ],
      exclusiveEffect: "Crit hits restore 1% HP",
      imageUrl: "/uploads/fake-accessory.png",
      iconUrl: "/uploads/fake-accessory-icon.png",
    });
    expect(res.status).toBe(201);
    expect(res.body.attributes).toHaveLength(2);
    expect(res.body.exclusiveEffect).toBe("Crit hits restore 1% HP");
    expect(res.body.mech.name).toBe("[test:accessories] Full Wearer");
    // both art slots round-trip
    expect(res.body.imageUrl).toBe("/uploads/fake-accessory.png");
    expect(res.body.iconUrl).toBe("/uploads/fake-accessory-icon.png");
  });

  it("400s on a blank name", async () => {
    const res = await request(app).post("/api/accessories").send({ name: " " });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("name");
  });

  it("400s on 3 attributes for S tier", async () => {
    const res = await request(app).post("/api/accessories").send({
      name: "[test:accessories] Overloaded",
      tier: "S",
      attributes: [
        { name: "a", value: "1" },
        { name: "b", value: "2" },
        { name: "c", value: "3" },
      ],
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("2");
  });

  it("400s on 2 attributes for Standard tier", async () => {
    const res = await request(app).post("/api/accessories").send({
      name: "[test:accessories] Too Standard",
      tier: "Standard",
      attributes: [
        { name: "a", value: "1" },
        { name: "b", value: "2" },
      ],
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("1");
  });

  it("400s when a Standard accessory links a mech", async () => {
    const mech = await createSMech("[test:accessories] Wrong Pair");
    const res = await request(app).post("/api/accessories").send({
      name: "[test:accessories] Mispaired",
      tier: "Standard",
      mechId: mech.id,
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("S-tier");
  });

  it("400s when the linked mech is not S rank", async () => {
    const standard = await prisma.mech.create({
      data: { name: "[test:accessories] Small Wearer", rank: "Standard" },
    });
    const res = await request(app).post("/api/accessories").send({
      name: "[test:accessories] Wrong Wearer",
      tier: "S",
      mechId: standard.id,
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("S-tier");
  });

  it("409s when the mech already has an accessory", async () => {
    const mech = await createSMech("[test:accessories] Greedy Wearer");
    const first = await request(app)
      .post("/api/accessories")
      .send({ name: "[test:accessories] First Charm", tier: "S", mechId: mech.id });
    expect(first.status).toBe(201);
    const res = await request(app)
      .post("/api/accessories")
      .send({ name: "[test:accessories] Second Charm", tier: "S", mechId: mech.id });
    expect(res.status).toBe(409);
    expect(res.body.error).toContain("already has an accessory");
  });

  it("normalizes exclusiveEffect to null when there is no mech", async () => {
    const res = await request(app).post("/api/accessories").send({
      name: "[test:accessories] Unlinked",
      tier: "S",
      exclusiveEffect: "should vanish",
    });
    expect(res.status).toBe(201);
    expect(res.body.exclusiveEffect).toBeNull();
  });
});

describe("PUT /api/accessories/:id", () => {
  it("retiers and relinks", async () => {
    const mech = await createSMech("[test:accessories] New Wearer");
    const created = await request(app)
      .post("/api/accessories")
      .send({ name: "[test:accessories] Mover", tier: "Standard" });
    const res = await request(app).put(`/api/accessories/${created.body.id}`).send({
      name: "[test:accessories] Mover v2",
      tier: "S",
      mechId: mech.id,
      attributes: [{ name: "DEF", value: "5100" }],
      exclusiveEffect: "Now paired",
    });
    expect(res.status).toBe(200);
    expect(res.body.tier).toBe("S");
    expect(res.body.mech.name).toBe("[test:accessories] New Wearer");
    expect(res.body.exclusiveEffect).toBe("Now paired");
  });

  it("404s for an absent id", async () => {
    const res = await request(app)
      .put("/api/accessories/00000000-0000-4000-8000-000000000000")
      .send({ name: "[test:accessories] Nobody" });
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Accessory not found" });
  });
});

describe("DELETE /api/accessories/:id", () => {
  it("deletes the accessory and leaves the mech alone", async () => {
    const mech = await createSMech("[test:accessories] Survivor");
    const created = await request(app)
      .post("/api/accessories")
      .send({ name: "[test:accessories] Doomed", tier: "S", mechId: mech.id });
    const res = await request(app).delete(`/api/accessories/${created.body.id}`);
    expect(res.status).toBe(204);
    expect(await prisma.mech.findUnique({ where: { id: mech.id } })).not.toBeNull();
  });

  it("404s for a malformed id", async () => {
    const res = await request(app).delete("/api/accessories/abc");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Accessory not found" });
  });
});
