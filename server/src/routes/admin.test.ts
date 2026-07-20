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
