import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import type { Request, RequestHandler } from "express";
import { SESSION_COOKIE, verifySession } from "./session";

// ---------- Players (our own cookie session) ----------
/** Guards routes that need a logged-in player. Reads the session cookie,
    verifies it, and stashes the user id on the request for currentUserId(). */
export const requireUser: RequestHandler = (req, res, next) => {
  const token = (req.cookies as Record<string, string> | undefined)?.[SESSION_COOKIE];
  const userId = token ? verifySession(token) : null;
  if (!userId) {
    res.status(401).json({ error: "Login required" });
    return;
  }
  (req as Request & { userId?: string }).userId = userId;
  next();
};

/** The verified user id from a requireUser-guarded request. */
export function currentUserId(req: Request): string {
  return (req as Request & { userId?: string }).userId ?? "";
}

// ---------- Admin (separate, NOT Auth0 — user's explicit choice) ----------
const SCRYPT_KEYLEN = 64;

/** "salt:hex" — store the result in ADMIN_PASSWORD_HASH (.env). */
export function hashPassword(
  password: string,
  salt = crypto.randomBytes(16).toString("hex")
): string {
  return `${salt}:${crypto.scryptSync(password, salt, SCRYPT_KEYLEN).toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hex] = stored.split(":");
  if (!salt || !hex) return false;
  const expected = Buffer.from(hex, "hex");
  if (expected.length !== SCRYPT_KEYLEN) return false;
  const candidate = crypto.scryptSync(password, salt, SCRYPT_KEYLEN);
  // timingSafeEqual: constant-time compare, no early-exit timing leaks.
  return crypto.timingSafeEqual(candidate, expected);
}

export function signAdminToken(): string {
  const secret = process.env.ADMIN_JWT_SECRET;
  // Fail loudly at login time instead of silently signing with "" —
  // an empty-secret HS256 token would be trivially forgeable.
  if (!secret) throw new Error("ADMIN_JWT_SECRET is not set");
  return jwt.sign({ role: "admin" }, secret, { expiresIn: "12h" });
}

export function verifyAdminToken(token: string): boolean {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret) return false; // never accept anything without a real secret
  try {
    jwt.verify(token, secret);
    return true;
  } catch {
    return false;
  }
}

/** Guards every admin WRITE endpoint. Reads x-admin-token (separate header
    so it never collides with the players' Authorization Bearer). */
// Typed as RequestHandler<any> so it composes with parameterised routes
// (e.g. "/:id") without breaking TypeScript's template-literal params inference.
// The middleware never reads req.params, so the looser typing has no runtime
// impact.
export const requireAdmin: RequestHandler<any, any, any, any> = (req, res, next) => {
  const token = req.header("x-admin-token");
  if (!token || !verifyAdminToken(token)) {
    res.status(401).json({ error: "Admin login required" });
    return;
  }
  next();
};
