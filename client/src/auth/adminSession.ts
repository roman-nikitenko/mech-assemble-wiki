// The admin token lives in sessionStorage: gone when the tab closes,
// never in git, separate world from the players' Auth0 session.
const KEY = "mech-wiki:admin-token";

export function getAdminToken(): string | null {
  return sessionStorage.getItem(KEY);
}
export function setAdminToken(token: string): void {
  sessionStorage.setItem(KEY, token);
}
export function clearAdminToken(): void {
  sessionStorage.removeItem(KEY);
}
/** Header object to spread into admin write requests. */
export function adminHeaders(): Record<string, string> {
  const token = getAdminToken();
  return token ? { "x-admin-token": token } : {};
}
