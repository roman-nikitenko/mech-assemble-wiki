import { afterAll, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../app";
import { prisma } from "../lib/prisma";
import { testAdminToken } from "../test/admin-token";

const ADMIN = { "x-admin-token": testAdminToken() };
const P = "[test:chips] ";

// Only rows with our prefix are ever deleted — real chips are never touched.
afterAll(async () => {
  await prisma.chip.deleteMany({ where: { name: { startsWith: P } } });
  await prisma.$disconnect();
});

const effect = (text: string, chance = 10, mode = "All modes") => ({ text, mode, chance });
const quality = (over: Record<string, unknown> = {}) => ({
  quality: 5,
  baseStats: ["HP +1,500", "", "ATK +300"],
  composeNext: 3,
  resetCost: "100 Gems",
  pools: [{ kind: "Base stat", chance: 76, effects: [effect("ATK +2%", 5.556), effect("", 1)] }],
  ...over,
});
const chip = (name: string, over: Record<string, unknown> = {}) => ({
  name: `${P}${name}`,
  category: "Head",
  qualities: [quality()],
  ...over,
});

describe("auth", () => {
  it("401s without an admin token on every write", async () => {
    expect((await request(app).post("/api/chips").send(chip("NoAuth"))).status).toBe(401);
    expect((await request(app).post("/api/chips/import").send({ chips: [] })).status).toBe(401);
    expect((await request(app).put("/api/chips/x").send(chip("NoAuth"))).status).toBe(401);
    expect((await request(app).delete("/api/chips/x")).status).toBe(401);
  });
});

describe("POST /api/chips", () => {
  it("creates a chip and normalises blanks, order and rounding", async () => {
    const res = await request(app)
      .post("/api/chips")
      .set(ADMIN)
      .send(
        chip("Full", {
          qualities: [
            quality({ quality: 13 }),
            quality({ quality: 2, pools: [] }),
          ],
        }),
      );
    expect(res.status).toBe(201);
    // qualities sorted by id, blank base stat dropped
    expect(res.body.qualities.map((q: { quality: number }) => q.quality)).toEqual([2, 13]);
    expect(res.body.qualities[1].baseStats).toEqual(["HP +1,500", "ATK +300"]);
    // blank effect dropped, chance rounded to 2 decimals
    expect(res.body.qualities[1].pools[0].effects).toEqual([effect("ATK +2%", 5.56)]);
  });

  it("drops a quality with nothing entered", async () => {
    const res = await request(app)
      .post("/api/chips")
      .set(ADMIN)
      .send(chip("Empty", { qualities: [{ quality: 1 }, quality()] }));
    expect(res.status).toBe(201);
    expect(res.body.qualities).toHaveLength(1);
  });

  it.each([
    ["bad category", { category: "Tail" }, "Category"],
    ["blank name", { name: "  " }, "name"],
    ["unknown quality id", { qualities: [quality({ quality: 9 })] }, "quality"],
    ["duplicate quality", { qualities: [quality(), quality()] }, "once"],
    ["bad mode", { qualities: [quality({ pools: [{ kind: "Base stat", chance: 1, effects: [effect("x", 1, "PvX")] }] })] }, "mode"],
    ["chance over 100", { qualities: [quality({ pools: [{ kind: "Base stat", chance: 101, effects: [effect("x")] }] })] }, "chance"],
    ["unknown pool kind", { qualities: [quality({ pools: [{ kind: "Nope", chance: 1, effects: [effect("x")] }] })] }, "pool kind"],
    [
      "repeated pool kind",
      {
        qualities: [
          quality({
            pools: [
              { kind: "Base stat", chance: 1, effects: [effect("x")] },
              { kind: "Base stat", chance: 1, effects: [effect("y")] },
            ],
          }),
        ],
      },
      "once",
    ],
    ["too many base stats", { qualities: [quality({ baseStats: ["a", "b", "c", "d", "e"] })] }, "base stats"],
    ["bad compose", { qualities: [quality({ composeNext: 1 })] }, "compose"],
  ])("400s on %s", async (_label, over, fragment) => {
    const res = await request(app).post("/api/chips").set(ADMIN).send(chip("Bad", over));
    expect(res.status).toBe(400);
    expect(res.body.error).toContain(fragment);
  });

  it("409s on a duplicate name", async () => {
    await request(app).post("/api/chips").set(ADMIN).send(chip("Dup"));
    const res = await request(app).post("/api/chips").set(ADMIN).send(chip("Dup"));
    expect(res.status).toBe(409);
  });
});

describe("GET /api/chips", () => {
  it("lists chips by category (enum order) then name", async () => {
    // Created out of order; Head sorts before Waist because of the enum order,
    // not alphabetically (Waist < Head would be wrong the other way round).
    for (const [n, category] of [["order-b", "Waist"], ["order-a", "Waist"], ["order-c", "Head"]]) {
      await request(app).post("/api/chips").set(ADMIN).send(chip(n, { category }));
    }
    const res = await request(app).get("/api/chips");
    expect(res.status).toBe(200);
    const ours = res.body.map((c: { name: string }) => c.name).filter((n: string) => n.startsWith(`${P}order-`));
    expect(ours).toEqual([`${P}order-c`, `${P}order-a`, `${P}order-b`]);
  });
});

describe("PUT /api/chips/:id", () => {
  it("updates a chip", async () => {
    const created = await request(app).post("/api/chips").set(ADMIN).send(chip("Draft"));
    const res = await request(app)
      .put(`/api/chips/${created.body.id}`)
      .set(ADMIN)
      .send(chip("Final", { category: "Legs", qualities: [quality({ quality: 8 })] }));
    expect(res.status).toBe(200);
    expect(res.body.name).toBe(`${P}Final`);
    expect(res.body.category).toBe("Legs");
    expect(res.body.qualities[0].quality).toBe(8);
  });

  it("404s for an absent id and a malformed id", async () => {
    const absent = await request(app)
      .put("/api/chips/00000000-0000-4000-8000-000000000000")
      .set(ADMIN)
      .send(chip("Nobody"));
    expect(absent.status).toBe(404);
    const bad = await request(app).put("/api/chips/not-a-uuid").set(ADMIN).send(chip("Nobody"));
    expect(bad.status).toBe(404);
  });
});

describe("DELETE /api/chips/:id", () => {
  it("deletes, then 404s", async () => {
    const created = await request(app).post("/api/chips").set(ADMIN).send(chip("Gone"));
    expect((await request(app).delete(`/api/chips/${created.body.id}`).set(ADMIN)).status).toBe(204);
    expect((await request(app).delete(`/api/chips/${created.body.id}`).set(ADMIN)).status).toBe(404);
  });
});

describe("POST /api/chips/import", () => {
  it("creates new chips, then updates them on a second run", async () => {
    const body = { chips: [chip("Imp-1"), chip("Imp-2", { category: "Chest" })] };
    const first = await request(app).post("/api/chips/import").set(ADMIN).send(body);
    expect(first.status).toBe(200);
    expect(first.body).toEqual({ created: 2, updated: 0 });

    body.chips[0] = chip("Imp-1", { qualities: [quality({ quality: 7 })] });
    const second = await request(app).post("/api/chips/import").set(ADMIN).send(body);
    expect(second.body).toEqual({ created: 0, updated: 2 });

    const list = await request(app).get("/api/chips");
    const one = list.body.find((c: { name: string }) => c.name === `${P}Imp-1`);
    expect(one.qualities[0].quality).toBe(7);
  });

  it("rejects the WHOLE batch when one chip is invalid, saving nothing", async () => {
    const res = await request(app)
      .post("/api/chips/import")
      .set(ADMIN)
      .send({ chips: [chip("Atomic-ok"), chip("Atomic-bad", { category: "Tail" })] });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("Atomic-bad");
    const list = await request(app).get("/api/chips");
    expect(list.body.some((c: { name: string }) => c.name === `${P}Atomic-ok`)).toBe(false);
  });

  it("rejects duplicate names in one file and an empty file", async () => {
    const dup = await request(app).post("/api/chips/import").set(ADMIN).send({ chips: [chip("Same"), chip("Same")] });
    expect(dup.status).toBe(400);
    const empty = await request(app).post("/api/chips/import").set(ADMIN).send({ chips: [] });
    expect(empty.status).toBe(400);
  });

  it("accepts a body bigger than express's 100kb default", async () => {
    // ~150kb of effect text across several chips: proves the 1mb limit is on.
    const big = "x".repeat(390);
    const effects = Array.from({ length: 40 }, (_, i) => effect(`${i} ${big}`));
    const qualities = [1, 2, 3, 4, 5, 6, 7, 8, 13].map((q) =>
      quality({ quality: q, pools: [{ kind: "Base stat", chance: 1, effects }] }),
    );
    const res = await request(app)
      .post("/api/chips/import")
      .set(ADMIN)
      .send({ chips: [chip("Big", { qualities })] });
    expect(res.status).toBe(200);
  });
});
