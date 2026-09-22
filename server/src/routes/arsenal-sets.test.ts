import { afterAll, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../app";
import { prisma } from "../lib/prisma";
import { testAdminToken } from "../test/admin-token";

const ADMIN = { "x-admin-token": testAdminToken() };
const PREFIX = "[test:arsenal-sets] ";
const MISSING_ID = "00000000-0000-4000-8000-000000000000";

afterAll(async () => {
  await prisma.arsenalSet.deleteMany({ where: { name: { startsWith: PREFIX } } });
  await prisma.$disconnect();
});

async function makeSet(label: string) {
  return prisma.arsenalSet.create({ data: { name: `${PREFIX}${label}` } });
}

describe("GET /api/arsenal-sets", () => {
  it("is public and lists sets", async () => {
    const set = await makeSet("Listed");
    const res = await request(app).get("/api/arsenal-sets");
    expect(res.status).toBe(200);
    expect(res.body.map((s: { id: string }) => s.id)).toContain(set.id);
  });
});

describe("POST /api/arsenal-sets", () => {
  it("requires an admin token", async () => {
    const res = await request(app).post("/api/arsenal-sets").send({ name: `${PREFIX}NoAuth` });
    expect(res.status).toBe(401);
  });

  it("creates a set with trimmed bonuses and icon", async () => {
    const res = await request(app).post("/api/arsenal-sets").set(ADMIN).send({
      name: `  ${PREFIX}Swift  `,
      iconUrl: "/uploads/swift.png",
      twoPieceBonus: "  Fire Rate +100%  ",
      fourPieceBonus: "Each shot increases DMG by 15%.",
    });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      name: `${PREFIX}Swift`,
      iconUrl: "/uploads/swift.png",
      twoPieceBonus: "Fire Rate +100%",
      fourPieceBonus: "Each shot increases DMG by 15%.",
      sortOrder: 0,
    });
  });

  it("stores blank bonuses as null", async () => {
    const res = await request(app)
      .post("/api/arsenal-sets")
      .set(ADMIN)
      .send({ name: `${PREFIX}Blank`, twoPieceBonus: "   ", fourPieceBonus: "" });
    expect(res.status).toBe(201);
    expect(res.body.twoPieceBonus).toBeNull();
    expect(res.body.fourPieceBonus).toBeNull();
  });

  it("rejects a blank name", async () => {
    const res = await request(app).post("/api/arsenal-sets").set(ADMIN).send({ name: "   " });
    expect(res.status).toBe(400);
  });

  it("rejects a duplicate name with 409", async () => {
    await makeSet("Dupe");
    const res = await request(app).post("/api/arsenal-sets").set(ADMIN).send({ name: `${PREFIX}Dupe` });
    expect(res.status).toBe(409);
  });
});

describe("PUT /api/arsenal-sets/:id", () => {
  it("updates the fields", async () => {
    const set = await makeSet("Before");
    const res = await request(app)
      .put(`/api/arsenal-sets/${set.id}`)
      .set(ADMIN)
      .send({ name: `${PREFIX}After`, fourPieceBonus: "DMG +200%" });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ name: `${PREFIX}After`, fourPieceBonus: "DMG +200%" });
  });

  it("leaves sortOrder alone when it is not sent", async () => {
    const set = await prisma.arsenalSet.create({ data: { name: `${PREFIX}Ordered`, sortOrder: 7 } });
    const res = await request(app)
      .put(`/api/arsenal-sets/${set.id}`)
      .set(ADMIN)
      .send({ name: `${PREFIX}Ordered` });
    expect(res.status).toBe(200);
    expect(res.body.sortOrder).toBe(7);
  });

  it("returns 404 for an unknown id", async () => {
    const res = await request(app).put(`/api/arsenal-sets/${MISSING_ID}`).set(ADMIN).send({ name: `${PREFIX}X` });
    expect(res.status).toBe(404);
  });

  it("returns 409 when renaming onto another set's name", async () => {
    await makeSet("Taken");
    const set = await makeSet("Renamer");
    const res = await request(app).put(`/api/arsenal-sets/${set.id}`).set(ADMIN).send({ name: `${PREFIX}Taken` });
    expect(res.status).toBe(409);
  });
});

describe("DELETE /api/arsenal-sets/:id", () => {
  it("requires an admin token", async () => {
    const set = await makeSet("Guarded");
    const res = await request(app).delete(`/api/arsenal-sets/${set.id}`);
    expect(res.status).toBe(401);
  });

  it("deletes a set", async () => {
    const set = await makeSet("Doomed");
    const res = await request(app).delete(`/api/arsenal-sets/${set.id}`).set(ADMIN);
    expect(res.status).toBe(204);
    expect(await prisma.arsenalSet.findUnique({ where: { id: set.id } })).toBeNull();
  });

  it("returns 404 for an unknown id", async () => {
    const res = await request(app).delete(`/api/arsenal-sets/${MISSING_ID}`).set(ADMIN);
    expect(res.status).toBe(404);
  });
});
