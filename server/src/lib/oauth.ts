import * as arctic from "arctic";

export type ProviderName = "google" | "discord";
export const PROVIDERS: readonly ProviderName[] = ["google", "discord"];

export function isProvider(p: string): p is ProviderName {
  return (PROVIDERS as readonly string[]).includes(p);
}

/** The identity we pull out of a provider after a successful login. */
export interface ProviderProfile {
  accountId: string;
  name: string | null;
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

// Where providers redirect back to. Prod: https://mech-assemble-wiki.online
// Dev: http://localhost:5173 (through the Vite proxy).
const callback = (provider: ProviderName) =>
  `${required("APP_BASE_URL")}/api/auth/${provider}/callback`;

// Built lazily so importing this module never throws when env is absent
// (route tests mock this module and never construct a real client).
let google: arctic.Google | null = null;
let discord: arctic.Discord | null = null;

function googleClient(): arctic.Google {
  if (!google) {
    google = new arctic.Google(
      required("GOOGLE_CLIENT_ID"),
      required("GOOGLE_CLIENT_SECRET"),
      callback("google")
    );
  }
  return google;
}

function discordClient(): arctic.Discord {
  if (!discord) {
    discord = new arctic.Discord(
      required("DISCORD_CLIENT_ID"),
      required("DISCORD_CLIENT_SECRET"),
      callback("discord")
    );
  }
  return discord;
}

const SCOPES: Record<ProviderName, string[]> = {
  google: ["openid", "profile"],
  discord: ["identify"],
};

/** Build the provider's authorize URL (PKCE for both providers). */
export function createAuthorizationURL(
  provider: ProviderName,
  state: string,
  codeVerifier: string
): URL {
  return provider === "google"
    ? googleClient().createAuthorizationURL(state, codeVerifier, SCOPES.google)
    : discordClient().createAuthorizationURL(state, codeVerifier, SCOPES.discord);
}

/** Exchange the code for tokens and return the user's provider identity. */
export async function fetchProfile(
  provider: ProviderName,
  code: string,
  codeVerifier: string
): Promise<ProviderProfile> {
  if (provider === "google") {
    const tokens = await googleClient().validateAuthorizationCode(code, codeVerifier);
    const claims = arctic.decodeIdToken(tokens.idToken()) as { sub: string; name?: string };
    return { accountId: claims.sub, name: claims.name ?? null };
  }
  const tokens = await discordClient().validateAuthorizationCode(code, codeVerifier);
  const res = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${tokens.accessToken()}` },
  });
  if (!res.ok) throw new Error(`Discord userinfo failed: ${res.status}`);
  const user = (await res.json()) as { id: string; global_name?: string | null; username?: string };
  return { accountId: user.id, name: user.global_name ?? user.username ?? null };
}
