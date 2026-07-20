import { MechRank } from "@prisma/client";
import { parseSkillNodes, type SkillNodeInput } from "./skill-node-input";

// Shared validation for POST and PUT /api/weapons — the same pattern as
// mech-input.ts / pilot-input.ts.

export interface WeaponSkinInput {
  name: string;
  bonuses: string[];
  imageUrl: string | null;
}

export interface WeaponInput {
  name: string;
  description: string | null;
  // Weapons share the mech rank enum (Standard | S) as their tier.
  tier: MechRank;
  rankUpPreview: string[];
  typeId: string | null;
  mechId: string | null;
  // Tri-state like the mech form's pilotId: undefined = leave untouched
  // (PUT) / none (POST), null = vacate, string = seat that pilot.
  pilotId: string | null | undefined;
  // Two art slots: image = big weapon art, icon = small square badge.
  imageUrl: string | null;
  iconUrl: string | null;
  skins: WeaponSkinInput[];
  skills: SkillNodeInput[];
}

type ParseResult = { ok: true; value: WeaponInput } | { ok: false; message: string };

function optionalString(value: unknown): string | null | undefined {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

// Drops blank entries; returns undefined when the input isn't a string array.
function stringList(value: unknown): string[] | undefined {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.some((s) => typeof s !== "string")) return undefined;
  return (value as string[]).map((s) => s.trim()).filter((s) => s !== "");
}

export function parseWeaponInput(body: unknown): ParseResult {
  if (typeof body !== "object" || body === null) {
    return { ok: false, message: "Request body must be a JSON object." };
  }
  const b = body as Record<string, unknown>;

  if (typeof b.name !== "string" || b.name.trim() === "") {
    return { ok: false, message: "Weapon name is required." };
  }

  const validTiers = Object.values(MechRank);
  const tier = b.tier === undefined ? "Standard" : b.tier;
  if (typeof tier !== "string" || !(validTiers as string[]).includes(tier)) {
    return {
      ok: false,
      message: `Invalid tier '${String(b.tier)}'. Valid values: ${validTiers.join(", ")}`,
    };
  }

  const rankUpPreview = stringList(b.rankUpPreview);
  if (rankUpPreview === undefined) {
    return { ok: false, message: "rankUpPreview must be an array of up to 7 strings." };
  }
  if (rankUpPreview.length > 7) {
    return { ok: false, message: "rankUpPreview must be an array of up to 7 strings." };
  }

  // Inline skins: replace-the-set semantics — the form always sends the
  // full list. Each skin: required name + up to 5 star-bonus strings (★1-5).
  const skins: WeaponSkinInput[] = [];
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
      const bonuses = stringList(s.bonuses);
      if (bonuses === undefined || bonuses.length > 5) {
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
  const skills = skillsResult.value;

  for (const field of ["typeId", "mechId"] as const) {
    if (b[field] !== undefined && b[field] !== null && typeof b[field] !== "string") {
      return { ok: false, message: `${field} must be an id string or null.` };
    }
  }
  if (b.pilotId !== undefined && b.pilotId !== null && typeof b.pilotId !== "string") {
    return { ok: false, message: "pilotId must be a pilot id string or null." };
  }

  const description = optionalString(b.description);
  if (description === undefined) return { ok: false, message: "description must be a string." };
  const imageUrl = optionalString(b.imageUrl);
  if (imageUrl === undefined) return { ok: false, message: "imageUrl must be a string." };
  const iconUrl = optionalString(b.iconUrl);
  if (iconUrl === undefined) return { ok: false, message: "iconUrl must be a string." };

  return {
    ok: true,
    value: {
      name: b.name.trim(),
      description,
      tier: tier as MechRank,
      rankUpPreview,
      typeId: (b.typeId as string | null | undefined) ?? null,
      mechId: (b.mechId as string | null | undefined) ?? null,
      pilotId: b.pilotId as string | null | undefined,
      imageUrl,
      iconUrl,
      skins,
      skills,
    },
  };
}
