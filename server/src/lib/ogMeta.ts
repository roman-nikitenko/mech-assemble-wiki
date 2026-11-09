import { absoluteUrl, SITE_DESCRIPTION, SITE_NAME } from "./site";
import { mechSummary, type MechSummaryInput } from "./mechSummary";

/** The tag values injected into a page's <head>. `image` is an absolute URL or
    null; `largeImage` picks summary_large_image vs the default summary card. */
export interface PageMeta {
  title: string;
  description: string;
  url: string;
  image: string | null;
  largeImage: boolean;
}

/** `Name — <what the page offers> | Mech Assemble Wiki`. The item name comes
    FIRST so it is the part visible in search results and browser tabs. The
    client <Seo> titles (client/src/pages/*DetailPage.tsx) must produce the
    exact same strings, or the title would flip when the JS loads. */
function pageTitle(name: string, offers: string): string {
  return `${name} — ${offers} | ${SITE_NAME}`;
}

function imageMeta(imageUrl: string | null): Pick<PageMeta, "image" | "largeImage"> {
  const image = imageUrl ? absoluteUrl(imageUrl) : null;
  return { image, largeImage: image !== null };
}

export interface MechMetaInput extends MechSummaryInput {
  id: string;
  slug: string | null;
  imageUrl: string | null;
}

export function mechMeta(mech: MechMetaInput): PageMeta {
  return {
    title: pageTitle(mech.name, "Skills, Build & Awakening"),
    description: mechSummary(mech),
    url: absoluteUrl(`/mechs/${mech.slug ?? mech.id}`),
    ...imageMeta(mech.imageUrl),
  };
}

export interface WeaponMetaInput {
  id: string;
  slug: string | null;
  name: string;
  tier: string;
  description: string | null;
  imageUrl: string | null;
}

export function weaponMeta(weapon: WeaponMetaInput): PageMeta {
  // Weapons have no generated blurb; use the authored description or the same
  // short fallback the client WeaponDetailPage <Seo> uses when it's blank.
  const fallback =
    `${weapon.name} — ${weapon.tier === "S" ? "S-tier" : "Standard"} weapon in ` +
    "Mech Assemble: Zombie Swarm. Stats, skill tree, skins, and its linked mech.";
  return {
    title: pageTitle(weapon.name, "Stats, Skill Tree & Skins"),
    description: weapon.description ?? fallback,
    url: absoluteUrl(`/weapons/${weapon.slug ?? weapon.id}`),
    ...imageMeta(weapon.imageUrl),
  };
}

export interface BuildMetaInput {
  id: string;
  name: string;
  description: string; // Build.description defaults to "" in the schema
}

/** `image` is the already-resolved ABSOLUTE url of the build's mech-or-weapon
    art (or null), computed by the caller — see routes/pageMeta.ts. */
export function buildMeta(build: BuildMetaInput, image: string | null): PageMeta {
  return {
    title: pageTitle(build.name, "Community Build"),
    description: build.description.trim() ? build.description : SITE_DESCRIPTION,
    url: absoluteUrl(`/builds/${build.id}`),
    image,
    largeImage: image !== null,
  };
}

/** Title + description for the plain (non-database) pages: the home page, the
    list pages and the info pages. The client <Seo> on each page uses these
    same strings (keep them in sync) — the server injects them so a crawler
    that does not run JavaScript still sees a real title and description
    instead of the generic ones in index.html. */
export const STATIC_PAGE_META: Record<string, { title: string; description: string }> = {
  "/": { title: "Mech Assemble Wiki — Mech Assemble: Zombie Swarm database", description: SITE_DESCRIPTION },
  "/builds": {
    title: "Community Builds — Mech Assemble Wiki",
    description: "Community-made mech builds for Mech Assemble: Zombie Swarm — skills, weapons, and setups shared by other players.",
  },
  "/weapons": {
    title: "Weapons — Mech Assemble Wiki",
    description: "Browse every weapon in Mech Assemble: Zombie Swarm — tiers, stats, skill trees, skins, and the mechs they belong to.",
  },
  "/accessories": {
    title: "Accessories — Mech Assemble Wiki",
    description: "Every accessory in Mech Assemble: Zombie Swarm — attributes and the exclusive effects unlocked when bound to a mech.",
  },
  "/pilots": {
    title: "Pilots — Mech Assemble Wiki",
    description: "All pilots in Mech Assemble: Zombie Swarm — their boosts, relationship bonuses, and the mech or weapon they serve.",
  },
  "/drones": {
    title: "Drones — Mech Assemble Wiki",
    description: "All drones in Mech Assemble: Zombie Swarm — their type, tier, stats, and level-up bonuses.",
  },
  "/aircraft": {
    title: "Aircraft — Mech Assemble Wiki",
    description: "Every aircraft in Mech Assemble: Zombie Swarm — their tier, stats, and rank-up bonuses.",
  },
  "/modules": {
    title: "Attack Module — Mech Assemble Wiki",
    description: "Every attack module in Mech Assemble: Zombie Swarm — stats and effects at each quality level.",
  },
  "/final-raid": {
    title: "Final Raid arsenal — Mech Assemble Wiki",
    description: "Final Raid gear in Mech Assemble: Zombie Swarm — the default arsenal and every set with its 2-piece and 4-piece bonuses.",
  },
  "/chips": {
    title: "Chips — Mech Assemble Wiki",
    description: "Every chip in Mech Assemble: Zombie Swarm — base stats, compose costs and random effects for all 6 body parts and 9 qualities.",
  },
  "/support": {
    title: "Support Mech Assemble Wiki",
    description: "Help keep Mech Assemble Wiki online and up to date after every game patch.",
  },
  "/feedback": {
    title: "Feedback — Mech Assemble Wiki",
    description: "Send the Mech Assemble Wiki team a message — bug reports, corrections, and suggestions welcome.",
  },
};

/** PageMeta for one of the static pages, or undefined for an unknown path. */
export function staticPageMeta(path: string): PageMeta | undefined {
  const entry = STATIC_PAGE_META[path];
  if (!entry) return undefined;
  return { ...entry, url: absoluteUrl(path), image: null, largeImage: false };
}
