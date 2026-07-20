import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

// Auth is mocked: authState.sub controls which user the request runs as.
const authState = vi.hoisted(() => ({ sub: "test|builds-a" }));
vi.mock("../lib/auth", () => ({
  requireUser: (req: any, _res: any, next: any) => {
    req.auth = { payload: { sub: authState.sub } };
    next();
  },
  authSub: (req: any) => req.auth?.payload?.sub ?? "",
  requireAdmin: (_req: any, _res: any, next: any) => next(),
}));

import { app } from "../app";
import { prisma } from "../lib/prisma";

// Build names are prefixed [test:builds] so assertions can filter to only
// test rows, leaving real posted builds untouched (CLAUDE.md convention).
const BUILD = {
  name: "[test:builds] Zap rush",
  description: "Go fast",
  mechId: "11111111-1111-1111-1111-111111111111",
  weaponId: null,
  skillIds: ["s1", "s2"],
  weaponIds: ["w1"],
  weaponSkillIds: { w1: ["ws1"] },
};

afterAll(async () => {
  // Cascade delete removes builds when users are deleted.
  await prisma.user.deleteMany({ where: { auth0Sub: { startsWith: "test|builds" } } });
  await prisma.$disconnect();
});

beforeEach(async () => {
  // Clean builds between tests without touching the users row.
  const users = await prisma.user.findMany({
    where: { auth0Sub: { startsWith: "test|builds" } },
  });
  const ids = users.map((u) => u.id);
  await prisma.build.deleteMany({ where: { userId: { in: ids } } });
});

// Helper: filter the feed to only rows this test suite created.
const testBuilds = (body: any[]) => body.filter((b) => b.name?.startsWith("[test:builds]"));

describe("GET /api/builds", () => {
  it("returns no test builds before any are posted", async () => {
    const res = await request(app).get("/api/builds");
    expect(res.status).toBe(200);
    expect(testBuilds(res.body)).toEqual([]);
  });

  it("returns posted test builds with author info, newest first", async () => {
    authState.sub = "test|builds-a";
    await request(app).post("/api/builds").send(BUILD);
    await request(app).post("/api/builds").send({ ...BUILD, name: "[test:builds] Second build" });
    const res = await request(app).get("/api/builds");
    expect(res.status).toBe(200);
    const rows = testBuilds(res.body);
    expect(rows).toHaveLength(2);
    expect(rows[0].name).toBe("[test:builds] Second build"); // newest first
    expect(rows[0]).toMatchObject({
      mechId: BUILD.mechId,
      skillIds: BUILD.skillIds,
      weaponIds: BUILD.weaponIds,
      weaponSkillIds: BUILD.weaponSkillIds,
      hearts: 0,
      author: { nickname: null, server: null },
    });
  });
});

describe("POST /api/builds", () => {
  it("creates a build and returns 201", async () => {
    authState.sub = "test|builds-a";
    const res = await request(app).post("/api/builds").send(BUILD);
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      name: "[test:builds] Zap rush",
      description: "Go fast",
      mechId: BUILD.mechId,
      hearts: 0,
    });
    expect(res.body.id).toBeTruthy();
  });

  it("returns 400 when name is missing", async () => {
    authState.sub = "test|builds-a";
    const { name: _n, ...noName } = BUILD;
    const res = await request(app).post("/api/builds").send(noName);
    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/builds/:id", () => {
  it("lets the owner delete their own build", async () => {
    authState.sub = "test|builds-a";
    const post = await request(app).post("/api/builds").send(BUILD);
    const del = await request(app).delete(`/api/builds/${post.body.id}`);
    expect(del.status).toBe(204);
    const list = await request(app).get("/api/builds");
    expect(testBuilds(list.body)).toHaveLength(0);
  });

  it("returns 403 when a different user tries to delete", async () => {
    authState.sub = "test|builds-a";
    const post = await request(app).post("/api/builds").send(BUILD);
    authState.sub = "test|builds-b";
    const del = await request(app).delete(`/api/builds/${post.body.id}`);
    expect(del.status).toBe(403);
  });

  it("returns 404 for a non-existent id", async () => {
    authState.sub = "test|builds-a";
    const res = await request(app).delete("/api/builds/00000000-0000-0000-0000-000000000000");
    expect(res.status).toBe(404);
  });
});

describe("POST /api/builds/:id/heart", () => {
  it("adds a heart and returns hearts=1 and userHearted=true", async () => {
    authState.sub = "test|builds-a";
    const { body: build } = await request(app).post("/api/builds").send(BUILD);
    authState.sub = "test|builds-b";
    const res = await request(app).post(`/api/builds/${build.id}/heart`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ hearts: 1, userHearted: true });
  });

  it("toggling a second time removes the heart and returns userHearted=false", async () => {
    authState.sub = "test|builds-a";
    const { body: build } = await request(app).post("/api/builds").send(BUILD);
    authState.sub = "test|builds-b";
    await request(app).post(`/api/builds/${build.id}/heart`);
    const res = await request(app).post(`/api/builds/${build.id}/heart`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ hearts: 0, userHearted: false });
  });

  it("returns 404 for a non-existent build", async () => {
    authState.sub = "test|builds-a";
    const res = await request(app).post("/api/builds/00000000-0000-0000-0000-000000000000/heart");
    expect(res.status).toBe(404);
  });
});
