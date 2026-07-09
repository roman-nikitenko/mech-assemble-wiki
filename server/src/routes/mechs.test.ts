import { afterAll, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../app";
import { prisma } from "../lib/prisma";

// These tests run against the seeded local dev database (npx prisma db seed).
// That's OK because this API is read-only; an API with writes would get a
// separate test database so tests can't corrupt dev data.

afterAll(async () => {
  await prisma.$disconnect();
});

describe("GET /api/mechs", () => {
  it("lists both seeded mechs as summaries", async () => {
    const res = await request(app).get("/api/mechs");
    expect(res.status).toBe(200);
    const names = res.body.map((m: { name: string }) => m.name);
    expect(names).toContain("Shadow Warrior");
    expect(names).toContain("Pirate Gunner");
    // summary fields ONLY — no lore, no relations
    expect(Object.keys(res.body[0]).sort()).toEqual([
      "epithet",
      "id",
      "imageUrl",
      "name",
      "quality",
      "rank",
      "type",
    ]);
  });

  it("filters by rank", async () => {
    const res = await request(app).get("/api/mechs?rank=S");
    expect(res.status).toBe(200);
    expect(res.body.map((m: { name: string }) => m.name)).toEqual([
      "Shadow Warrior",
    ]);
  });

  it("filters by type", async () => {
    const res = await request(app).get("/api/mechs?type=Physical");
    expect(res.body.map((m: { name: string }) => m.name)).toEqual([
      "Pirate Gunner",
    ]);
  });

  it("combines filters (no match -> empty array)", async () => {
    const res = await request(app).get("/api/mechs?type=Thunder&rank=Standard");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("rejects an invalid type with 400 and lists valid values", async () => {
    const res = await request(app).get("/api/mechs?type=Water");
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("Water");
    expect(res.body.error).toContain("Thunder");
  });
});

describe("GET /api/mechs/:id", () => {
  it("returns Shadow Warrior fully nested with assembled upgrade trees", async () => {
    const sw = await prisma.mech.findUnique({ where: { name: "Shadow Warrior" } });
    const res = await request(app).get(`/api/mechs/${sw!.id}`);
    expect(res.status).toBe(200);
    expect(res.body.weapon.name).toBe("Kusanagi Blade");

    const thunderSlash = res.body.skills.find(
      (s: { name: string }) => s.name === "Thunder Slash"
    );
    // root -> child -> grandchild: proves the tree has no depth cap
    const root = thunderSlash.upgrades.find(
      (u: { name: string }) => u.name === "Thunder Slash I"
    );
    const chain = root.children.find(
      (c: { name: string }) => c.name === "Chain Lightning"
    );
    const evolution = chain.children[0];
    expect(evolution.name).toBe("Storm Evolution");
    expect(evolution.isEvolution).toBe(true);

    expect(res.body.weapon.skins).toHaveLength(1);
    expect(res.body.weapon.helpers).toHaveLength(1);
  });

  it("returns empty S-tier systems for a Standard mech", async () => {
    const pg = await prisma.mech.findUnique({ where: { name: "Pirate Gunner" } });
    const res = await request(app).get(`/api/mechs/${pg!.id}`);
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
