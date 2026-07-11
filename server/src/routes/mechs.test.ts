import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../app";
import { prisma } from "../lib/prisma";

// SELF-SUFFICIENT tests: there is no seed script anymore (it destroyed real
// admin-entered data twice). These tests provision their own fixtures with
// the "[test:mechs-read] " prefix, assert TOLERANTLY (the DB also contains
// the user's real rows), and clean up only what they created.

const P = "[test:mechs-read] ";

let voltTypeId: string;
let alphaId: string; // S mech with the full kit
let betaId: string; // bare Standard mech

beforeAll(async () => {
  const volt = await prisma.type.create({ data: { name: `${P}Volt` } });
  voltTypeId = volt.id;

  const alpha = await prisma.mech.create({
    data: {
      name: `${P}Alpha`,
      epithet: "Fixture Prime",
      typeId: volt.id,
      rank: "S",
      quality: "Supreme",
    },
  });
  alphaId = alpha.id;

  // skill with a 3-level upgrade tree (root -> child -> evolution grandchild)
  // so the detail test still proves the tree has no depth cap.
  const zap = await prisma.mechSkill.create({
    data: { mechId: alpha.id, name: `${P}Zap` },
  });
  const root = await prisma.skillUpgrade.create({
    data: { skillId: zap.id, name: `${P}Zap I` },
  });
  const child = await prisma.skillUpgrade.create({
    data: { skillId: zap.id, parentId: root.id, name: `${P}Zap II` },
  });
  await prisma.skillUpgrade.create({
    data: {
      skillId: zap.id,
      parentId: child.id,
      name: `${P}Zap Evolution`,
      isEvolution: true,
    },
  });

  await prisma.weapon.create({
    data: {
      mechId: alpha.id,
      name: `${P}Arc Blade`,
      tier: "S",
      weaponSkins: { create: [{ name: `${P}Chrome`, bonuses: ["ATK +1%"] }] },
      helpers: { create: [{ name: `${P}Buddy` }] },
    },
  });

  const beta = await prisma.mech.create({
    data: { name: `${P}Beta`, rank: "Standard" },
  });
  betaId = beta.id;
});

afterAll(async () => {
  // FK-safe order; only rows with OUR prefix. (Weapon helpers/skins and the
  // mech's skills cascade from their parents.)
  await prisma.weapon.deleteMany({ where: { name: { startsWith: P } } });
  await prisma.mech.deleteMany({ where: { name: { startsWith: P } } });
  await prisma.type.deleteMany({ where: { name: { startsWith: P } } });
  await prisma.$disconnect();
});

describe("GET /api/mechs", () => {
  it("lists mechs as summaries (tolerant of other rows)", async () => {
    const res = await request(app).get("/api/mechs");
    expect(res.status).toBe(200);
    const names = res.body.map((m: { name: string }) => m.name);
    expect(names).toContain(`${P}Alpha`);
    expect(names).toContain(`${P}Beta`);
    // summary fields ONLY — no lore, no relations
    const alpha = res.body.find((m: { id: string }) => m.id === alphaId);
    expect(Object.keys(alpha).sort()).toEqual([
      "epithet",
      "id",
      "imageUrl",
      "name",
      "quality",
      "rank",
      "type",
    ]);
  });

  it("filters by rank (tolerant)", async () => {
    const res = await request(app).get("/api/mechs?rank=S");
    expect(res.status).toBe(200);
    const names = res.body.map((m: { name: string }) => m.name);
    expect(names).toContain(`${P}Alpha`);
    expect(names).not.toContain(`${P}Beta`);
  });

  it("filters by typeId (our own type -> exactly our mech)", async () => {
    const res = await request(app).get(`/api/mechs?typeId=${voltTypeId}`);
    expect(res.body.map((m: { name: string }) => m.name)).toEqual([`${P}Alpha`]);
  });

  it("combines filters (no match -> empty array)", async () => {
    const res = await request(app).get(`/api/mechs?typeId=${voltTypeId}&rank=Standard`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("rejects a non-uuid typeId with 400", async () => {
    const res = await request(app).get("/api/mechs?typeId=Water");
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("Invalid typeId");
  });
});

describe("GET /api/mechs/:id", () => {
  it("returns the fixture mech fully nested with assembled upgrade trees", async () => {
    const res = await request(app).get(`/api/mechs/${alphaId}`);
    expect(res.status).toBe(200);
    expect(res.body.weapon.name).toBe(`${P}Arc Blade`);

    const zap = res.body.skills.find((s: { name: string }) => s.name === `${P}Zap`);
    // root -> child -> grandchild: proves the tree has no depth cap
    const root = zap.upgrades.find((u: { name: string }) => u.name === `${P}Zap I`);
    const child = root.children.find((c: { name: string }) => c.name === `${P}Zap II`);
    const evolution = child.children[0];
    expect(evolution.name).toBe(`${P}Zap Evolution`);
    expect(evolution.isEvolution).toBe(true);

    expect(res.body.weapon.weaponSkins).toHaveLength(1);
    expect(res.body.weapon.helpers).toHaveLength(1);
  });

  it("returns empty S-tier systems for a bare Standard mech", async () => {
    const res = await request(app).get(`/api/mechs/${betaId}`);
    expect(res.status).toBe(200);
    expect(res.body.weapon).toBeNull();
    expect(res.body.accessory).toBeNull();
    expect(res.body.skins).toEqual([]);
    expect(res.body.helpers).toEqual([]);
    expect(res.body.awakeningLevels).toEqual([]);
  });

  it("404s for a valid-but-absent uuid", async () => {
    const res = await request(app).get(
      "/api/mechs/00000000-0000-4000-8000-000000000000"
    );
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Mech not found" });
  });

  it("404s for a malformed id", async () => {
    const res = await request(app).get("/api/mechs/abc");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Mech not found" });
  });
});
