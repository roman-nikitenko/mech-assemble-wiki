/** The visitor's profile settings — nickname shown as the build author and
    the game server they play on. LOCAL like the builds: once real accounts
    arrive this moves to the server and authors become per-build. */
export interface ProfileSettings {
  nickname: string;
  server: string;
}

const KEY = "mech-wiki:profile";

export function loadProfile(): ProfileSettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { nickname: "", server: "" };
    const parsed = JSON.parse(raw) as Partial<ProfileSettings>;
    return { nickname: parsed.nickname ?? "", server: parsed.server ?? "" };
  } catch {
    return { nickname: "", server: "" };
  }
}

export function saveProfile(settings: ProfileSettings): void {
  localStorage.setItem(KEY, JSON.stringify(settings));
}
