// Server-side twin of client/src/lib/site.ts. Kept separate (the two packages
// build independently) but the values MUST match. Used to build the absolute
// URLs that social scrapers require in injected OG tags. SITE_URL mirrors the
// same env var used by routes/sitemap.ts.
export const SITE_URL = (
  process.env.SITE_URL ?? "https://mech-assemble-wiki.online"
).replace(/\/$/, "");

export const SITE_NAME = "Mech Assemble Wiki";

export const SITE_DESCRIPTION =
  "The community database for Mech Assemble: Zombie Swarm. Look up any mech's " +
  "skills, unique weapon, accessory, pilots, skins, and awakening progression.";

/** Absolute URL for a site path or upload path. Root-relative paths get the
    origin prepended; anything already absolute (starts with http) is returned
    as-is so external CDN URLs still work. */
export function absoluteUrl(path: string): string {
  if (path.startsWith("http")) return path;
  return `${SITE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}
