// Shared validation for POST/PUT /api/module-qualities.
export interface ModuleQualityInput {
  name: string;
  iconUrl: string | null;
  hp: string;
  atk: string;
  def: string;
  // Effect 1 (elemental DMG %) applies to all elements + all modules — a
  // property of the quality. Null/blank below Turquoise (effectCount 0).
  effect1Value: string | null;
  effectCount: number; // 0..3
  sortOrder: number;
}

type ParseResult = { ok: true; value: ModuleQualityInput } | { ok: false; message: string };

// Stat fields are free text but required (no blanks) — the admin types what
// the game shows ("22.00k", "4400").
function reqString(v: unknown, field: string): { ok: true; value: string } | { ok: false; message: string } {
  if (typeof v !== "string" || v.trim() === "") return { ok: false, message: `${field} is required.` };
  return { ok: true, value: v.trim() };
}

export function parseModuleQualityInput(body: unknown): ParseResult {
  if (typeof body !== "object" || body === null) {
    return { ok: false, message: "Request body must be a JSON object." };
  }
  const b = body as Record<string, unknown>;

  const name = reqString(b.name, "Quality name");
  if (!name.ok) return name;
  const hp = reqString(b.hp, "HP");
  if (!hp.ok) return hp;
  const atk = reqString(b.atk, "ATK");
  if (!atk.ok) return atk;
  const def = reqString(b.def, "DEF");
  if (!def.ok) return def;

  if (typeof b.effectCount !== "number" || !Number.isInteger(b.effectCount) || b.effectCount < 0 || b.effectCount > 3) {
    return { ok: false, message: "effectCount must be an integer 0–3." };
  }
  if (b.iconUrl !== undefined && b.iconUrl !== null && typeof b.iconUrl !== "string") {
    return { ok: false, message: "iconUrl must be a string." };
  }
  if (b.effect1Value !== undefined && b.effect1Value !== null && typeof b.effect1Value !== "string") {
    return { ok: false, message: "effect1Value must be a string." };
  }
  if (b.sortOrder !== undefined && typeof b.sortOrder !== "number") {
    return { ok: false, message: "sortOrder must be a number." };
  }

  return {
    ok: true,
    value: {
      name: name.value,
      iconUrl: (b.iconUrl as string | null | undefined) ?? null,
      hp: hp.value,
      atk: atk.value,
      def: def.value,
      effect1Value: (() => {
        const v = b.effect1Value;
        if (typeof v !== "string") return null;
        const t = v.trim();
        return t === "" ? null : t;
      })(),
      effectCount: b.effectCount,
      sortOrder: (b.sortOrder as number | undefined) ?? 0,
    },
  };
}
