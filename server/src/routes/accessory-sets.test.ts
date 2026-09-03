import { afterAll, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../app";
import { prisma } from "../lib/prisma";
import { testAdminToken } from "../test/admin-token";

const ADMIN = { "x-admin-token": testAdminToken() };
const PREFIX = "[test:accessory-sets] ";

afterAll(async () => {
  await prisma.accessorySet.deleteMany({ where: { name: { startsWith: PREFIX } } });
  await prisma.accessory.deleteMany({ where: { name: { startsWith: PREFIX } } });
  await prisma.$disconnect();
});

async function makeAccessory(label: string) {
  return prisma.accessory.create({ data: { name: `${PREFIX}${label}`, tier: "Standard" } });
}

describe("POST /api/accessory-sets", () => {
  it("requires an admin token", async () => {
    const res = await request(app).post("/api/accessory-sets").send({ name: `${PREFIX}A` });
    expect(res.status).toBe(401);
  });

  it("creates a set with its members, in order", async () => {
    const [a, b] = [await makeAccessory("Gauntlet"), await makeAccessory("Mask")];
    const res = await request(app).post("/api/accessory-sets").set(ADMIN).send({
      name: `${PREFIX}Regalia`,
      bonus: "ATK +10% while all three are equipped",
      accessoryIds: [b.id, a.id],
    });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe(`${PREFIX}Regalia`);
    // Order is the order sent, not alphabetical or insertion order by id.
    expect(res.body.accessories.map((x: { id: string }) => x.id)).toEqual([b.id, a.id]);
  });

  it("rejects a blank name", async () => {
    const res = await request(app).post("/api/accessory-sets").set(ADMIN).send({ name: "   " });
    expect(res.status).toBe(400);
  });

  it("rejects a duplicate name", async () => {
    await request(app).post("/api/accessory-sets").set(ADMIN).send({ name: `${PREFIX}Dupe` });
    const res = await request(app).post("/api/accessory-sets").set(ADMIN).send({ name: `${PREFIX}Dupe` });
    expect(res.status).toBe(409);
  });

  it("rejects an accessory id that does not exist", async () => {
    const res = await request(app).post("/api/accessory-sets").set(ADMIN).send({
      name: `${PREFIX}Ghost`,
      accessoryIds: ["00000000-0000-4000-8000-000000000000"],
    });
    expect(res.status).toBe(400);
  });

  it("ignores a repeated accessory id rather than erroring", async () => {
    const a = await makeAccessory("Twice");
    const res = await request(app).post("/api/accessory-sets").set(ADMIN).send({
      name: `${PREFIX}Repeat`,
      accessoryIds: [a.id, a.id],
    });
    expect(res.status).toBe(201);
    expect(res.body.accessories).toHaveLength(1);
  });
});

describe("GET /api/accessory-sets", () => {
  it("is public and returns sets with their accessories", async () => {
    const a = await makeAccessory("Public");
    await request(app).post("/api/accessory-sets").set(ADMIN).send({
      name: `${PREFIX}Readable`, accessoryIds: [a.id],
    });
    const res = await request(app).get("/api/accessory-sets");
    expect(res.status).toBe(200);
    const mine = res.body.find((s: { name: string }) => s.name === `${PREFIX}Readable`);
    expect(mine.accessories[0]).toMatchObject({ id: a.id, name: `${PREFIX}Public` });
  });
});

describe("PUT /api/accessory-sets/:id", () => {
  it("requires an admin token", async () => {
    const created = await prisma.accessorySet.create({ data: { name: `${PREFIX}PutAuth` } });
    const res = await request(app)
      .put(`/api/accessory-sets/${created.id}`)
      .send({ name: `${PREFIX}PutAuth changed` });
    expect(res.status).toBe(401);
  });

  it("replaces the member list wholesale", async () => {
    const [a, b] = [await makeAccessory("Before"), await makeAccessory("After")];
    const created = await request(app).post("/api/accessory-sets").set(ADMIN).send({
      name: `${PREFIX}Swap`, accessoryIds: [a.id],
    });
    const res = await request(app)
      .put(`/api/accessory-sets/${created.body.id}`)
      .set(ADMIN)
      .send({ name: `${PREFIX}Swap`, bonus: "changed", accessoryIds: [b.id] });
    expect(res.status).toBe(200);
    expect(res.body.bonus).toBe("changed");
    expect(res.body.accessories.map((x: { id: string }) => x.id)).toEqual([b.id]);
  });

  it("leaves sortOrder untouched when the caller omits it", async () => {
    // The admin editor never sends sortOrder. A PUT that omits it must not
    // reset a value set another way (by hand, or a future reorder UI) to 0.
    const created = await prisma.accessorySet.create({
      data: { name: `${PREFIX}KeepOrder`, sortOrder: 7 },
    });
    const res = await request(app)
      .put(`/api/accessory-sets/${created.id}`)
      .set(ADMIN)
      .send({ name: `${PREFIX}KeepOrder`, bonus: "unrelated edit" });
    expect(res.status).toBe(200);
    expect(res.body.sortOrder).toBe(7);
  });

  it("404s an unknown id", async () => {
    const res = await request(app)
      .put("/api/accessory-sets/00000000-0000-4000-8000-000000000000")
      .set(ADMIN)
      .send({ name: `${PREFIX}Nope` });
    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/accessory-sets/:id", () => {
  it("requires an admin token", async () => {
    const created = await prisma.accessorySet.create({ data: { name: `${PREFIX}DeleteAuth` } });
    const res = await request(app).delete(`/api/accessory-sets/${created.id}`);
    expect(res.status).toBe(401);
  });

  it("deletes the set but NOT its accessories", async () => {
    const a = await makeAccessory("Survivor");
    const created = await request(app).post("/api/accessory-sets").set(ADMIN).send({
      name: `${PREFIX}Doomed`, accessoryIds: [a.id],
    });
    const res = await request(app).delete(`/api/accessory-sets/${created.body.id}`).set(ADMIN);
    expect(res.status).toBe(204);
    // The catalogue row must survive — a set is a grouping, not an owner.
    expect(await prisma.accessory.findUnique({ where: { id: a.id } })).not.toBeNull();
  });
});
