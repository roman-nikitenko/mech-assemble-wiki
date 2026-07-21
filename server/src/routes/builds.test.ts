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

// Build names are prefixed [test:builds] so feed assertions can filter to only
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

// Create a build (as a Draft) and return its id.
async function createBuild(sub = "test|builds-a", overrides: Record<string, unknown> = {}) {
  authState.sub = sub;
  const res = await request(app).post("/api/builds").send({ ...BUILD, ...overrides });
  return res.body.id as string;
}

// Filter a feed/list response down to rows this suite created.
const testBuilds = (body: any[]) => body.filter((b) => b.name?.startsWith("[test:builds]"));

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

describe("POST /api/builds", () => {
  it("creates a build as a Draft and returns 201", async () => {
    authState.sub = "test|builds-a";
    const res = await request(app).post("/api/builds").send(BUILD);
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      name: "[test:builds] Zap rush",
      description: "Go fast",
      mechId: BUILD.mechId,
      status: "Draft",
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

  it("a new Draft does not appear in the public feed", async () => {
    await createBuild();
    const res = await request(app).get("/api/builds");
    expect(testBuilds(res.body)).toEqual([]);
  });
});

describe("GET /api/builds/mine", () => {
  it("returns all my builds regardless of status, newest first", async () => {
    await createBuild("test|builds-a", { name: "[test:builds] first" });
    const second = await createBuild("test|builds-a", { name: "[test:builds] second" });
    await request(app).post(`/api/builds/${second}/publish`);
    authState.sub = "test|builds-a";
    const res = await request(app).get("/api/builds/mine");
    expect(res.status).toBe(200);
    const rows = testBuilds(res.body);
    expect(rows).toHaveLength(2);
    // Publishing the second one bumps updatedAt, so it sorts first.
    expect(rows[0].name).toBe("[test:builds] second");
    expect(rows[0].status).toBe("Published");
    expect(rows[1].status).toBe("Draft");
  });

  it("does not include another user's builds", async () => {
    await createBuild("test|builds-a");
    authState.sub = "test|builds-b";
    const res = await request(app).get("/api/builds/mine");
    expect(testBuilds(res.body)).toEqual([]);
  });
});

describe("POST /api/builds/:id/publish", () => {
  it("moves a Draft into the feed", async () => {
    const id = await createBuild();
    const pub = await request(app).post(`/api/builds/${id}/publish`);
    expect(pub.status).toBe(200);
    expect(pub.body.status).toBe("Published");
    const feed = await request(app).get("/api/builds");
    expect(testBuilds(feed.body).map((b) => b.id)).toContain(id);
  });

  it("returns 403 for a build the requester doesn't own", async () => {
    const id = await createBuild("test|builds-a");
    authState.sub = "test|builds-b";
    const res = await request(app).post(`/api/builds/${id}/publish`);
    expect(res.status).toBe(403);
  });

  it("returns 404 for a non-existent build", async () => {
    authState.sub = "test|builds-a";
    const res = await request(app).post(
      "/api/builds/00000000-0000-0000-0000-000000000000/publish"
    );
    expect(res.status).toBe(404);
  });
});

describe("POST /api/builds/:id/unpost", () => {
  it("pulls a build from the feed but keeps the row and its hearts", async () => {
    const id = await createBuild();
    await request(app).post(`/api/builds/${id}/publish`);
    // Someone hearts it.
    authState.sub = "test|builds-b";
    await request(app).post(`/api/builds/${id}/heart`);

    authState.sub = "test|builds-a";
    const un = await request(app).post(`/api/builds/${id}/unpost`);
    expect(un.status).toBe(200);
    expect(un.body.status).toBe("Unposted");
    expect(un.body.hearts).toBe(1); // heart survived

    const feed = await request(app).get("/api/builds");
    expect(testBuilds(feed.body).map((b) => b.id)).not.toContain(id);

    // Still visible to the owner in their own list.
    const mine = await request(app).get("/api/builds/mine");
    expect(testBuilds(mine.body).map((b) => b.id)).toContain(id);
  });

  it("republishing an unposted build restores it with hearts intact", async () => {
    const id = await createBuild();
    await request(app).post(`/api/builds/${id}/publish`);
    authState.sub = "test|builds-b";
    await request(app).post(`/api/builds/${id}/heart`);
    authState.sub = "test|builds-a";
    await request(app).post(`/api/builds/${id}/unpost`);
    const re = await request(app).post(`/api/builds/${id}/publish`);
    expect(re.body.status).toBe("Published");
    expect(re.body.hearts).toBe(1);
  });
});

describe("PUT /api/builds/:id", () => {
  it("lets the owner edit fields, keeping status", async () => {
    const id = await createBuild();
    await request(app).post(`/api/builds/${id}/publish`);
    authState.sub = "test|builds-a";
    const res = await request(app)
      .put(`/api/builds/${id}`)
      .send({ ...BUILD, name: "[test:builds] renamed" });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("[test:builds] renamed");
    expect(res.body.status).toBe("Published"); // editing doesn't unpublish
  });

  it("returns 403 when a different user tries to edit", async () => {
    const id = await createBuild("test|builds-a");
    authState.sub = "test|builds-b";
    const res = await request(app).put(`/api/builds/${id}`).send(BUILD);
    expect(res.status).toBe(403);
  });

  it("returns 400 when the edited name is blank", async () => {
    const id = await createBuild();
    authState.sub = "test|builds-a";
    const res = await request(app).put(`/api/builds/${id}`).send({ ...BUILD, name: "  " });
    expect(res.status).toBe(400);
  });
});

describe("GET /api/builds/:id", () => {
  it("returns a Published build", async () => {
    const id = await createBuild();
    await request(app).post(`/api/builds/${id}/publish`);
    const res = await request(app).get(`/api/builds/${id}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(id);
  });

  it("returns 404 for a Draft (private share link)", async () => {
    const id = await createBuild();
    const res = await request(app).get(`/api/builds/${id}`);
    expect(res.status).toBe(404);
  });

  it("returns 404 for an Unposted build", async () => {
    const id = await createBuild();
    await request(app).post(`/api/builds/${id}/publish`);
    authState.sub = "test|builds-a";
    await request(app).post(`/api/builds/${id}/unpost`);
    const res = await request(app).get(`/api/builds/${id}`);
    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/builds/:id", () => {
  it("lets the owner delete their own build", async () => {
    const id = await createBuild();
    authState.sub = "test|builds-a";
    const del = await request(app).delete(`/api/builds/${id}`);
    expect(del.status).toBe(204);
    const mine = await request(app).get("/api/builds/mine");
    expect(testBuilds(mine.body)).toHaveLength(0);
  });

  it("returns 403 when a different user tries to delete", async () => {
    const id = await createBuild("test|builds-a");
    authState.sub = "test|builds-b";
    const del = await request(app).delete(`/api/builds/${id}`);
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
    const id = await createBuild("test|builds-a");
    authState.sub = "test|builds-b";
    const res = await request(app).post(`/api/builds/${id}/heart`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ hearts: 1, userHearted: true });
  });

  it("toggling a second time removes the heart and returns userHearted=false", async () => {
    const id = await createBuild("test|builds-a");
    authState.sub = "test|builds-b";
    await request(app).post(`/api/builds/${id}/heart`);
    const res = await request(app).post(`/api/builds/${id}/heart`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ hearts: 0, userHearted: false });
  });

  it("returns 404 for a non-existent build", async () => {
    authState.sub = "test|builds-a";
    const res = await request(app).post("/api/builds/00000000-0000-0000-0000-000000000000/heart");
    expect(res.status).toBe(404);
  });
});
