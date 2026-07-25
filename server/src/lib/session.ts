import jwt from "jsonwebtoken";
import type { CookieOptions } from "express";

// The name of the httpOnly session cookie the browser sends on every request.
export const SESSION_COOKIE = "session";

// How long a login lasts before the user must sign in again.
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/** Options for the session cookie. httpOnly => JS can't read it (XSS-safe);
    secure only in production (dev is plain http through the Vite proxy);
    sameSite=lax => the cookie is withheld from cross-site POSTs (CSRF defense). */
export function sessionCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE_MS,
    path: "/",
  };
}

/** Sign a session for a user id. Refuses an empty secret so a forged
    empty-key HS256 token can never be accepted (mirrors the admin token). */
export function signSession(userId: string): string {
  const secret = process.env.SESSION_JWT_SECRET;
  if (!secret) throw new Error("SESSION_JWT_SECRET is not set");
  return jwt.sign({ sub: userId }, secret, { expiresIn: "7d" });
}

/** Return the user id from a valid session token, or null. */
export function verifySession(token: string): string | null {
  const secret = process.env.SESSION_JWT_SECRET;
  if (!secret) return null;
  try {
    const payload = jwt.verify(token, secret) as { sub?: string };
    return payload.sub ?? null;
  } catch {
    return null;
  }
}
