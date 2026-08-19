export type ModuleTargetKind = "Weapon" | "Mech";

export interface ModuleBonusInput {
  slot: number; // 2 or 3
  mechId: string | null;
  weaponId: string | null;
  effectText: string;
  sortOrder: number;
}
export interface ModuleQualityEffectInput {
  qualityId: string;
  effect1Value: string | null;
  bonuses: ModuleBonusInput[];
}
export interface ModuleInput {
  name: string;
  iconUrl: string | null;
  // Effect 2 and Effect 3 each target weapons OR mechs independently.
  effect2Target: ModuleTargetKind;
  effect3Target: ModuleTargetKind;
  qualityEffects: ModuleQualityEffectInput[];
}

type ParseResult = { ok: true; value: ModuleInput } | { ok: false; message: string };

function optionalString(v: unknown): string | null {
  if (v === undefined || v === null) return null;
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t === "" ? null : t;
}

// Structural validation only. DB-existence + effect_count gating happen in the
// route (they need to fetch qualities/mechs/weapons).
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
  if (b.qualityEffects !== undefined && !Array.isArray(b.qualityEffects)) {
    return { ok: false, message: "qualityEffects must be an array." };
  }

  const effect2Target = b.effect2Target as ModuleTargetKind;
  const effect3Target = b.effect3Target as ModuleTargetKind;
  const rawEffects = (b.qualityEffects as unknown[]) ?? [];
  const qualityEffects: ModuleQualityEffectInput[] = [];

  for (const raw of rawEffects) {
    if (typeof raw !== "object" || raw === null) {
      return { ok: false, message: "Each quality effect must be an object." };
    }
    const e = raw as Record<string, unknown>;
    if (typeof e.qualityId !== "string") {
      return { ok: false, message: "Each quality effect needs a qualityId." };
    }
    const bonusesRaw = Array.isArray(e.bonuses) ? e.bonuses : [];
    const bonuses: ModuleBonusInput[] = [];
    for (const rb of bonusesRaw) {
      if (typeof rb !== "object" || rb === null) {
        return { ok: false, message: "Each bonus must be an object." };
      }
      const bn = rb as Record<string, unknown>;
      if (bn.slot !== 2 && bn.slot !== 3) {
        return { ok: false, message: "Bonus slot must be 2 or 3." };
      }
      if (typeof bn.effectText !== "string" || bn.effectText.trim() === "") {
        return { ok: false, message: "Bonus effect text is required." };
      }
      const mechId = optionalString(bn.mechId);
      const weaponId = optionalString(bn.weaponId);
      // Exactly one target, matching this bonus's EFFECT target (slot 2 →
      // effect2Target, slot 3 → effect3Target).
      const hasMech = mechId !== null;
      const hasWeapon = weaponId !== null;
      if (hasMech === hasWeapon) {
        return { ok: false, message: "Each bonus needs exactly one of mechId/weaponId." };
      }
      const slotTarget = bn.slot === 2 ? effect2Target : effect3Target;
      if (slotTarget === "Weapon" && !hasWeapon) {
        return { ok: false, message: `Effect ${bn.slot} bonuses must target weapons.` };
      }
      if (slotTarget === "Mech" && !hasMech) {
        return { ok: false, message: `Effect ${bn.slot} bonuses must target mechs.` };
      }
      bonuses.push({
        slot: bn.slot,
        mechId,
        weaponId,
        effectText: bn.effectText.trim(),
        sortOrder: typeof bn.sortOrder === "number" ? bn.sortOrder : 0,
      });
    }
    qualityEffects.push({
      qualityId: e.qualityId,
      effect1Value: optionalString(e.effect1Value),
      bonuses,
    });
  }

  return {
    ok: true,
    value: {
      name: b.name.trim(),
      iconUrl: optionalString(b.iconUrl),
      effect2Target,
      effect3Target,
      qualityEffects,
    },
  };
}
