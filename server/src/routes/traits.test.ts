import { afterAll, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../app";
import { prisma } from "../lib/prisma";

// Write-capable tests share the dev DB. Cleanup discipline: every record we
// create is prefixed "[test:traits] " and removed in afterAll. Per-file
// prefixes are mandatory because Vitest runs files in parallel workers — a
// generic "[test] " prefix would let one file's afterAll delete rows another
// file is still using. (A separate test database is the proper long-term
// answer — deferred deliberately.)
afterAll(async () => {
  await prisma.trait.deleteMany({ where: { name: { startsWith: "[test:traits] " } } });
  await prisma.$disconnect();
});

describe("GET /api/traits", () => {
  it("lists traits ordered by name", async () => {
    // Self-provisioned (there is no seed anymore): create a trait, then
    // assert it shows up in the list.
    await prisma.trait.create({ data: { name: "[test:traits] Zulu" } });
    const res = await request(app).get("/api/traits");
    expect(res.status).toBe(200);
    const allNames = res.body.map((t: { name: string }) => t.name);
    expect(allNames).toContain("[test:traits] Zulu");
    // Ordering check excludes "[test:...] " rows: Postgres and JS disagree
    // on how "[" sorts, so including them makes this assertion flaky.
    const names = allNames.filter((n: string) => !n.startsWith("[test:"));
    expect([...names].sort()).toEqual(names);
  });
});

describe("POST /api/traits", () => {
  it("creates a trait", async () => {
    const res = await request(app)
      .post("/api/traits")
      .send({ name: "[test:traits] Piercing", color: "#123456" });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe("[test:traits] Piercing");
    expect(res.body.id).toBeDefined();
  });

  it("rejects a blank name", async () => {
    const res = await request(app).post("/api/traits").send({ name: "   " });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("name");
  });

  it("rejects a duplicate name with 409", async () => {
    await request(app).post("/api/traits").send({ name: "[test:traits] Dup" });
    const res = await request(app).post("/api/traits").send({ name: "[test:traits] Dup" });
    expect(res.status).toBe(409);
    expect(res.body.error).toContain("[test:traits] Dup");
  });
});
