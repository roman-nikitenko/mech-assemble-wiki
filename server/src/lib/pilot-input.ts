// Shared validation for POST and PUT /api/pilots — same pattern as
// mech-input.ts: either a clean typed payload or a user-facing message.

export interface PilotInput {
  name: string;
  unlockBoost: string | null;
  relationshipBonus: string | null;
  bonusPerLevel: string[];
  iconUrl: string | null;
  backgroundUrl: string | null;
  mechId: string | null;
}

type ParseResult = { ok: true; value: PilotInput } | { ok: false; message: string };

function optionalString(value: unknown): string | null | undefined {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

export function parsePilotInput(body: unknown): ParseResult {
  if (typeof body !== "object" || body === null) {
    return { ok: false, message: "Request body must be a JSON object." };
  }
  const b = body as Record<string, unknown>;

  if (typeof b.name !== "string" || b.name.trim() === "") {
    return { ok: false, message: "Pilot name is required." };
  }

  // Up to 4 per-level bonuses; blanks are dropped (the form always sends 4
  // slots, some possibly empty).
  let bonusPerLevel: string[] = [];
  if (b.bonusPerLevel !== undefined) {
    if (
      !Array.isArray(b.bonusPerLevel) ||
      b.bonusPerLevel.some((s) => typeof s !== "string")
    ) {
      return { ok: false, message: "bonusPerLevel must be an array of up to 4 strings." };
    }
    bonusPerLevel = (b.bonusPerLevel as string[])
      .map((s) => s.trim())
      .filter((s) => s !== "");
    if (bonusPerLevel.length > 4) {
      return { ok: false, message: "bonusPerLevel must be an array of up to 4 strings." };
    }
  }

  if (b.mechId !== undefined && b.mechId !== null && typeof b.mechId !== "string") {
    return { ok: false, message: "mechId must be a mech id string or null." };
  }

  const optionalFields = ["unlockBoost", "relationshipBonus", "iconUrl", "backgroundUrl"] as const;
  const parsed: Record<string, string | null> = {};
  for (const field of optionalFields) {
    const v = optionalString(b[field]);
    if (v === undefined) return { ok: false, message: `${field} must be a string.` };
    parsed[field] = v;
  }

  return {
    ok: true,
    value: {
      name: b.name.trim(),
      bonusPerLevel,
      mechId: (b.mechId as string | null | undefined) ?? null,
      unlockBoost: parsed.unlockBoost,
      relationshipBonus: parsed.relationshipBonus,
      iconUrl: parsed.iconUrl,
      backgroundUrl: parsed.backgroundUrl,
    },
  };
}
