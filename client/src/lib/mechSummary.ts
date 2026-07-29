import type { MechDetail } from "../api/types";

/** Joins names into "A", "A and B", or "A, B and C". */
function joinAnd(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

/** Builds a factual intro paragraph for a mech's detail page PURELY from stored
    data — no invented lore. The public page is otherwise just an H1 + image +
    stat tables ("thin content"); this gives search engines real, unique,
    per-mech text to index (name, rank, type, bonus, pilot, traits, and the
    linked weapon/accessory). Every clause is guarded, so a mech that's missing
    a field simply omits that sentence. */
export function mechSummary(mech: MechDetail): string {
  const rankLabel = mech.rank === "S" ? "an S-tier" : "a Standard";
  const typePart = mech.type ? `${mech.type.name} ` : "";
  const sentences: string[] = [];

  // Use the SHORT game name ("Mech Assemble") in this flowing body text — it
  // reads naturally and is what players actually search. The full
  // "Mech Assemble: Zombie Swarm" stays in the page title/meta/JSON-LD.
  sentences.push(
    `${mech.name}${mech.epithet ? `, the ${mech.epithet},` : ""} is ${rankLabel} ${typePart}mech in Mech Assemble.`,
  );

  if (mech.specialBonus) {
    sentences.push(`Its signature bonus is ${mech.specialBonus}.`);
  }
  if (mech.pilot) {
    sentences.push(`It is piloted by ${mech.pilot.name}.`);
  }
  if (mech.traits.length > 0) {
    sentences.push(
      `Its traits include ${joinAnd(mech.traits.map((t) => t.trait.name))}.`,
    );
  }
  // Weapon/accessory free-text is wrapped in parentheses so any capitalization
  // in the authored description reads fine mid-paragraph.
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
