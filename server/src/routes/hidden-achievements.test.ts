import { afterAll, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../app";
import { prisma } from "../lib/prisma";
import { testAdminToken } from "../test/admin-token";

const ADMIN = { "x-admin-token": testAdminToken() };
const PREFIX = "[test:hidden-achievements] ";
const MISSING_ID = "00000000-0000-4000-8000-000000000000";

afterAll(async () => {
  await prisma.hiddenAchievement.deleteMany({ where: { name: { startsWith: PREFIX } } });
  await prisma.$disconnect();
});

/** A valid POST body; override any field per test. */
function body(overrides: Record<string, unknown> = {}) {
  return {
    name: `${PREFIX}Lone Wolf`,
    description: "Clear the remaining enemies after your teammate is defeated.",
    tier: 1,
    rewards: ["Diamond x1,000", "Supply Coin x100"],
    ...overrides,
  };
}

async function make(label: string, tier = 1) {
  return prisma.hiddenAchievement.create({
    data: { name: `${PREFIX}${label}`, description: "d", tier, rewards: [] },
  });
}

describe("GET /api/hidden-achievements", () => {
  it("is public and lists achievements", async () => {
    const row = await make("Listed");
    const res = await request(app).get("/api/hidden-achievements");
    expect(res.status).toBe(200);
    expect(res.body.map((a: { id: string }) => a.id)).toContain(row.id);
  });
});

describe("POST /api/hidden-achievements", () => {
  it("requires an admin token", async () => {
    const res = await request(app).post("/api/hidden-achievements").send(body());
    expect(res.status).toBe(401);
  });

  it("creates an achievement with both rewards", async () => {
    const res = await request(app)
      .post("/api/hidden-achievements")
      .set(ADMIN)
      .send(body({ iconUrl: "/uploads/wolf.png", tier: 3 }));
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      name: `${PREFIX}Lone Wolf`,
      tier: 3,
      iconUrl: "/uploads/wolf.png",
      rewards: ["Diamond x1,000", "Supply Coin x100"],
    });
  });

  it("drops a blank reward instead of storing it", async () => {
    const res = await request(app)
      .post("/api/hidden-achievements")
      .set(ADMIN)
      .send(body({ name: `${PREFIX}One Reward`, rewards: ["  Diamond x500  ", "   "] }));
    expect(res.status).toBe(201);
    expect(res.body.rewards).toEqual(["Diamond x500"]);
  });

  it.each([
    ["a blank name", { name: "  " }],
    ["a blank description", { description: " " }],
    ["a missing description", { description: undefined }],
    ["tier 0", { tier: 0 }],
    ["tier 5", { tier: 5 }],
    ["a fractional tier", { tier: 2.5 }],
    ["a tier sent as text", { tier: "2" }],
    ["three rewards", { rewards: ["a", "b", "c"] }],
    ["rewards that aren't an array", { rewards: "Diamond" }],
    ["a reward that isn't text", { rewards: ["Diamond x1,000", 42] }],
  ])("rejects %s with 400", async (_label, overrides) => {
    const res = await request(app).post("/api/hidden-achievements").set(ADMIN).send(body(overrides));
    expect(res.status).toBe(400);
  });

  it("rejects a duplicate name with 409", async () => {
    await make("Dupe");
    const res = await request(app).post("/api/hidden-achievements").set(ADMIN).send(body({ name: `${PREFIX}Dupe` }));
    expect(res.status).toBe(409);
  });
});

describe("PUT /api/hidden-achievements/:id", () => {
  it("updates fields and replaces the rewards", async () => {
    const row = await make("Before");
    const res = await request(app)
      .put(`/api/hidden-achievements/${row.id}`)
      .set(ADMIN)
      .send(body({ name: `${PREFIX}After`, tier: 4, rewards: ["Ticket x1"] }));
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ name: `${PREFIX}After`, tier: 4, rewards: ["Ticket x1"] });
  });

  it("leaves sortOrder alone when it is not sent", async () => {
    const row = await prisma.hiddenAchievement.create({
      data: { name: `${PREFIX}Ordered`, description: "d", tier: 1, rewards: [], sortOrder: 5 },
    });
    const res = await request(app)
      .put(`/api/hidden-achievements/${row.id}`)
      .set(ADMIN)
      .send(body({ name: `${PREFIX}Ordered` }));
    expect(res.status).toBe(200);
    expect(res.body.sortOrder).toBe(5);
  });

  it("returns 404 for an unknown id", async () => {
    const res = await request(app).put(`/api/hidden-achievements/${MISSING_ID}`).set(ADMIN).send(body());
    expect(res.status).toBe(404);
  });

  it("returns 409 when renaming onto another achievement's name", async () => {
    await make("Taken");
    const row = await make("Renamer");
    const res = await request(app)
      .put(`/api/hidden-achievements/${row.id}`)
      .set(ADMIN)
      .send(body({ name: `${PREFIX}Taken` }));
    expect(res.status).toBe(409);
  });
});

describe("DELETE /api/hidden-achievements/:id", () => {
  it("requires an admin token", async () => {
    const row = await make("Guarded");
    const res = await request(app).delete(`/api/hidden-achievements/${row.id}`);
    expect(res.status).toBe(401);
  });

  it("deletes an achievement", async () => {
    const row = await make("Doomed");
    const res = await request(app).delete(`/api/hidden-achievements/${row.id}`).set(ADMIN);
    expect(res.status).toBe(204);
    expect(await prisma.hiddenAchievement.findUnique({ where: { id: row.id } })).toBeNull();
  });

  it("returns 404 for an unknown id", async () => {
    const res = await request(app).delete(`/api/hidden-achievements/${MISSING_ID}`).set(ADMIN);
    expect(res.status).toBe(404);
  });
});
