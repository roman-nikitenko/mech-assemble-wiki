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

/** `Mech Assemble Wiki — "Name"` — shared title format for every detail page. */
function pageTitle(name: string): string {
  return `${SITE_NAME} — "${name}"`;
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
    title: pageTitle(mech.name),
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
    title: pageTitle(weapon.name),
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
    title: pageTitle(build.name),
    description: build.description.trim() ? build.description : SITE_DESCRIPTION,
    url: absoluteUrl(`/builds/${build.id}`),
    image,
    largeImage: image !== null,
  };
}
