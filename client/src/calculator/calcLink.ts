import type { QualityTier } from "../api/types";

/** One letter per quality tier — this keeps the share link short.
    PUBLIC LINK FORMAT: never change a letter once shipped, or every link
    anyone has already shared decodes to the wrong tier. */
export const TIER_CODE: Record<QualityTier, string> = {
  Blue: "B", Purple: "P", Orange: "O", Red: "R", Turquoise: "T", Gold: "G", Mythic: "M",
};

const CODE_TIER = Object.fromEntries(
  Object.entries(TIER_CODE).map(([tier, code]) => [code, tier as QualityTier])
) as Record<string, QualityTier | undefined>;

/** How many leading hex characters of a skill's UUID identify it in a link.
    A key only has to be unique inside ONE owner's pool (the largest is ~22
    nodes), so 6 chars — 16.7M values — has a huge margin. Measured against
    the live data: 1321 skill nodes, 1321 distinct 6-char prefixes.
    PUBLIC LINK FORMAT: never change this. */
export const SKILL_KEY_LENGTH = 6;

export function skillKey(id: string): string {
  return id.slice(0, SKILL_KEY_LENGTH);
}

export interface CalcOwner {
  slug: string;
  tier: QualityTier;
  /** Skill keys in PICK ORDER. Order is significant: the level gate counts
      how many picks came before, so [A,B] is not the same build as [B,A]. */
  picks: string[];
}

export interface CalcLink {
  mech: CalcOwner | null;
  weapons: CalcOwner[];
}

export const EMPTY_CALC_LINK: CalcLink = { mech: null, weapons: [] };

function encodeOwner(o: CalcOwner): string {
  const head = `${o.slug}.${TIER_CODE[o.tier]}`;
  return o.picks.length > 0 ? `${head}:${o.picks.join(",")}` : head;
}

/** State → query string (no leading "?").

    Built BY HAND on purpose. URLSearchParams.toString() escapes ":" to "%3A"
    and "," to "%2C", which adds ~90 characters to a full build. Both are legal
    unescaped in a query per RFC 3986, and URLSearchParams still PARSES them
    correctly — so we write manually and read with URLSearchParams. */
export function encodeCalcLink(link: CalcLink): string {
  const parts: string[] = [];
  if (link.mech) parts.push(`m=${encodeOwner(link.mech)}`);
  for (const w of link.weapons) parts.push(`w=${encodeOwner(w)}`);
  return parts.join("&");
}

function decodeOwner(raw: string): CalcOwner | null {
  const [head, picks = ""] = raw.split(":");
  // lastIndexOf, not indexOf: the tier letter is the LAST dot-separated part,
  // so a slug that ever contained a dot still parses.
  const dot = head.lastIndexOf(".");
  if (dot <= 0) return null;
  const tier = CODE_TIER[head.slice(dot + 1)];
  if (!tier) return null;
  return {
    slug: head.slice(0, dot),
    tier,
    // Keys come from a URL, so treat them as untrusted: hex only.
    picks: picks.split(",").filter((k) => /^[0-9a-f]+$/.test(k)),
  };
}

/** Query string → state. Anything malformed is dropped rather than thrown:
    a half-broken link should still open the calculator, just with less in it. */
export function decodeCalcLink(search: string): CalcLink {
  const params = new URLSearchParams(search);
  const mechRaw = params.get("m");
  return {
    mech: mechRaw ? decodeOwner(mechRaw) : null,
    weapons: params
      .getAll("w")
      .map(decodeOwner)
      .filter((o): o is CalcOwner => o !== null),
  };
}
