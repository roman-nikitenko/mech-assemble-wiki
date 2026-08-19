export type ModuleTargetKind = "Weapon" | "Mech";

export interface ModuleBonusInput {
  slot: number; // 2 or 3
  mechId: string | null;
  weaponId: string | null;
  effectText: string;
  sortOrder: number;
}
export interface ModuleInput {
  name: string;
  iconUrl: string | null;
  // Effect 2 and Effect 3 each target weapons OR mechs independently.
  effect2Target: ModuleTargetKind;
  effect3Target: ModuleTargetKind;
  bonuses: ModuleBonusInput[];
}

type ParseResult = { ok: true; value: ModuleInput } | { ok: false; message: string };

function optionalString(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t === "" ? null : t;
}

// Structural validation only. DB-existence of bonus targets happens in the
// route (it needs to query mechs/weapons).
export function parseModuleInput(body: unknown): ParseResult {
  if (typeof body !== "object" || body === null) {
    return { ok: false, message: "Request body must be a JSON object." };
  }
  const b = body as Record<string, unknown>;
  if (typeof b.name !== "string" || b.name.trim() === "") {
    return { ok: false, message: "Module name is required." };
  }
  if (b.effect2Target !== "Weapon" && b.effect2Target !== "Mech") {
    return { ok: false, message: "effect2Target must be 'Weapon' or 'Mech'." };
  }
  if (b.effect3Target !== "Weapon" && b.effect3Target !== "Mech") {
    return { ok: false, message: "effect3Target must be 'Weapon' or 'Mech'." };
  }
  if (b.bonuses !== undefined && !Array.isArray(b.bonuses)) {
    return { ok: false, message: "bonuses must be an array." };
  }
  const effect2Target = b.effect2Target as ModuleTargetKind;
  const effect3Target = b.effect3Target as ModuleTargetKind;
  const bonuses: ModuleBonusInput[] = [];
  for (const rb of (b.bonuses as unknown[]) ?? []) {
    if (typeof rb !== "object" || rb === null) return { ok: false, message: "Each bonus must be an object." };
    const bn = rb as Record<string, unknown>;
    if (bn.slot !== 2 && bn.slot !== 3) return { ok: false, message: "Bonus slot must be 2 or 3." };
    if (typeof bn.effectText !== "string" || bn.effectText.trim() === "") {
      return { ok: false, message: "Bonus effect text is required." };
    }
    const mechId = optionalString(bn.mechId);
    const weaponId = optionalString(bn.weaponId);
    if ((mechId !== null) === (weaponId !== null)) {
      return { ok: false, message: "Each bonus needs exactly one of mechId/weaponId." };
    }
    const slotTarget = bn.slot === 2 ? effect2Target : effect3Target;
    if (slotTarget === "Weapon" && weaponId === null) return { ok: false, message: `Effect ${bn.slot} bonuses must target weapons.` };
    if (slotTarget === "Mech" && mechId === null) return { ok: false, message: `Effect ${bn.slot} bonuses must target mechs.` };
    bonuses.push({ slot: bn.slot, mechId, weaponId, effectText: bn.effectText.trim(), sortOrder: typeof bn.sortOrder === "number" ? bn.sortOrder : 0 });
  }
  return { ok: true, value: { name: b.name.trim(), iconUrl: optionalString(b.iconUrl), effect2Target, effect3Target, bonuses } };
}
