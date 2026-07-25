import { afterAll, describe, expect, it, vi } from "vitest";
import request from "supertest";

// /api/me runs as a fixed DB user. requireUser is mocked to stamp that id.
const authState = vi.hoisted(() => ({ userId: "" }));
vi.mock("../lib/auth", () => ({
  requireUser: (req: any, _res: any, next: any) => { req.userId = authState.userId; next(); },
  currentUserId: (req: any) => req.userId ?? "",
  requireAdmin: (_req: any, _res: any, next: any) => next(),
}));

import { app } from "../app";
import { prisma } from "../lib/prisma";

// Each test provisions a real user row (find-or-create happens at OAuth
// callback in production, not in /api/me) and points authState at its id.
async function makeUser(accountId: string) {
  const user = await prisma.user.upsert({
    where: { provider_providerAccountId: { provider: "google", providerAccountId: accountId } },
    create: { provider: "google", providerAccountId: accountId },
    update: {},
  });
  authState.userId = user.id;
  return user;
}

afterAll(async () => {
  await prisma.user.deleteMany({ where: { providerAccountId: { startsWith: "test|" } } });
  await prisma.$disconnect();
});

describe("GET /api/me", () => {
  it("returns the current user's profile", async () => {
    const user = await makeUser("test|first-timer");
    const res = await request(app).get("/api/me");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: user.id, nickname: null, server: null });
  });

  it("401s when the user row is missing", async () => {
    authState.userId = "00000000-0000-0000-0000-000000000000";
    const res = await request(app).get("/api/me");
    expect(res.status).toBe(401);
  });
});

describe("PUT /api/me", () => {
  it("saves nickname and server (trimmed)", async () => {
    await makeUser("test|editor");
    const res = await request(app)
      .put("/api/me")
      .send({ nickname: "  [test:users] Banzai  ", server: " EU-7 " });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ nickname: "[test:users] Banzai", server: "EU-7" });
  });

  it("400s on a blank nickname", async () => {
    await makeUser("test|blank");
    const res = await request(app).put("/api/me").send({ nickname: "  ", server: null });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("nickname");
  });

  it("409s when the nickname is taken", async () => {
    await makeUser("test|taken-a");
    await request(app).put("/api/me").send({ nickname: "[test:users] Dup", server: null });
    await makeUser("test|taken-b");
    const res = await request(app).put("/api/me").send({ nickname: "[test:users] Dup", server: null });
    expect(res.status).toBe(409);
    expect(res.body.error).toContain("taken");
  });
});
