import { Router } from "express";
import * as arctic from "arctic";
import type { CookieOptions } from "express";
import { prisma } from "../lib/prisma";
import { createAuthorizationURL, fetchProfile, isProvider } from "../lib/oauth";
import { SESSION_COOKIE, signSession, sessionCookieOptions } from "../lib/session";

export const authRouter = Router();

// Temp cookies that carry the CSRF state + PKCE verifier from /login to
// /callback. Short-lived; same flags as the session minus the long maxAge.
const TEMP_COOKIE: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 10 * 60 * 1000, // 10 minutes to complete the round-trip
  path: "/",
};
const stateCookie = (p: string) => `oauth_state_${p}`;
const verifierCookie = (p: string) => `oauth_verifier_${p}`;
const appBase = () => process.env.APP_BASE_URL ?? "";

// Step 1: send the user to the provider.
authRouter.get("/:provider/login", (req, res) => {
  const provider = req.params.provider;
  if (!isProvider(provider)) {
    res.status(404).json({ error: "Unknown provider" });
    return;
  }
  const state = arctic.generateState();
  const codeVerifier = arctic.generateCodeVerifier();
  const url = createAuthorizationURL(provider, state, codeVerifier);
  res.cookie(stateCookie(provider), state, TEMP_COOKIE);
  res.cookie(verifierCookie(provider), codeVerifier, TEMP_COOKIE);
  res.redirect(url.toString());
});

// Step 2: provider redirects back here with ?code&state.
authRouter.get("/:provider/callback", async (req, res) => {
  const provider = req.params.provider;
  if (!isProvider(provider)) {
    res.status(404).json({ error: "Unknown provider" });
    return;
  }
  const cookies = req.cookies as Record<string, string> | undefined;
  const code = typeof req.query.code === "string" ? req.query.code : null;
  const state = typeof req.query.state === "string" ? req.query.state : null;
  const storedState = cookies?.[stateCookie(provider)] ?? null;
  const codeVerifier = cookies?.[verifierCookie(provider)] ?? null;

  // Always clear the temp cookies, success or not.
  res.clearCookie(stateCookie(provider), { path: "/" });
  res.clearCookie(verifierCookie(provider), { path: "/" });

  // Verify the state matches (blocks login CSRF) before trusting the code.
  if (!code || !state || !storedState || state !== storedState || !codeVerifier) {
    res.redirect(`${appBase()}/login?error=state`);
    return;
  }

  try {
    const profile = await fetchProfile(provider, code, codeVerifier);
    const user = await prisma.user.upsert({
      where: { provider_providerAccountId: { provider, providerAccountId: profile.accountId } },
      create: { provider, providerAccountId: profile.accountId, name: profile.name },
      update: profile.name ? { name: profile.name } : {},
    });
    res.cookie(SESSION_COOKIE, signSession(user.id), sessionCookieOptions());
    res.redirect(`${appBase()}/profile`);
  } catch {
    res.redirect(`${appBase()}/login?error=oauth`);
  }
});

// Log out: drop the session cookie. (Stateless JWT — nothing to revoke.)
authRouter.post("/logout", (_req, res) => {
  res.clearCookie(SESSION_COOKIE, { path: "/" });
  res.json({ ok: true });
});
