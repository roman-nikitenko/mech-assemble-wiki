import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../app";
import { prisma } from "../lib/prisma";
import { testAdminToken } from "../test/admin-token";

const ADMIN = { "x-admin-token": testAdminToken() };
const P = "[test:modules] ";

let weaponId = "";
let mechId = "";

beforeAll(async () => {
  const weapon = await prisma.weapon.create({ data: { name: P + "Rail Gun", tier: "S" } });
  const mech = await prisma.mech.create({ data: { name: P + "Golem", rank: "S" } });
  weaponId = weapon.id; mechId = mech.id;
});

afterAll(async () => {
  await prisma.module.deleteMany({ where: { name: { startsWith: P } } });
  await prisma.weapon.deleteMany({ where: { name: { startsWith: P } } });
  await prisma.mech.deleteMany({ where: { name: { startsWith: P } } });
  await prisma.$disconnect();
});

describe("modules API", () => {
  it("creates a weapon-module with a slot-2 weapon bonus", async () => {
    const res = await request(app).post("/api/modules").set(ADMIN).send({
      name: P + "Ammo Chain", effect2Target: "Weapon", effect3Target: "Weapon",
      bonuses: [
        { slot: 2, weaponId, mechId: null, effectText: "reload -0.5s", sortOrder: 0 },
      ],
    });
    expect(res.status).toBe(201);
    const detail = await request(app).get(`/api/modules/${res.body.id}`);
    expect(detail.body.bonuses[0].weapon.name).toBe(P + "Rail Gun");

    const list = await request(app).get("/api/modules");
    const listed = list.body.find((m: { id: string }) => m.id === res.body.id);
    expect(Array.isArray(listed.bonuses)).toBe(true);
    expect(listed.bonuses[0].weapon.name).toBe(P + "Rail Gun");
  });

  it("rejects a bonus whose target doesn't match its effect's target", async () => {
    const res = await request(app).post("/api/modules").set(ADMIN).send({
      name: P + "Bad Kind", effect2Target: "Weapon", effect3Target: "Weapon",
      bonuses: [
        { slot: 2, weaponId: null, mechId, effectText: "x", sortOrder: 0 }, // mech on a weapon-module
      ],
    });
    expect(res.status).toBe(400);
  });

  it("PUT replaces the whole bonus set", async () => {
    const created = await request(app).post("/api/modules").set(ADMIN).send({
      name: P + "Replaceable", effect2Target: "Weapon", effect3Target: "Mech",
      bonuses: [
        { slot: 2, weaponId, mechId: null, effectText: "reload -0.5s", sortOrder: 0 },
      ],
    });
    const id = created.body.id;
    await request(app).put(`/api/modules/${id}`).set(ADMIN).send({
      name: P + "Replaceable", effect2Target: "Weapon", effect3Target: "Mech",
      bonuses: [
        { slot: 3, mechId, weaponId: null, effectText: "boss dmg +15%", sortOrder: 0 },
      ],
    });
    const detail = await request(app).get(`/api/modules/${id}`);
    expect(detail.body.bonuses).toHaveLength(1);
    expect(detail.body.bonuses[0].mech.name).toBe(P + "Golem");
  });

  it("requires the admin token to write", async () => {
    const res = await request(app).post("/api/modules").send({ name: P + "NoAuth", effect2Target: "Weapon", effect3Target: "Weapon", bonuses: [] });
    expect(res.status).toBe(401);
  });
});
