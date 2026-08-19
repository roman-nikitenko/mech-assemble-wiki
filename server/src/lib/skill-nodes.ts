import { Prisma } from "@prisma/client";
import type { SkillNodeInput } from "./skill-node-input";
import type { LinkedSkillInput } from "./linked-skill-input";

// Creates a skill tree parent-first for EITHER owner kind (weapon or mech):
// parentIndex always points at an EARLIER entry, so by the time a child is
// created its parent's real id is already known. sortOrder counts previous
// siblings (same parentIndex).
export async function createSkillNodes(
  tx: Prisma.TransactionClient,
  owner: { weaponId: string } | { mechId: string },
  skills: SkillNodeInput[]
) {
  const createdIds: string[] = [];
  const siblingCounts = new Map<number | null, number>();
  for (const entry of skills) {
    const order = siblingCounts.get(entry.parentIndex) ?? 0;
    siblingCounts.set(entry.parentIndex, order + 1);
    const node = await tx.skillNode.create({
      data: {
        // Reuse the node's existing id when the editor sends one, so re-saving
        // (delete-all + recreate) keeps ids stable and saved builds still match.
        ...(entry.id ? { id: entry.id } : {}),
        ...owner,
        parentId: entry.parentIndex === null ? null : createdIds[entry.parentIndex],
        name: entry.name,
        description: entry.description,
        appearanceLevel: entry.appearanceLevel,
        type: entry.type,
        sortOrder: order,
        repeatable: entry.repeatable,
        initialAtTier: entry.initialAtTier,
      },
    });
    createdIds.push(node.id);
  }
}

// Creates flat LINKED skill nodes for an owner. Each is a standalone Normal
// skill (level 1, no parent) plus a gate: a mech-owned linked skill sets
// linkedWeaponId; a weapon-owned one sets linkedMechId.
export async function createLinkedSkills(
  tx: Prisma.TransactionClient,
  owner: { mechId: string } | { weaponId: string },
  linked: LinkedSkillInput[]
): Promise<void> {
  for (let i = 0; i < linked.length; i++) {
    const { name, description, partnerId } = linked[i];
    const gate =
      "mechId" in owner ? { linkedWeaponId: partnerId } : { linkedMechId: partnerId };
    await tx.skillNode.create({
      data: {
        ...owner,
        ...gate,
        name,
        description,
        type: "Normal",
        appearanceLevel: 1,
        parentId: null,
        repeatable: false,
        sortOrder: i,
      },
    });
  }
}
