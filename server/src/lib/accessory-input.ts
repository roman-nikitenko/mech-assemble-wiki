import { MechRank } from "@prisma/client";

// Shared validation for POST and PUT /api/accessories.

export interface AccessoryAttribute {
  name: string;
  value: string;
}

export interface AccessoryInput {
  name: string;
  tier: MechRank;
  mechId: string | null;
  attributes: AccessoryAttribute[];
  exclusiveEffect: string | null;
  // Two art slots, like weapons: image = big art, icon = small badge.
  imageUrl: string | null;
  iconUrl: string | null;
}

type ParseResult = { ok: true; value: AccessoryInput } | { ok: false; message: string };

function optionalString(value: unknown): string | null | undefined {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

export function parseAccessoryInput(body: unknown): ParseResult {
  if (typeof body !== "object" || body === null) {
    return { ok: false, message: "Request body must be a JSON object." };
  }
  const b = body as Record<string, unknown>;

  if (typeof b.name !== "string" || b.name.trim() === "") {
    return { ok: false, message: "Accessory name is required." };
  }

  const validTiers = Object.values(MechRank);
  const tier = b.tier === undefined ? "Standard" : b.tier;
  if (typeof tier !== "string" || !(validTiers as string[]).includes(tier)) {
    return {
      ok: false,
      message: `Invalid tier '${String(b.tier)}'. Valid values: ${validTiers.join(", ")}`,
    };
  }

  if (b.mechId !== undefined && b.mechId !== null && typeof b.mechId !== "string") {
    return { ok: false, message: "mechId must be a mech id string or null." };
  }
  const mechId = (b.mechId as string | null | undefined) ?? null;

  // Only the S-tier pair accessories bind to a mech.
  if (mechId !== null && tier !== "S") {
    return { ok: false, message: "Only S-tier accessories can be linked to a mech." };
  }

  // Attribute rows: [{name, value}] strings; blank-NAME rows are dropped
  // (the form always sends its visible slots). Cap depends on tier.
  const attributes: AccessoryAttribute[] = [];
  if (b.attributes !== undefined) {
    if (!Array.isArray(b.attributes)) {
      return { ok: false, message: "attributes must be an array." };
    }
    for (const raw of b.attributes) {
      if (typeof raw !== "object" || raw === null) {
        return { ok: false, message: "Every attribute must be an object." };
      }
      const a = raw as Record<string, unknown>;
      if (typeof a.name !== "string" || typeof a.value !== "string") {
        return { ok: false, message: "Every attribute needs a string name and value." };
      }
      if (a.name.trim() === "") continue;
      attributes.push({ name: a.name.trim(), value: a.value.trim() });
    }
  }
  const cap = tier === "S" ? 2 : 1;
  if (attributes.length > cap) {
    return {
      ok: false,
      message: `A ${tier} accessory has at most ${cap} attribute row(s).`,
    };
  }

  const exclusiveEffectRaw = optionalString(b.exclusiveEffect);
  if (exclusiveEffectRaw === undefined) {
    return { ok: false, message: "exclusiveEffect must be a string." };
  }
  const imageUrl = optionalString(b.imageUrl);
  if (imageUrl === undefined) return { ok: false, message: "imageUrl must be a string." };
  const iconUrl = optionalString(b.iconUrl);
  if (iconUrl === undefined) return { ok: false, message: "iconUrl must be a string." };

  return {
    ok: true,
    value: {
      name: b.name.trim(),
      tier: tier as MechRank,
      mechId,
      attributes,
      // The exclusive effect only exists for mech-paired accessories —
      // normalized here so the rule holds at the DATA level, not just in
      // the form.
      exclusiveEffect: mechId === null ? null : exclusiveEffectRaw,
      imageUrl,
      iconUrl,
    },
  };
}
