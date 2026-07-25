import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../app";
import { hashPassword, verifyAdminToken } from "../lib/auth";
import { testAdminToken } from "../test/admin-token";
import { prisma } from "../lib/prisma";

beforeAll(() => {
  process.env.ADMIN_LOGIN = "test-admin";
  process.env.ADMIN_PASSWORD_HASH = hashPassword("correct horse");
  process.env.ADMIN_JWT_SECRET = "test-secret";
});

afterAll(async () => {
  await prisma.type.deleteMany({ where: { name: { startsWith: "[test:admin] " } } });
  // Cascades take the builds/hearts of these users with them.
  await prisma.user.deleteMany({ where: { providerAccountId: { startsWith: "test|adminusers-" } } });
  await prisma.$disconnect();
});

describe("POST /api/admin/login", () => {
  it("returns a valid token for correct credentials", async () => {
    const res = await request(app)
      .post("/api/admin/login")
      .send({ login: "test-admin", password: "correct horse" });
    expect(res.status).toBe(200);
    expect(verifyAdminToken(res.body.token)).toBe(true);
  });

  it("401s with the SAME message for wrong login and wrong password", async () => {
    const wrongPass = await request(app)
      .post("/api/admin/login")
      .send({ login: "test-admin", password: "nope" });
    const wrongLogin = await request(app)
      .post("/api/admin/login")
      .send({ login: "nobody", password: "correct horse" });
    expect(wrongPass.status).toBe(401);
    expect(wrongLogin.status).toBe(401);
    expect(wrongPass.body.error).toBe(wrongLogin.body.error); // don't leak which
  });
});

describe("admin write guard", () => {
  it("401s a write without the token and accepts it with one", async () => {
    const noToken = await request(app)
      .post("/api/types")
      .send({ name: "[test:admin] Guarded" });
    expect(noToken.status).toBe(401);

    const withToken = await request(app)
      .post("/api/types")
      .set("x-admin-token", testAdminToken())
      .send({ name: "[test:admin] Guarded" });
    expect(withToken.status).toBe(201);
  });
});

describe("admin user management", () => {
  it("lists users (with build counts) only for an authenticated admin", async () => {
    const user = await prisma.user.create({
      data: { provider: "google", providerAccountId: "test|adminusers-list", name: "Listed User", nickname: "[test:admin] Listed" },
    });
    await prisma.build.create({
      data: { userId: user.id, name: "[test:admin] a build", skillIds: [], weaponIds: [] },
    });

    const noToken = await request(app).get("/api/admin/users");
    expect(noToken.status).toBe(401);

    const res = await request(app).get("/api/admin/users").set("x-admin-token", testAdminToken());
    expect(res.status).toBe(200);
    const row = res.body.find((u: { id: string }) => u.id === user.id);
    expect(row).toMatchObject({
      name: "Listed User",
      nickname: "[test:admin] Listed",
      buildCount: 1,
    });
  });

  it("deletes a user (cascading their builds) and 404s an unknown id", async () => {
    const user = await prisma.user.create({
      data: { provider: "google", providerAccountId: "test|adminusers-del", nickname: "[test:admin] Doomed" },
    });
    const build = await prisma.build.create({
      data: { userId: user.id, name: "[test:admin] doomed build", skillIds: [], weaponIds: [] },
    });

    const del = await request(app)
      .delete(`/api/admin/users/${user.id}`)
      .set("x-admin-token", testAdminToken());
    expect(del.status).toBe(204);
    expect(await prisma.user.findUnique({ where: { id: user.id } })).toBeNull();
    expect(await prisma.build.findUnique({ where: { id: build.id } })).toBeNull();

    const missing = await request(app)
      .delete(`/api/admin/users/${user.id}`)
      .set("x-admin-token", testAdminToken());
    expect(missing.status).toBe(404);
  });
});

describe("GET /api/admin/stats", () => {
  it("401s without an admin token", async () => {
    const res = await request(app).get("/api/admin/stats");
    expect(res.status).toBe(401);
  });

  it("counts users + published posts and returns visitors:null without GA", async () => {
    delete process.env.GA4_PROPERTY_ID; // force the graceful (null) visitor path

    const before = await request(app)
      .get("/api/admin/stats")
      .set("x-admin-token", testAdminToken());
    expect(before.status).toBe(200);
    const usersBefore = before.body.users.total as number;
    const postsBefore = before.body.posts.total as number;

    // One user + one Published build (counts) + one Draft build (does not).
    const user = await prisma.user.create({
      data: {
        provider: "google",
        providerAccountId: "test|adminusers-stats",
        nickname: "[test:admin] Stats",
      },
    });
    await prisma.build.create({
      data: {
        userId: user.id,
        name: "[test:admin] published",
        status: "Published",
        skillIds: [],
        weaponIds: [],
      },
    });
    await prisma.build.create({
      data: {
        userId: user.id,
        name: "[test:admin] draft",
        skillIds: [],
        weaponIds: [],
      },
    });

    const after = await request(app)
      .get("/api/admin/stats")
      .set("x-admin-token", testAdminToken());
    expect(after.body.users.total).toBe(usersBefore + 1);
    expect(after.body.posts.total).toBe(postsBefore + 1); // only the Published one
    expect(after.body.users.last30).toBeGreaterThanOrEqual(1); // just-created user
    expect(after.body.visitors).toBeNull();
  });
});
