import { afterAll, describe, expect, it, vi } from "vitest";
import request from "supertest";

// All /api/me tests run with a FAKE identity — the auth module is mocked so
// no request ever touches Auth0. authState.sub is switched per test.
const authState = vi.hoisted(() => ({ sub: "test|default" }));
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

afterAll(async () => {
  await prisma.user.deleteMany({ where: { auth0Sub: { startsWith: "test|" } } });
  await prisma.$disconnect();
});

describe("GET /api/me", () => {
  it("creates the user on first call and finds it on the second", async () => {
    authState.sub = "test|first-timer";
    const first = await request(app).get("/api/me");
    expect(first.status).toBe(201);
    expect(first.body).toMatchObject({ nickname: null, server: null, isNew: true });
    const second = await request(app).get("/api/me");
    expect(second.status).toBe(200);
    expect(second.body).toMatchObject({ isNew: false });
    expect(second.body.id).toBe(first.body.id);
  });
});

describe("GET /api/me — Auth0 name capture", () => {
  it("stores the x-display-name header on create and refreshes it when it changes", async () => {
    authState.sub = "test|named";
    const created = await request(app)
      .get("/api/me")
      .set("x-display-name", encodeURIComponent("Kael Voss"));
    expect(created.status).toBe(201);
    expect(created.body.name).toBe("Kael Voss");

    // A later call with a new name updates the stored value…
    const renamed = await request(app)
      .get("/api/me")
      .set("x-display-name", encodeURIComponent("Kael Renamed"));
    expect(renamed.body.name).toBe("Kael Renamed");

    // …and a call WITHOUT the header keeps the last known name.
    const noHeader = await request(app).get("/api/me");
    expect(noHeader.body.name).toBe("Kael Renamed");
  });
});

describe("PUT /api/me", () => {
  it("saves nickname and server (trimmed)", async () => {
    authState.sub = "test|editor";
    await request(app).get("/api/me");
    const res = await request(app)
      .put("/api/me")
      .send({ nickname: "  [test:users] Banzai  ", server: " EU-7 " });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ nickname: "[test:users] Banzai", server: "EU-7" });
  });

  it("400s on a blank nickname", async () => {
    authState.sub = "test|blank";
    const res = await request(app).put("/api/me").send({ nickname: "  ", server: null });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("nickname");
  });

  it("409s when the nickname is taken", async () => {
    authState.sub = "test|taken-a";
    await request(app).put("/api/me").send({ nickname: "[test:users] Dup", server: null });
    authState.sub = "test|taken-b";
    const res = await request(app).put("/api/me").send({ nickname: "[test:users] Dup", server: null });
    expect(res.status).toBe(409);
    expect(res.body.error).toContain("taken");
  });
});
