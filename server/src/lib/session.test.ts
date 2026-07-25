import { beforeAll, describe, expect, it } from "vitest";
import { signSession, verifySession, SESSION_COOKIE, sessionCookieOptions } from "./session";

beforeAll(() => {
  process.env.SESSION_JWT_SECRET = "test-session-secret";
});

describe("session token", () => {
  it("signs a token that verifies back to the same user id", () => {
    const token = signSession("user-123");
    expect(verifySession(token)).toBe("user-123");
  });

  it("rejects garbage and returns null", () => {
    expect(verifySession("not-a-token")).toBeNull();
  });

  it("rejects any token when SESSION_JWT_SECRET is unset", () => {
    const saved = process.env.SESSION_JWT_SECRET;
    delete process.env.SESSION_JWT_SECRET;
    expect(verifySession(signWithEmpty())).toBeNull();
    process.env.SESSION_JWT_SECRET = saved;
  });

  it("cookie is httpOnly and lax", () => {
    const opts = sessionCookieOptions();
    expect(opts.httpOnly).toBe(true);
    expect(opts.sameSite).toBe("lax");
    expect(SESSION_COOKIE).toBe("session");
  });
});

// Forge a token the way an attacker would if the secret were empty.
function signWithEmpty(): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ sub: "user-123" })).toString("base64url");
  const crypto = require("node:crypto");
  const sig = crypto.createHmac("sha256", "").update(`${header}.${payload}`).digest("base64url");
  return `${header}.${payload}.${sig}`;
}
