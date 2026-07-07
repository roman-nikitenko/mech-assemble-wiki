// Fetches both seeded mechs with EVERYTHING nested and pretty-prints them.
// Two jobs:
// 1. Prove every relation in the schema resolves (incl. self-referencing trees).
// 2. Preview the exact `include` shape the future GET /api/mechs/:id endpoint
//    will use — when we build the API, this query moves there.
import "dotenv/config"; // load DATABASE_URL when run directly via tsx
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// The full nested include, reused for both mechs.
// Note how the upgrade trees nest children twice — enough depth for the
// seeded trees (root -> child -> grandchild). A production API would either
// fetch the flat list and assemble the tree in code, or cap depth like this.
const fullInclude = {
  skills: {
    include: {
      upgrades: {
        where: { parentId: null }, // start from tree roots...
        include: { children: { include: { children: true } } }, // ...walk down
      },
    },
  },
  traits: { include: { trait: true } },
  awakeningLevels: {
    orderBy: { level: "asc" as const },
    include: { nodes: { orderBy: { position: "asc" as const } }, unlocks: true },
  },
  weapon: {
    include: {
      upgrades: {
        where: { parentId: null },
        include: { children: { include: { children: true } } },
      },
      skins: { include: { stars: true } },
      helpers: { include: { ranks: true } },
    },
  },
  accessory: true,
  skins: { include: { stars: true } },
  helpers: { include: { ranks: true } },
};

async function main() {
  for (const name of ["Shadow Warrior", "Pirate Gunner"]) {
    const mech = await prisma.mech.findUnique({
      where: { name },
      include: fullInclude,
    });
    if (!mech) throw new Error(`${name} not found — did the seed run?`);
    console.log(`\n========== ${mech.name} (${mech.rank}) ==========`);
    console.dir(mech, { depth: null });
  }
  console.log("\nVerify complete: all relations resolved.");
}

main()
  .catch((e) => {
    console.error(e);
    // Note: process.exit() won't wait for the .finally() disconnect below.
    // Fine for a one-shot script; don't copy this pattern into a server.
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
