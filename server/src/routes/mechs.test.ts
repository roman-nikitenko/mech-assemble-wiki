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
    },
  });
  alphaId = alpha.id;

  // 3-level NEW-system skill tree (root -> Premium child -> Core grandchild)
  // — preserves the "no depth cap" detail assertion on skill_nodes.
  const zapRoot = await prisma.skillNode.create({
    data: { mechId: alpha.id, name: `${P}Zap I`, appearanceLevel: 1, sortOrder: 0 },
  });
  const zapChild = await prisma.skillNode.create({
    data: {
      mechId: alpha.id,
      parentId: zapRoot.id,
      name: `${P}Zap II`,
      appearanceLevel: 3,
      type: "Premium",
      sortOrder: 0,
    },
  });
  await prisma.skillNode.create({
    data: {
      mechId: alpha.id,
      parentId: zapChild.id,
      name: null,
      description: `${P}core secret`,
      appearanceLevel: 10,
      type: "Core",
      sortOrder: 0,
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

    const nodes = res.body.skillNodes;
    expect(nodes).toHaveLength(3);
    const root = nodes.find((n: { name: string | null }) => n.name === `${P}Zap I`);
    const child = nodes.find((n: { name: string | null }) => n.name === `${P}Zap II`);
    const core = nodes.find((n: { type: string }) => n.type === "Core");
    expect(root.parentId).toBeNull();
    expect(child.parentId).toBe(root.id);
    // grandchild depth — proves the tree has no depth cap
    expect(core.parentId).toBe(child.id);
    expect(core.name).toBeNull();

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
