import { beforeAll, describe, expect, it } from "vitest";
import crypto from "node:crypto";
import { hashPassword, signAdminToken, verifyAdminToken, verifyPassword } from "./auth";

beforeAll(() => {
  process.env.ADMIN_JWT_SECRET = "test-secret";
});

describe("password hashing (scrypt)", () => {
  it("verifies the right password and rejects the wrong one", () => {
    const stored = hashPassword("hunter2");
    expect(stored).toContain(":"); // salt:hash
    expect(verifyPassword("hunter2", stored)).toBe(true);
    expect(verifyPassword("hunter3", stored)).toBe(false);
  });

  it("rejects malformed stored values instead of throwing", () => {
    expect(verifyPassword("x", "not-a-hash")).toBe(false);
    expect(verifyPassword("x", "")).toBe(false);
  });
});

describe("admin token", () => {
  it("signs a token that verifies", () => {
    expect(verifyAdminToken(signAdminToken())).toBe(true);
  });

  it("rejects garbage and foreign tokens", () => {
    expect(verifyAdminToken("nope")).toBe(false);
  });

  it("rejects any token when ADMIN_JWT_SECRET is not set (no ''-forgery)", () => {
    const saved = process.env.ADMIN_JWT_SECRET;
    delete process.env.ADMIN_JWT_SECRET;
    // jsonwebtoken refuses to sign with "" — forge the way an attacker
    // would: raw HMAC-SHA256 with an empty key.
    const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
    const payload = Buffer.from(JSON.stringify({ role: "admin" })).toString("base64url");
    const sig = crypto.createHmac("sha256", "").update(`${header}.${payload}`).digest("base64url");
    expect(verifyAdminToken(`${header}.${payload}.${sig}`)).toBe(false);
    process.env.ADMIN_JWT_SECRET = saved;
  });
});
