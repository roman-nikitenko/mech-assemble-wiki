import { afterAll, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../app";
import { prisma } from "../lib/prisma";
import { testAdminToken } from "../test/admin-token";

const ADMIN = { "x-admin-token": testAdminToken() };

// The cost ladder is a fixed 6-row global table, so there is nothing to
// prefix-namespace. Snapshot it and restore it so a run leaves no trace.
let snapshot: unknown[] = [];

afterAll(async () => {
  await prisma.awakeningCostTier.deleteMany({});
  if (snapshot.length > 0) {
    await prisma.awakeningCostTier.createMany({ data: snapshot as never });
  }
  // Awakening rows cascade from the mech, so deleting the mech is enough.
  await prisma.mech.deleteMany({ where: { name: { startsWith: "[test:awakening] " } } });
  await prisma.$disconnect();
});

const SIX = Array.from({ length: 6 }, (_, i) => ({
  level: i + 1,
  outerPoints: (i + 1) * 100,
  outerShards: 30 + i * 10,
  coreMajor: i + 1,
  coreShards: 150 + i * 50,
  acctStats: [`HP +${(i + 1) * 1000}`],
}));

describe("PUT /api/awakening/cost-tiers", () => {
  it("requires an admin token", async () => {
    const res = await request(app).put("/api/awakening/cost-tiers").send({ tiers: SIX });
    expect(res.status).toBe(401);
  });

  it("replaces the whole ladder and reads it back", async () => {
    snapshot = await prisma.awakeningCostTier.findMany();
    const res = await request(app)
      .put("/api/awakening/cost-tiers")
      .set(ADMIN)
      .send({ tiers: SIX });
    expect(res.status).toBe(200);

    const read = await request(app).get("/api/awakening/cost-tiers");
    expect(read.status).toBe(200);
    expect(read.body).toHaveLength(6);
    expect(read.body[0]).toMatchObject({ level: 1, outerPoints: 100, outerShards: 30 });
    expect(read.body[5]).toMatchObject({ level: 6, coreMajor: 6 });
  });

  it("rejects a ladder that is not exactly levels 1-6", async () => {
    const res = await request(app)
      .put("/api/awakening/cost-tiers")
      .set(ADMIN)
      .send({ tiers: SIX.slice(0, 5) });
    expect(res.status).toBe(400);
  });

  it("rejects a duplicate level", async () => {
    const dupes = [...SIX.slice(0, 5), { ...SIX[4] }];
    const res = await request(app)
      .put("/api/awakening/cost-tiers")
      .set(ADMIN)
      .send({ tiers: dupes });
    expect(res.status).toBe(400);
  });
});

describe("/api/awakening/mechs/:mechId", () => {
  async function makeMech(rank: "S" | "Standard") {
    return prisma.mech.create({ data: { name: `[test:awakening] ${rank} ${Date.now()}`, rank } });
  }

  it("404s an unknown mech", async () => {
    const res = await request(app)
      .get("/api/awakening/mechs/00000000-0000-4000-8000-000000000000");
    expect(res.status).toBe(404);
  });

  it("requires an admin token to write", async () => {
    const mech = await makeMech("S");
    const res = await request(app)
      .put(`/api/awakening/mechs/${mech.id}`)
      .send({ levels: [] });
    expect(res.status).toBe(401);
  });

  it("refuses to write awakening onto a Standard mech", async () => {
    const mech = await makeMech("Standard");
    const res = await request(app)
      .put(`/api/awakening/mechs/${mech.id}`)
      .set(ADMIN)
      .send({ levels: [{ level: 1, nodes: [] }] });
    expect(res.status).toBe(400);
  });

  it("round-trips a level with its 5 nodes", async () => {
    const mech = await makeMech("S");
    const put = await request(app)
      .put(`/api/awakening/mechs/${mech.id}`)
      .set(ADMIN)
      .send({
        levels: [
          {
            level: 1,
            isLive: true,
            coreAttr: ["HP +5%", "ATK +5%"],
            coreSkill: "Fire Field DMG +100%",
            coreCd: [0, 0],
            corePower: 1000,
            coreLuckyId: 1301,
            nodes: [
              {
                position: 1,
                icon: "UI_Attr_hp",
                mechStat: "HP +15%",
                condEntry: "AwakenOrnamentReachSpecificQuality",
                condTargetId: 230006,
                condThreshold: 6,
                condText: "Accessory Fire Gauntlet reached 6 quality",
                condRaw: "77_230006_6",
              },
            ],
          },
          // A save must carry all six levels — the write replaces the whole
          // tree — so the five we do not care about here ride along blank.
          ...[2, 3, 4, 5, 6].map((n) => ({ level: n, nodes: [] })),
        ],
      });
    expect(put.status).toBe(200);

    const read = await request(app).get(`/api/awakening/mechs/${mech.id}`);
    expect(read.status).toBe(200);
    expect(read.body).toHaveLength(6);
    const one = read.body.find((l: { level: number }) => l.level === 1);
    expect(one).toMatchObject({ level: 1, isLive: true, coreSkill: "Fire Field DMG +100%" });
    expect(one.nodes[0]).toMatchObject({ position: 1, icon: "UI_Attr_hp", condTargetId: 230006 });
  });

  it("replaces the whole tree — a second PUT wins", async () => {
    const mech = await makeMech("S");
    const six = (withNode: boolean) =>
      [1, 2, 3, 4, 5, 6].map((n) => ({
        level: n,
        nodes: n === 1 && withNode ? [{ position: 1, icon: "UI_Attr_hp" }] : [],
      }));

    await request(app).put(`/api/awakening/mechs/${mech.id}`).set(ADMIN)
      .send({ levels: six(true) });
    await request(app).put(`/api/awakening/mechs/${mech.id}`).set(ADMIN)
      .send({ levels: six(false) });

    // The second body wins wholesale: level 1's node is gone, not merged.
    const read = await request(app).get(`/api/awakening/mechs/${mech.id}`);
    expect(read.body).toHaveLength(6);
    expect(read.body.find((l: { level: number }) => l.level === 1).nodes).toEqual([]);
  });

  it("rejects a body carrying fewer than six levels", async () => {
    // The PUT replaces the whole tree, so a one-level body would DELETE the
    // other five. The editor always sends six; anything else is a mistake we
    // refuse rather than silently honour.
    const mech = await makeMech("S");
    const res = await request(app)
      .put(`/api/awakening/mechs/${mech.id}`)
      .set(ADMIN)
      .send({ levels: [{ level: 1, nodes: [] }] });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/all six levels/i);
  });

  it("rejects an empty levels array rather than wiping the tree", async () => {
    const mech = await makeMech("S");
    await request(app)
      .put(`/api/awakening/mechs/${mech.id}`)
      .set(ADMIN)
      .send({ levels: [1, 2, 3, 4, 5, 6].map((n) => ({ level: n, nodes: [] })) });

    const res = await request(app)
      .put(`/api/awakening/mechs/${mech.id}`)
      .set(ADMIN)
      .send({ levels: [] });
    expect(res.status).toBe(400);

    // And the tree it would have wiped is still there.
    const read = await request(app).get(`/api/awakening/mechs/${mech.id}`);
    expect(read.body).toHaveLength(6);
  });

  it("accepts a complete six-level body", async () => {
    const mech = await makeMech("S");
    const res = await request(app)
      .put(`/api/awakening/mechs/${mech.id}`)
      .set(ADMIN)
      .send({ levels: [1, 2, 3, 4, 5, 6].map((n) => ({ level: n, isLive: n <= 3, nodes: [] })) });
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(6);
  });
});
