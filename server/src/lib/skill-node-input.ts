import { SkillNodeType } from "@prisma/client";

// Shared skill-tree payload parsing — used by BOTH weapon-input (Cycle I)
// and mech-input (Cycle J). One entry of the FLAT list; parentIndex points
// at an EARLIER entry (null = root) — parents-first by construction, which
// also makes cycles impossible.

export interface SkillNodeInput {
  name: string | null;
  description: string | null;
  appearanceLevel: number;
  type: SkillNodeType;
  parentIndex: number | null;
}

type ParseSkillsResult =
  | { ok: true; value: SkillNodeInput[] }
  | { ok: false; message: string };

function optionalString(value: unknown): string | null | undefined {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

export function parseSkillNodes(raw: unknown): ParseSkillsResult {
  const skills: SkillNodeInput[] = [];
  if (raw === undefined) return { ok: true, value: skills };
  if (!Array.isArray(raw)) {
    return { ok: false, message: "skills must be an array." };
  }
  const validTypes = Object.values(SkillNodeType);
  for (let i = 0; i < raw.length; i++) {
    const item = raw[i];
    if (typeof item !== "object" || item === null) {
      return { ok: false, message: "Every skill must be an object." };
    }
    const s = item as Record<string, unknown>;
    if (typeof s.type !== "string" || !(validTypes as string[]).includes(s.type)) {
      return {
        ok: false,
        message: `Invalid skill type '${String(s.type)}'. Valid values: ${validTypes.join(", ")}`,
      };
    }
    const type = s.type as SkillNodeType;
    let name: string | null = null;
    if (type === "Core") {
      name = null; // Core skills have no name — forced, not trusted
    } else {
      if (typeof s.name !== "string" || s.name.trim() === "") {
        return { ok: false, message: "Every Normal/Premium skill needs a name." };
      }
      name = s.name.trim();
    }
    const description = optionalString(s.description);
    if (description === undefined) {
      return { ok: false, message: "Skill description must be a string." };
    }
    if (
      typeof s.appearanceLevel !== "number" ||
      !Number.isInteger(s.appearanceLevel) ||
      s.appearanceLevel < 1 ||
      s.appearanceLevel > 10
    ) {
      return { ok: false, message: "Skill appearanceLevel must be an integer from 1 to 10." };
    }
    if (s.parentIndex !== null && s.parentIndex !== undefined) {
      if (!Number.isInteger(s.parentIndex) || (s.parentIndex as number) < 0 || (s.parentIndex as number) >= i) {
        return { ok: false, message: "skill parentIndex must reference an earlier entry." };
      }
    }
    skills.push({
      name,
      description,
      appearanceLevel: s.appearanceLevel,
      type,
      parentIndex: (s.parentIndex as number | null | undefined) ?? null,
    });
  }
  return { ok: true, value: skills };
}
