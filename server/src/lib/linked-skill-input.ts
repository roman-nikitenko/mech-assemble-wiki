import { UUID_RE } from "./uuid";

// Payload parsing for LINKED skills — a flat list attached to a mech or weapon.
// Each row is a minimal skill (name + description) plus the id of the partner
// (a weapon on the mech form, a mech on the weapon form) that gates it.

export interface LinkedSkillInput {
  name: string;
  description: string | null;
  partnerId: string;
}

type Result = { ok: true; value: LinkedSkillInput[] } | { ok: false; message: string };

export function parseLinkedSkills(raw: unknown): Result {
  if (raw === undefined) return { ok: true, value: [] };
  if (!Array.isArray(raw)) return { ok: false, message: "linkedSkills must be an array." };
  const out: LinkedSkillInput[] = [];
  for (const item of raw) {
    if (typeof item !== "object" || item === null) {
      return { ok: false, message: "Every linked skill must be an object." };
    }
    const s = item as Record<string, unknown>;
    if (typeof s.name !== "string" || s.name.trim() === "") {
      return { ok: false, message: "Every linked skill needs a name." };
    }
    if (typeof s.partnerId !== "string" || !UUID_RE.test(s.partnerId)) {
      return { ok: false, message: "Every linked skill needs a valid partnerId." };
    }
    const descRaw = s.description;
    if (descRaw !== undefined && descRaw !== null && typeof descRaw !== "string") {
      return { ok: false, message: "Linked skill description must be a string." };
    }
    const description =
      typeof descRaw === "string" && descRaw.trim() !== "" ? descRaw.trim() : null;
    out.push({ name: s.name.trim(), description, partnerId: s.partnerId });
  }
  return { ok: true, value: out };
}
