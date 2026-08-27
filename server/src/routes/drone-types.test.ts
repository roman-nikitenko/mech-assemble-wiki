import { afterAll, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../app";
import { prisma } from "../lib/prisma";
import { testAdminToken } from "../test/admin-token";

const ADMIN = { "x-admin-token": testAdminToken() };

// Per-file prefix "[test:drone-types] " for everything this file creates.
afterAll(async () => {
  await prisma.droneType.deleteMany({ where: { name: { startsWith: "[test:drone-types] " } } });
  await prisma.$disconnect();
});

describe("GET /api/drone-types", () => {
  it("lists drone types ordered by name", async () => {
    await request(app).post("/api/drone-types").set(ADMIN).send({ name: "[test:drone-types] Zeta" });
    const res = await request(app).get("/api/drone-types");
    expect(res.status).toBe(200);
    const names = res.body
      .map((d: { name: string }) => d.name)
      .filter((n: string) => !n.startsWith("[test:"));
    expect([...names].sort()).toEqual(names);
    expect(res.body.some((d: { name: string }) => d.name === "[test:drone-types] Zeta")).toBe(true);
  });
});

describe("POST /api/drone-types", () => {
  it("creates a drone type with an icon", async () => {
    const res = await request(app)
      .post("/api/drone-types")
      .set(ADMIN)
      .send({ name: "[test:drone-types] Plasma", iconUrl: "/uploads/fake.png" });
    expect(res.status).toBe(201);
    expect(res.body.iconUrl).toBe("/uploads/fake.png");
  });

  it("400s on a blank name", async () => {
    const res = await request(app).post("/api/drone-types").set(ADMIN).send({ name: "  " });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("name");
  });

  it("409s on a duplicate name", async () => {
    await request(app).post("/api/drone-types").set(ADMIN).send({ name: "[test:drone-types] Dup" });
    const res = await request(app).post("/api/drone-types").set(ADMIN).send({ name: "[test:drone-types] Dup" });
    expect(res.status).toBe(409);
  });

  it("401s without an admin token", async () => {
    const res = await request(app).post("/api/drone-types").send({ name: "[test:drone-types] NoAuth" });
    expect(res.status).toBe(401);
  });
});

describe("PUT /api/drone-types/:id", () => {
  it("updates name and icon", async () => {
    const created = await request(app).post("/api/drone-types").set(ADMIN).send({ name: "[test:drone-types] Draft" });
    const res = await request(app)
      .put(`/api/drone-types/${created.body.id}`)
      .set(ADMIN)
      .send({ name: "[test:drone-types] Final", iconUrl: "/uploads/icon.png" });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("[test:drone-types] Final");
  });

  it("404s for an absent id", async () => {
    const res = await request(app)
      .put("/api/drone-types/00000000-0000-4000-8000-000000000000")
      .set(ADMIN)
      .send({ name: "[test:drone-types] Nobody" });
    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/drone-types/:id", () => {
  it("deletes a drone type", async () => {
    const created = await request(app).post("/api/drone-types").set(ADMIN).send({ name: "[test:drone-types] Gone" });
    const res = await request(app).delete(`/api/drone-types/${created.body.id}`).set(ADMIN);
    expect(res.status).toBe(204);
  });

  it("404s for an absent id", async () => {
    const res = await request(app)
      .delete("/api/drone-types/00000000-0000-4000-8000-000000000000")
      .set(ADMIN);
    expect(res.status).toBe(404);
  });
});
