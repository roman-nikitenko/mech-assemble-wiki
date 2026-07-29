// Site-wide identity used for SEO tags (titles, canonical URLs, Open Graph).
//
// SITE_URL is the public origin the site is served from — it must be the REAL
// production URL (no trailing slash) or canonical/og:url links point at the
// wrong place. Change it here (and the matching value in index.html + the
// server's SITE_URL env) if the domain ever changes. Overridable at build time
// via VITE_SITE_URL for preview deploys.
export const SITE_URL =
  import.meta.env.VITE_SITE_URL ?? "https://mech-assemble-wiki.online";

export const SITE_NAME = "Mech Assemble Wiki";

// One-line pitch reused as the default meta description / og:description.
export const SITE_DESCRIPTION =
  "The community database for Mech Assemble: Zombie Swarm. Look up any mech's " +
  "skills, unique weapon, accessory, pilots, skins, and awakening progression.";

/** Absolute URL for a client route path (e.g. "/mechs/abc" -> full URL). */
export function siteUrl(path: string): string {
  return `${SITE_URL}${path}`;
}
