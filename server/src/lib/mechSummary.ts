// Server twin of client/src/lib/mechSummary.ts — builds a factual, per-mech
// blurb PURELY from stored fields (no invented lore). Used as the injected
// og:description so a shared mech link previews the same text search engines
// index. Duplicated (not shared) because the client and server build
// separately; keep the two in sync.

/** Only the fields the blurb needs; a Prisma mech (with type/pilot/traits/
    weapon/accessory included) structurally satisfies this. */
export interface MechSummaryInput {
  name: string;
  epithet: string | null;
  rank: string; // "S" | "Standard"
  type: { name: string } | null;
  specialBonus: string | null;
  pilot: { name: string } | null;
  traits: { trait: { name: string } }[];
  weapon: { name: string; description: string | null } | null;
  accessory: { name: string; exclusiveEffect: string | null } | null;
}

/** Joins names into "A", "A and B", or "A, B and C". */
function joinAnd(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

export function mechSummary(mech: MechSummaryInput): string {
  const rankLabel = mech.rank === "S" ? "an S-tier" : "a Standard";
  const typePart = mech.type ? `${mech.type.name} ` : "";
  const sentences: string[] = [];

  sentences.push(
    `${mech.name}${mech.epithet ? `, the ${mech.epithet},` : ""} is ${rankLabel} ${typePart}mech in Mech Assemble.`,
  );
  if (mech.specialBonus) sentences.push(`Its signature bonus is ${mech.specialBonus}.`);
  if (mech.pilot) sentences.push(`It is piloted by ${mech.pilot.name}.`);
  if (mech.traits.length > 0) {
    sentences.push(`Its traits include ${joinAnd(mech.traits.map((t) => t.trait.name))}.`);
  }
  if (mech.weapon) {
    sentences.push(
      `Its unique weapon is the ${mech.weapon.name}${mech.weapon.description ? ` (${mech.weapon.description})` : ""}.`,
    );
  }
  if (mech.accessory) {
    sentences.push(
      `Its accessory is the ${mech.accessory.name}${mech.accessory.exclusiveEffect ? ` (${mech.accessory.exclusiveEffect})` : ""}.`,
    );
  }
  return sentences.join(" ");
}
