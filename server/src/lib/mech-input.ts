import { MechRank } from "@prisma/client";
import { parseSkillNodes, type SkillNodeInput } from "./skill-node-input";

// Shared validation for POST and PUT /api/mechs. Returns either a clean,
// typed payload or a user-facing error message. Kept out of the router so
// both handlers apply EXACTLY the same rules.

export interface MechInput {
  name: string;
  epithet: string | null;
  typeId: string | null;
  rank: MechRank;
  quality: string | null;
  specialBonus: string | null;
  pilotName: string | null;
  lore: string | null;
  imageUrl: string | null;
  traitIds: string[];
  // Tri-state pilot link: undefined = leave untouched (PUT) / none (POST),
  // null = explicitly vacate, string = assign that pilot (moving them from
  // any other mech).
  pilotId: string | null | undefined;
  skills: SkillNodeInput[];
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
    b.traitIds !== undefined &&
    (!Array.isArray(b.traitIds) || b.traitIds.some((t) => typeof t !== "string"))
  ) {
    return { ok: false, message: "traitIds must be an array of trait id strings." };
  }

  if (b.pilotId !== undefined && b.pilotId !== null && typeof b.pilotId !== "string") {
    return { ok: false, message: "pilotId must be a pilot id string or null." };
  }

  const optionalFields = ["epithet", "quality", "specialBonus", "pilotName", "lore", "imageUrl"] as const;
  const parsed: Record<string, string | null> = {};
  for (const field of optionalFields) {
    const v = optionalString(b[field]);
    if (v === undefined) return { ok: false, message: `${field} must be a string.` };
    parsed[field] = v;
  }

  const skillsResult = parseSkillNodes(b.skills);
  if (!skillsResult.ok) return skillsResult;

  return {
    ok: true,
    value: {
      name: b.name.trim(),
      typeId: (b.typeId as string | null | undefined) ?? null,
      rank: b.rank as MechRank,
      traitIds: (b.traitIds as string[] | undefined) ?? [],
      pilotId: b.pilotId as string | null | undefined,
      epithet: parsed.epithet,
      quality: parsed.quality,
      specialBonus: parsed.specialBonus,
      pilotName: parsed.pilotName,
      lore: parsed.lore,
      imageUrl: parsed.imageUrl,
      skills: skillsResult.value,
    },
  };
}
