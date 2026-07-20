// Lets plain (non-React) fetch helpers get the current Auth0 access token.
// AuthTokenBridge wires the getter in from inside the provider tree.
let getter: (() => Promise<string>) | null = null;

export function setAccessTokenGetter(fn: (() => Promise<string>) | null) {
  getter = fn;
}

export async function getAccessToken(): Promise<string | null> {
  if (!getter) return null;
  try {
    return await getter();
  } catch {
    return null; // not logged in / consent needed — callers treat as guest
  }
}
