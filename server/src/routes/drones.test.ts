import { afterAll, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../app";
import { prisma } from "../lib/prisma";
import { testAdminToken } from "../test/admin-token";

const ADMIN = { "x-admin-token": testAdminToken() };

// Per-file prefix "[test:drones] " for everything this file creates.
// Drones reference drone_types with onDelete: SetNull, but we clean both.
afterAll(async () => {
  await prisma.drone.deleteMany({ where: { name: { startsWith: "[test:drones] " } } });
  await prisma.droneType.deleteMany({ where: { name: { startsWith: "[test:drones] " } } });
  await prisma.$disconnect();
});

describe("GET /api/drones", () => {
  it("lists drones ordered by name", async () => {
    await request(app).post("/api/drones").set(ADMIN).send({ name: "[test:drones] Zeta" });
    const res = await request(app).get("/api/drones");
    expect(res.status).toBe(200);
    const names = res.body
      .map((d: { name: string }) => d.name)
      .filter((n: string) => !n.startsWith("[test:"));
    expect([...names].sort()).toEqual(names);
    expect(res.body.some((d: { name: string }) => d.name === "[test:drones] Zeta")).toBe(true);
  });
});

describe("POST /api/drones", () => {
  it("creates a drone with an icon", async () => {
    const res = await request(app)
      .post("/api/drones")
      .set(ADMIN)
      .send({ name: "[test:drones] Scout", iconUrl: "/uploads/fake.png" });
    expect(res.status).toBe(201);
    expect(res.body.iconUrl).toBe("/uploads/fake.png");
  });

  it("creates a drone with tier, type, stats, video, and level-up bonuses", async () => {
    const dt = await request(app)
      .post("/api/drone-types")
      .set(ADMIN)
      .send({ name: "[test:drones] Laser" });
    const res = await request(app)
      .post("/api/drones")
      .set(ADMIN)
      .send({
        name: "[test:drones] Full",
        tier: "S",
        droneTypeId: dt.body.id,
        inheritAttack: "54.00k",
        atk: "10.80k",
        hp: "5400",
        def: "2200",
        previewVideoUrl: "/uploads/clip.mp4",
        levelUpBonuses: ["ATK +5%", "", "HP +10%", "", "dropped-5th"],
      });
    expect(res.status).toBe(201);
    expect(res.body.tier).toBe("S");
    expect(res.body.droneTypeId).toBe(dt.body.id);
    expect(res.body.atk).toBe("10.80k");
    expect(res.body.previewVideoUrl).toBe("/uploads/clip.mp4");
    // blanks dropped, capped at 4
    expect(res.body.levelUpBonuses).toEqual(["ATK +5%", "HP +10%"]);
  });

  it("400s on an unknown droneTypeId", async () => {
    const res = await request(app)
      .post("/api/drones")
      .set(ADMIN)
      .send({ name: "[test:drones] BadType", droneTypeId: "00000000-0000-4000-8000-000000000000" });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("Drone type not found");
  });

  it("400s on a blank name", async () => {
    const res = await request(app).post("/api/drones").set(ADMIN).send({ name: "  " });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("name");
  });

  it("409s on a duplicate name", async () => {
    await request(app).post("/api/drones").set(ADMIN).send({ name: "[test:drones] Dup" });
    const res = await request(app).post("/api/drones").set(ADMIN).send({ name: "[test:drones] Dup" });
    expect(res.status).toBe(409);
  });

  it("401s without an admin token", async () => {
    const res = await request(app).post("/api/drones").send({ name: "[test:drones] NoAuth" });
    expect(res.status).toBe(401);
  });
});

describe("PUT /api/drones/:id", () => {
  it("updates name and icon", async () => {
    const created = await request(app).post("/api/drones").set(ADMIN).send({ name: "[test:drones] Draft" });
    const res = await request(app)
      .put(`/api/drones/${created.body.id}`)
      .set(ADMIN)
      .send({ name: "[test:drones] Final", iconUrl: "/uploads/icon.png" });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("[test:drones] Final");
  });

  it("404s for an absent id", async () => {
    const res = await request(app)
      .put("/api/drones/00000000-0000-4000-8000-000000000000")
      .set(ADMIN)
      .send({ name: "[test:drones] Nobody" });
    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/drones/:id", () => {
  it("deletes a drone", async () => {
    const created = await request(app).post("/api/drones").set(ADMIN).send({ name: "[test:drones] Gone" });
    const res = await request(app).delete(`/api/drones/${created.body.id}`).set(ADMIN);
    expect(res.status).toBe(204);
  });

  it("404s for an absent id", async () => {
    const res = await request(app)
      .delete("/api/drones/00000000-0000-4000-8000-000000000000")
      .set(ADMIN);
    expect(res.status).toBe(404);
  });
});
