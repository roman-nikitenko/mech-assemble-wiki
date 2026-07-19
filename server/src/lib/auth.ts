import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { auth } from "express-oauth2-jwt-bearer";
import type { Request, RequestHandler } from "express";

// ---------- Auth0 (players) ----------
// Verifies the SPA's Bearer JWT against Auth0's public keys (cached JWKS).
// Built lazily so importing this module never crashes when env is absent
// (tests mock this module entirely and never reach the real check).
let jwtCheck: RequestHandler | null = null;
export const requireUser: RequestHandler = (req, res, next) => {
  if (!jwtCheck) {
    jwtCheck = auth({
      issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}`,
      audience: process.env.AUTH0_AUDIENCE,
    });
  }
  jwtCheck(req, res, next);
};

/** The validated Auth0 subject ("google-oauth2|…") from a checked request. */
export function authSub(req: Request): string {
  const withAuth = req as Request & { auth?: { payload?: { sub?: string } } };
  return withAuth.auth?.payload?.sub ?? "";
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
export const requireAdmin: RequestHandler = (req, res, next) => {
  const token = req.header("x-admin-token");
  if (!token || !verifyAdminToken(token)) {
    res.status(401).json({ error: "Admin login required" });
    return;
  }
  next();
};
