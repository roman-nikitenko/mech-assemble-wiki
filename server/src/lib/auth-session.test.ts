import { beforeAll, describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";
import { requireUser, currentUserId } from "./auth";
import { signSession, SESSION_COOKIE } from "./session";

beforeAll(() => {
  process.env.SESSION_JWT_SECRET = "test-session-secret";
});

function mockRes() {
  const res = { statusCode: 0, body: undefined as unknown } as unknown as Response;
  res.status = vi.fn((c: number) => { (res as any).statusCode = c; return res; }) as any;
  res.json = vi.fn((b: unknown) => { (res as any).body = b; return res; }) as any;
  return res;
}

describe("requireUser (cookie session)", () => {
  it("calls next and sets the user id when the cookie is a valid session", () => {
    const req = { cookies: { [SESSION_COOKIE]: signSession("user-abc") } } as unknown as Request;
    const res = mockRes();
    const next = vi.fn();
    requireUser(req, res, next);
    expect(next).toHaveBeenCalledOnce();
    expect(currentUserId(req)).toBe("user-abc");
  });

  it("401s when the cookie is missing", () => {
    const req = { cookies: {} } as unknown as Request;
    const res = mockRes();
    const next = vi.fn();
    requireUser(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect((res as any).statusCode).toBe(401);
  });

  it("401s when the cookie is a forged/garbage token", () => {
    const req = { cookies: { [SESSION_COOKIE]: "garbage" } } as unknown as Request;
    const res = mockRes();
    const next = vi.fn();
    requireUser(req, res, next);
    expect((res as any).statusCode).toBe(401);
  });
});
