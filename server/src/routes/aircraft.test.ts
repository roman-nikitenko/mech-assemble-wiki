import { afterAll, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../app";
import { prisma } from "../lib/prisma";
import { testAdminToken } from "../test/admin-token";

const ADMIN = { "x-admin-token": testAdminToken() };

// Per-file prefix "[test:aircraft] " for everything this file creates.
afterAll(async () => {
  await prisma.aircraft.deleteMany({ where: { name: { startsWith: "[test:aircraft] " } } });
  await prisma.$disconnect();
});

describe("GET /api/aircraft", () => {
  it("lists aircraft ordered by name", async () => {
    await request(app).post("/api/aircraft").set(ADMIN).send({ name: "[test:aircraft] Zeta" });
    const res = await request(app).get("/api/aircraft");
    expect(res.status).toBe(200);
    const names = res.body
      .map((a: { name: string }) => a.name)
      .filter((n: string) => !n.startsWith("[test:"));
    expect([...names].sort()).toEqual(names);
    expect(res.body.some((a: { name: string }) => a.name === "[test:aircraft] Zeta")).toBe(true);
  });
});

describe("POST /api/aircraft", () => {
  it("creates an aircraft with every field", async () => {
    const res = await request(app)
      .post("/api/aircraft")
      .set(ADMIN)
      .send({
        name: "[test:aircraft] Full",
        tier: "S",
        description: "A heavy gunship.\nTwo lines of lore.",
        imageUrl: "/uploads/fake.webp",
        hp: "54.00k",
        atk: "10.80k",
        def: "2200",
        specialBonus: "ATK +10%",
        rankUpPreview: ["ATK +5%", "", "HP +10%", "", "DEF +200"],
      });
    expect(res.status).toBe(201);
    expect(res.body.tier).toBe("S");
    expect(res.body.specialBonus).toBe("ATK +10%");
    expect(res.body.description).toBe("A heavy gunship.\nTwo lines of lore.");
    expect(res.body.imageUrl).toBe("/uploads/fake.webp");
    expect(res.body.hp).toBe("54.00k");
    expect(res.body.def).toBe("2200");
  });

  it("defaults to Standard tier and empty rank-up preview", async () => {
    const res = await request(app)
      .post("/api/aircraft")
      .set(ADMIN)
      .send({ name: "[test:aircraft] Bare" });
    expect(res.status).toBe(201);
    expect(res.body.tier).toBe("Standard");
    expect(res.body.rankUpPreview).toEqual([]);
    expect(res.body.description).toBeNull();
    expect(res.body.specialBonus).toBeNull();
  });

  // The one behaviour that differs from drones: the index IS the colour rank
  // (Orange…Mythic), so an interior blank has to keep its slot.
  it("keeps interior blanks in rankUpPreview but trims trailing ones", async () => {
    const res = await request(app)
      .post("/api/aircraft")
      .set(ADMIN)
      .send({
        name: "[test:aircraft] Positional",
        rankUpPreview: ["Orange thing", "", "Turquoise thing", "", ""],
      });
    expect(res.status).toBe(201);
    expect(res.body.rankUpPreview).toEqual(["Orange thing", "", "Turquoise thing"]);
  });

  it("400s on more than 5 rank-up lines", async () => {
    const res = await request(app)
      .post("/api/aircraft")
      .set(ADMIN)
      .send({
        name: "[test:aircraft] TooMany",
        rankUpPreview: ["a", "b", "c", "d", "e", "f"],
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("rankUpPreview");
  });

  it("400s on a blank name", async () => {
    const res = await request(app).post("/api/aircraft").set(ADMIN).send({ name: "  " });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("name");
  });

  it("400s on an invalid tier", async () => {
    const res = await request(app)
      .post("/api/aircraft")
      .set(ADMIN)
      .send({ name: "[test:aircraft] BadTier", tier: "Legendary" });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("tier");
  });

  it("409s on a duplicate name", async () => {
    await request(app).post("/api/aircraft").set(ADMIN).send({ name: "[test:aircraft] Dup" });
    const res = await request(app)
      .post("/api/aircraft")
      .set(ADMIN)
      .send({ name: "[test:aircraft] Dup" });
    expect(res.status).toBe(409);
  });

  it("401s without an admin token", async () => {
    const res = await request(app).post("/api/aircraft").send({ name: "[test:aircraft] NoAuth" });
    expect(res.status).toBe(401);
  });
});

describe("PUT /api/aircraft/:id", () => {
  it("updates name and image", async () => {
    const created = await request(app)
      .post("/api/aircraft")
      .set(ADMIN)
      .send({ name: "[test:aircraft] Draft" });
    const res = await request(app)
      .put(`/api/aircraft/${created.body.id}`)
      .set(ADMIN)
      .send({ name: "[test:aircraft] Final", imageUrl: "/uploads/image.webp" });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("[test:aircraft] Final");
    expect(res.body.imageUrl).toBe("/uploads/image.webp");
  });

  it("404s for an absent id", async () => {
    const res = await request(app)
      .put("/api/aircraft/00000000-0000-4000-8000-000000000000")
      .set(ADMIN)
      .send({ name: "[test:aircraft] Nobody" });
    expect(res.status).toBe(404);
  });

  it("401s without an admin token", async () => {
    const created = await request(app)
      .post("/api/aircraft")
      .set(ADMIN)
      .send({ name: "[test:aircraft] Guarded" });
    const res = await request(app)
      .put(`/api/aircraft/${created.body.id}`)
      .send({ name: "[test:aircraft] Hacked" });
    expect(res.status).toBe(401);
  });
});

describe("DELETE /api/aircraft/:id", () => {
  it("deletes an aircraft", async () => {
    const created = await request(app)
      .post("/api/aircraft")
      .set(ADMIN)
      .send({ name: "[test:aircraft] Gone" });
    const res = await request(app).delete(`/api/aircraft/${created.body.id}`).set(ADMIN);
    expect(res.status).toBe(204);
  });

  it("404s for an absent id", async () => {
    const res = await request(app)
      .delete("/api/aircraft/00000000-0000-4000-8000-000000000000")
      .set(ADMIN);
    expect(res.status).toBe(404);
  });
});
