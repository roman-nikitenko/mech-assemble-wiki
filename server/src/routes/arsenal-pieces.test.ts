import { afterAll, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../app";
import { prisma } from "../lib/prisma";
import { testAdminToken } from "../test/admin-token";

const ADMIN = { "x-admin-token": testAdminToken() };
const PREFIX = "[test:arsenal-pieces] ";
const MISSING_ID = "00000000-0000-4000-8000-000000000000";

afterAll(async () => {
  // Pieces first: the set FK is Restrict, so sets with pieces can't go.
  await prisma.arsenalPiece.deleteMany({ where: { name: { startsWith: PREFIX } } });
  await prisma.arsenalSet.deleteMany({ where: { name: { startsWith: PREFIX } } });
  await prisma.$disconnect();
});

async function makeSet(label: string) {
  return prisma.arsenalSet.create({ data: { name: `${PREFIX}${label}` } });
}

/** A valid POST body; override any field per test. */
function body(overrides: Record<string, unknown> = {}) {
  return { name: `${PREFIX}Standard Belt`, slot: "Belt", qualityMin: 1, qualityMax: 13, ...overrides };
}

describe("POST /api/arsenal-pieces", () => {
  it("requires an admin token", async () => {
    const res = await request(app).post("/api/arsenal-pieces").send(body());
    expect(res.status).toBe(401);
  });

  it("creates a normal piece (no set)", async () => {
    const res = await request(app).post("/api/arsenal-pieces").set(ADMIN).send(body({ iconUrl: "/uploads/belt.png" }));
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      name: `${PREFIX}Standard Belt`,
      slot: "Belt",
      qualityMin: 1,
      qualityMax: 13,
      iconUrl: "/uploads/belt.png",
      setId: null,
      set: null,
    });
  });

  it("creates a set piece and returns the set's id and name", async () => {
    const set = await makeSet("Swift Set");
    const res = await request(app)
      .post("/api/arsenal-pieces")
      .set(ADMIN)
      .send(body({ name: `${PREFIX}Swift Belt`, qualityMin: 8, setId: set.id }));
    expect(res.status).toBe(201);
    expect(res.body.set).toEqual({ id: set.id, name: set.name });
  });

  it("allows the same name twice (the game ships normal AND set 'Swift Belt')", async () => {
    const set = await makeSet("Twice Set");
    const normal = await request(app)
      .post("/api/arsenal-pieces")
      .set(ADMIN)
      .send(body({ name: `${PREFIX}Twice Belt`, qualityMin: 4, qualityMax: 7 }));
    const inSet = await request(app)
      .post("/api/arsenal-pieces")
      .set(ADMIN)
      .send(body({ name: `${PREFIX}Twice Belt`, qualityMin: 8, setId: set.id }));
    expect([normal.status, inSet.status]).toEqual([201, 201]);
  });

  it("treats an empty-string setId as 'no set'", async () => {
    const res = await request(app).post("/api/arsenal-pieces").set(ADMIN).send(body({ setId: "" }));
    expect(res.status).toBe(201);
    expect(res.body.setId).toBeNull();
  });

  it.each([
    ["a blank name", { name: "  " }],
    ["an unknown slot", { slot: "Cape" }],
    ["a missing slot", { slot: undefined }],
    ["quality 0", { qualityMin: 0 }],
    ["quality 14", { qualityMax: 14 }],
    ["a fractional quality", { qualityMin: 1.5 }],
    ["a quality sent as text", { qualityMin: "1" }],
    ["min above max", { qualityMin: 9, qualityMax: 8 }],
    ["a malformed setId", { setId: "not-a-uuid" }],
  ])("rejects %s with 400", async (_label, overrides) => {
    const res = await request(app).post("/api/arsenal-pieces").set(ADMIN).send(body(overrides));
    expect(res.status).toBe(400);
  });

  it("rejects a setId for a set that doesn't exist", async () => {
    const res = await request(app).post("/api/arsenal-pieces").set(ADMIN).send(body({ setId: MISSING_ID }));
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/no longer exists/);
  });
});

describe("GET /api/arsenal-pieces", () => {
  it("is public and includes the piece's set", async () => {
    const set = await makeSet("Listed Set");
    const piece = await prisma.arsenalPiece.create({
      data: { name: `${PREFIX}Listed Helmet`, slot: "Helmet", qualityMin: 8, qualityMax: 13, setId: set.id },
    });
    const res = await request(app).get("/api/arsenal-pieces");
    expect(res.status).toBe(200);
    const found = res.body.find((p: { id: string }) => p.id === piece.id);
    expect(found.set).toEqual({ id: set.id, name: set.name });
  });
});

describe("PUT /api/arsenal-pieces/:id", () => {
  it("moves a piece out of its set (Set → Normal)", async () => {
    const set = await makeSet("Leaving Set");
    const piece = await prisma.arsenalPiece.create({
      data: { name: `${PREFIX}Leaving Boots`, slot: "Boots", qualityMin: 8, qualityMax: 13, setId: set.id },
    });
    const res = await request(app)
      .put(`/api/arsenal-pieces/${piece.id}`)
      .set(ADMIN)
      .send(body({ name: `${PREFIX}Leaving Boots`, slot: "Boots", setId: null }));
    expect(res.status).toBe(200);
    expect(res.body.setId).toBeNull();
  });

  it("returns 404 for an unknown id", async () => {
    const res = await request(app).put(`/api/arsenal-pieces/${MISSING_ID}`).set(ADMIN).send(body());
    expect(res.status).toBe(404);
  });

  it("validates like POST", async () => {
    const piece = await prisma.arsenalPiece.create({
      data: { name: `${PREFIX}Valid Greaves`, slot: "Greaves", qualityMin: 1, qualityMax: 6 },
    });
    const res = await request(app).put(`/api/arsenal-pieces/${piece.id}`).set(ADMIN).send(body({ qualityMax: 0 }));
    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/arsenal-pieces/:id", () => {
  it("requires an admin token", async () => {
    const piece = await prisma.arsenalPiece.create({
      data: { name: `${PREFIX}Guarded`, slot: "Belt", qualityMin: 1, qualityMax: 1 },
    });
    const res = await request(app).delete(`/api/arsenal-pieces/${piece.id}`);
    expect(res.status).toBe(401);
  });

  it("deletes a piece", async () => {
    const piece = await prisma.arsenalPiece.create({
      data: { name: `${PREFIX}Doomed`, slot: "Belt", qualityMin: 1, qualityMax: 1 },
    });
    const res = await request(app).delete(`/api/arsenal-pieces/${piece.id}`).set(ADMIN);
    expect(res.status).toBe(204);
    expect(await prisma.arsenalPiece.findUnique({ where: { id: piece.id } })).toBeNull();
  });

  it("returns 404 for an unknown id", async () => {
    const res = await request(app).delete(`/api/arsenal-pieces/${MISSING_ID}`).set(ADMIN);
    expect(res.status).toBe(404);
  });
});
