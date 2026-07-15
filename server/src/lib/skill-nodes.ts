import { Prisma } from "@prisma/client";
import type { SkillNodeInput } from "./skill-node-input";

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
        ...owner,
        parentId: entry.parentIndex === null ? null : createdIds[entry.parentIndex],
        name: entry.name,
        description: entry.description,
        appearanceLevel: entry.appearanceLevel,
        type: entry.type,
        sortOrder: order,
      },
    });
    createdIds.push(node.id);
  }
}
