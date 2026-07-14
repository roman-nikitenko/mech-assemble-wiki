import { afterAll, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../app";
import { prisma } from "../lib/prisma";

// Per-file prefix "[test:types] " for everything this file creates.
// Cleanup order matters: mechs reference types with onDelete: Restrict,
// so the mechs go first.
afterAll(async () => {
  await prisma.mech.deleteMany({ where: { name: { startsWith: "[test:types] " } } });
  await prisma.type.deleteMany({ where: { name: { startsWith: "[test:types] " } } });
  await prisma.$disconnect();
});

describe("GET /api/types", () => {
  it("lists types ordered by name", async () => {
    await request(app).post("/api/types").send({ name: "[test:types] Zeta" });
    const res = await request(app).get("/api/types");
    expect(res.status).toBe(200);
    const names = res.body
      .map((t: { name: string }) => t.name)
      .filter((n: string) => !n.startsWith("[test:"));
    expect([...names].sort()).toEqual(names);
    expect(res.body.some((t: { name: string }) => t.name === "[test:types] Zeta")).toBe(true);
  });
});

describe("POST /api/types", () => {
  it("creates a type with an icon", async () => {
    const res = await request(app)
      .post("/api/types")
      .send({ name: "[test:types] Plasma", iconUrl: "/uploads/fake.png" });
    expect(res.status).toBe(201);
    expect(res.body.iconUrl).toBe("/uploads/fake.png");
  });

  it("400s on a blank name", async () => {
    const res = await request(app).post("/api/types").send({ name: "  " });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("name");
  });

  it("409s on a duplicate name", async () => {
    await request(app).post("/api/types").send({ name: "[test:types] Dup" });
    const res = await request(app).post("/api/types").send({ name: "[test:types] Dup" });
    expect(res.status).toBe(409);
  });
});

describe("PUT /api/types/:id", () => {
  it("updates name and icon", async () => {
    const created = await request(app).post("/api/types").send({ name: "[test:types] Draft" });
    const res = await request(app)
      .put(`/api/types/${created.body.id}`)
      .send({ name: "[test:types] Final", iconUrl: "/uploads/icon.png" });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("[test:types] Final");
  });

  it("404s for an absent id", async () => {
    const res = await request(app)
      .put("/api/types/00000000-0000-4000-8000-000000000000")
      .send({ name: "[test:types] Nobody" });
    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/types/:id", () => {
  it("deletes an unused type", async () => {
    const created = await request(app).post("/api/types").send({ name: "[test:types] Unused" });
    const res = await request(app).delete(`/api/types/${created.body.id}`);
    expect(res.status).toBe(204);
  });

  it("409s with usage counts when a mech uses the type", async () => {
    const created = await request(app).post("/api/types").send({ name: "[test:types] Popular" });
    await prisma.mech.create({
      data: { name: "[test:types] Fan", rank: "Standard", typeId: created.body.id },
    });
    const res = await request(app).delete(`/api/types/${created.body.id}`);
    expect(res.status).toBe(409);
    expect(res.body.error).toContain("1 mech(s)");
    expect(res.body.error).toContain("[test:types] Popular");
  });
});
