import { MechRank } from "@prisma/client";
import { parseSkillNodes, type SkillNodeInput } from "./skill-node-input";

// Shared validation for POST and PUT /api/mechs. Returns either a clean,
// typed payload or a user-facing error message. Kept out of the router so
// both handlers apply EXACTLY the same rules.

export interface MechSkinInput {
  name: string;
  // Positional star bonuses: index i = ★(i+1). Blank entries mean "that star
  // grants nothing" and simply produce no skin_stars row — positions kept.
  bonuses: string[];
  imageUrl: string | null;
}

export interface MechInput {
  name: string;
  epithet: string | null;
  typeId: string | null;
  rank: MechRank;
  specialBonus: string | null;
  lore: string | null;
  // Positional rank-up lines (index = rank): interior blanks are kept so
  // "rank 4 only" stays at index 3; only trailing blanks are trimmed.
  rankUpPreview: string[];
  imageUrl: string | null;
  iconUrl: string | null;
  cardSkillIconUrl: string | null;
  // Trait NAMES, not ids: the admin types them as free text and the router
  // finds-or-creates the catalog rows, so the client never manages trait ids.
  traitNames: string[];
  // Tri-state pilot link: undefined = leave untouched (PUT) / none (POST),
  // null = explicitly vacate, string = assign that pilot (moving them from
  // any other mech).
  pilotId: string | null | undefined;
  skills: SkillNodeInput[];
  skins: MechSkinInput[];
}

type ParseResult = { ok: true; value: MechInput } | { ok: false; message: string };

// Optional free-text field: absent/null/blank all normalize to null.
// Returns undefined to signal "present but not a string" (an error).
function optionalString(value: unknown): string | null | undefined {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

export function parseMechInput(body: unknown): ParseResult {
  if (typeof body !== "object" || body === null) {
    return { ok: false, message: "Request body must be a JSON object." };
  }
  const b = body as Record<string, unknown>;

  if (typeof b.name !== "string" || b.name.trim() === "") {
    return { ok: false, message: "Mech name is required." };
  }

  // Type is a catalog reference now (nullable — the catalog may be empty).
  if (b.typeId !== undefined && b.typeId !== null && typeof b.typeId !== "string") {
    return { ok: false, message: "typeId must be a type id string or null." };
  }

  const validRanks = Object.values(MechRank);
  if (typeof b.rank !== "string" || !(validRanks as string[]).includes(b.rank)) {
    return {
      ok: false,
      message: `Invalid rank '${String(b.rank)}'. Valid values: ${validRanks.join(", ")}`,
    };
  }

  if (
    b.traitNames !== undefined &&
    (!Array.isArray(b.traitNames) || b.traitNames.some((t) => typeof t !== "string"))
  ) {
    return { ok: false, message: "traitNames must be an array of strings." };
  }
  // Blank rows are dropped (an empty "+ Add trait" row isn't an error), and
  // duplicates collapse — linking the same trait twice would be meaningless.
  const traitNames = [
    ...new Set(((b.traitNames as string[] | undefined) ?? []).map((t) => t.trim()).filter((t) => t !== "")),
  ];

  if (b.pilotId !== undefined && b.pilotId !== null && typeof b.pilotId !== "string") {
    return { ok: false, message: "pilotId must be a pilot id string or null." };
  }

  const optionalFields = ["epithet", "specialBonus", "lore", "imageUrl", "iconUrl", "cardSkillIconUrl"] as const;
  const parsed: Record<string, string | null> = {};
  for (const field of optionalFields) {
    const v = optionalString(b[field]);
    if (v === undefined) return { ok: false, message: `${field} must be a string.` };
    parsed[field] = v;
  }

  if (
    b.rankUpPreview !== undefined &&
    (!Array.isArray(b.rankUpPreview) || b.rankUpPreview.some((s) => typeof s !== "string"))
  ) {
    return { ok: false, message: "rankUpPreview must be an array of up to 7 strings." };
  }
  // Positions matter here (unlike the weapon field, which drops blanks):
  // trim each line but keep interior blanks, then drop trailing blanks.
  const rankUpPreview = ((b.rankUpPreview as string[] | undefined) ?? []).map((s) => s.trim());
  while (rankUpPreview.length > 0 && rankUpPreview[rankUpPreview.length - 1] === "") {
    rankUpPreview.pop();
  }
  if (rankUpPreview.length > 7) {
    return { ok: false, message: "rankUpPreview must be an array of up to 7 strings." };
  }

  // Inline skins: replace-the-set semantics, same contract as weapon skins.
  // Each skin: required name + up to 5 star-bonus strings (★1-5) + image.
  const skins: MechSkinInput[] = [];
  if (b.skins !== undefined) {
    if (!Array.isArray(b.skins)) {
      return { ok: false, message: "skins must be an array." };
    }
    for (const raw of b.skins) {
      if (typeof raw !== "object" || raw === null) {
        return { ok: false, message: "Every skin must be an object." };
      }
      const s = raw as Record<string, unknown>;
      if (typeof s.name !== "string" || s.name.trim() === "") {
        return { ok: false, message: "Every skin needs a name." };
      }
      if (
        s.bonuses !== undefined &&
        (!Array.isArray(s.bonuses) || s.bonuses.some((x) => typeof x !== "string"))
      ) {
        return { ok: false, message: "Skin bonuses must be an array of up to 5 strings." };
      }
      // Positional like rankUpPreview: trim entries, keep interior blanks
      // (★ number = index + 1), drop only trailing blanks.
      const bonuses = ((s.bonuses as string[] | undefined) ?? []).map((x) => x.trim());
      while (bonuses.length > 0 && bonuses[bonuses.length - 1] === "") bonuses.pop();
      if (bonuses.length > 5) {
        return { ok: false, message: "Skin bonuses must be an array of up to 5 strings." };
      }
      const skinImageUrl = optionalString(s.imageUrl);
      if (skinImageUrl === undefined) {
        return { ok: false, message: "Skin imageUrl must be a string." };
      }
      skins.push({ name: s.name.trim(), bonuses, imageUrl: skinImageUrl });
    }
  }

  const skillsResult = parseSkillNodes(b.skills);
  if (!skillsResult.ok) return skillsResult;

  return {
    ok: true,
    value: {
      name: b.name.trim(),
      typeId: (b.typeId as string | null | undefined) ?? null,
      rank: b.rank as MechRank,
      traitNames,
      pilotId: b.pilotId as string | null | undefined,
      epithet: parsed.epithet,
      specialBonus: parsed.specialBonus,
      lore: parsed.lore,
      rankUpPreview,
      imageUrl: parsed.imageUrl,
      iconUrl: parsed.iconUrl,
      cardSkillIconUrl: parsed.cardSkillIconUrl,
      skills: skillsResult.value,
      skins,
    },
  };
}
