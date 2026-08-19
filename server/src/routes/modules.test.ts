import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../app";
import { prisma } from "../lib/prisma";
import { testAdminToken } from "../test/admin-token";

const ADMIN = { "x-admin-token": testAdminToken() };
const P = "[test:modules] ";

let goldId = "";     // effectCount 2
let mythicId = "";   // effectCount 3
let weaponId = "";
let mechId = "";

beforeAll(async () => {
  const gold = await prisma.moduleQuality.create({ data: { name: P + "Gold", hp: "22.00k", atk: "4400", def: "2200", effectCount: 2, sortOrder: 2 } });
  const mythic = await prisma.moduleQuality.create({ data: { name: P + "Mythic", hp: "30.00k", atk: "6000", def: "3000", effectCount: 3, sortOrder: 3 } });
  goldId = gold.id; mythicId = mythic.id;
  const weapon = await prisma.weapon.create({ data: { name: P + "Rail Gun", tier: "S" } });
  const mech = await prisma.mech.create({ data: { name: P + "Golem", rank: "S" } });
  weaponId = weapon.id; mechId = mech.id;
});

afterAll(async () => {
  await prisma.module.deleteMany({ where: { name: { startsWith: P } } });
  await prisma.moduleQuality.deleteMany({ where: { name: { startsWith: P } } });
  await prisma.weapon.deleteMany({ where: { name: { startsWith: P } } });
  await prisma.mech.deleteMany({ where: { name: { startsWith: P } } });
  await prisma.$disconnect();
});

describe("modules API", () => {
  it("creates a weapon-module with effect1 + a slot-2 weapon bonus", async () => {
    const res = await request(app).post("/api/modules").set(ADMIN).send({
      name: P + "Ammo Chain", effect2Target: "Weapon", effect3Target: "Weapon", sortOrder: 1,
      qualityEffects: [
        { qualityId: goldId, effect1Value: "+20%", bonuses: [
          { slot: 2, weaponId, mechId: null, effectText: "reload -0.5s", sortOrder: 0 },
        ] },
      ],
    });
    expect(res.status).toBe(201);
    const detail = await request(app).get(`/api/modules/${res.body.id}`);
    expect(detail.body.effects[0].effect1Value).toBe("+20%");
    expect(detail.body.effects[0].bonuses[0].weapon.name).toBe(P + "Rail Gun");

    const list = await request(app).get("/api/modules");
    const listed = list.body.find((m: { id: string }) => m.id === res.body.id);
    expect(Array.isArray(listed.effects)).toBe(true);
    expect(listed.effects[0].bonuses[0].weapon.name).toBe(P + "Rail Gun");
  });

  it("rejects a bonus whose target doesn't match its effect's target", async () => {
    const res = await request(app).post("/api/modules").set(ADMIN).send({
      name: P + "Bad Kind", effect2Target: "Weapon", effect3Target: "Weapon",
      qualityEffects: [
        { qualityId: goldId, effect1Value: "+20%", bonuses: [
          { slot: 2, weaponId: null, mechId, effectText: "x", sortOrder: 0 }, // mech on a weapon-module
        ] },
      ],
    });
    expect(res.status).toBe(400);
  });

  it("rejects a slot-3 bonus at a quality whose effectCount is < 3", async () => {
    const res = await request(app).post("/api/modules").set(ADMIN).send({
      name: P + "Overreach", effect2Target: "Weapon", effect3Target: "Weapon",
      qualityEffects: [
        { qualityId: goldId, effect1Value: "+20%", bonuses: [
          { slot: 3, weaponId, mechId: null, effectText: "x", sortOrder: 0 }, // slot 3 needs count>=3
        ] },
      ],
    });
    expect(res.status).toBe(400);
  });

  it("PUT replaces the whole effect set", async () => {
    const created = await request(app).post("/api/modules").set(ADMIN).send({
      name: P + "Replaceable", effect2Target: "Weapon", effect3Target: "Mech",
      qualityEffects: [{ qualityId: goldId, effect1Value: "+10%", bonuses: [] }],
    });
    const id = created.body.id;
    await request(app).put(`/api/modules/${id}`).set(ADMIN).send({
      name: P + "Replaceable", effect2Target: "Weapon", effect3Target: "Mech",
      qualityEffects: [
        { qualityId: mythicId, effect1Value: "+30%", bonuses: [
          { slot: 3, mechId, weaponId: null, effectText: "boss dmg +15%", sortOrder: 0 },
        ] },
      ],
    });
    const detail = await request(app).get(`/api/modules/${id}`);
    expect(detail.body.effects).toHaveLength(1);
    expect(detail.body.effects[0].qualityId).toBe(mythicId);
    expect(detail.body.effects[0].bonuses[0].mech.name).toBe(P + "Golem");
  });

  it("requires the admin token to write", async () => {
    const res = await request(app).post("/api/modules").send({ name: P + "NoAuth", effect2Target: "Weapon", effect3Target: "Weapon", qualityEffects: [] });
    expect(res.status).toBe(401);
  });
});
