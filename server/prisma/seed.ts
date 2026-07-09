// Seed: 2 mechs that exercise every table and relationship pattern.
// - Shadow Warrior (S-tier)  — full kit: skills + branching upgrade tree,
//   traits, weapon + its tree, accessory, skins (one mech-owned, one
//   weapon-owned), helpers (same split), awakening levels with 5 nodes each.
// - Pirate Gunner (Standard) — identity + skills + trait only, so the
//   frontend's conditional rendering (rank === "S") can be tested later.
//
// Data is INVENTED but plausible — replace with real game data later.
//
// The seed is idempotent: it wipes all rows first, then inserts. Deleting
// mechs and traits is enough because every other table cascades from them
// (onDelete: Cascade in the schema).
import "dotenv/config"; // load DATABASE_URL when run directly via tsx
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // ---- wipe (children cascade from these two roots) ----
  // Types LAST: Restrict means mechs must be deleted before types.
  await prisma.mech.deleteMany();
  await prisma.trait.deleteMany();
  await prisma.type.deleteMany();

  // ---- traits (shared catalog, linked to mechs via mech_traits) ----
  const thunder = await prisma.trait.create({
    data: { name: "Thunder", color: "#5aa9ff" },
  });
  const spreadshots = await prisma.trait.create({
    data: { name: "Spreadshots", color: "#ffb84d" },
  });
  const physical = await prisma.trait.create({
    data: { name: "Physical", color: "#c0c0c0" },
  });

  // ---- types (element catalog; icons get uploaded via the admin later) ----
  const thunderType = await prisma.type.create({ data: { name: "Thunder" } });
  const physicalType = await prisma.type.create({ data: { name: "Physical" } });

  // ================= Shadow Warrior (S-tier, full kit) =================
  const shadowWarrior = await prisma.mech.create({
    data: {
      name: "Shadow Warrior",
      epithet: "Shadow Hunter",
      typeId: thunderType.id,
      rank: "S",
      quality: "Supreme",
      specialBonus: "ATK +10%",
      pilotName: "Kael",
      lore: "Forged in the silent forges of the Umbra Collective, the Shadow Warrior strikes before the thunder is heard.",
      traits: {
        create: [{ traitId: thunder.id }, { traitId: spreadshots.id }],
      },
    },
  });

  // ---- skill 1 with a BRANCHING upgrade tree ----
  // Tree shape:            Thunder Slash I (root)
  //                        /              \
  //              Chain Lightning        Wide Arc
  //                     |
  //             Storm Evolution (is_evolution)
  const thunderSlash = await prisma.mechSkill.create({
    data: {
      mechId: shadowWarrior.id,
      name: "Thunder Slash",
      description: "A lightning-charged blade sweep that arcs between enemies.",
      baseStats: { damage: 240, cooldown: 4.5, range: 6 },
    },
  });
  // Self-referencing rows must be created parent-first so children can
  // point at an existing parent id.
  const tsRoot = await prisma.skillUpgrade.create({
    data: {
      skillId: thunderSlash.id,
      name: "Thunder Slash I",
      description: "Damage +15%.",
    },
  });
  const chainLightning = await prisma.skillUpgrade.create({
    data: {
      skillId: thunderSlash.id,
      parentId: tsRoot.id,
      name: "Chain Lightning",
      description: "Arcs jump to 2 additional enemies.",
      unlockReq: "2/8",
    },
  });
  await prisma.skillUpgrade.create({
    data: {
      skillId: thunderSlash.id,
      parentId: tsRoot.id,
      name: "Wide Arc",
      description: "Sweep angle +40°.",
      unlockReq: "2/8",
    },
  });
  await prisma.skillUpgrade.create({
    data: {
      skillId: thunderSlash.id,
      parentId: chainLightning.id,
      name: "Storm Evolution",
      description: "Evolve into Storm Slash: every 3rd hit calls a lightning strike.",
      isEvolution: true,
      unlockReq: "3/8",
    },
  });

  // ---- skill 2 with a small chain (root -> one child) ----
  const shadowStep = await prisma.mechSkill.create({
    data: {
      mechId: shadowWarrior.id,
      name: "Shadow Step",
      description: "Blink behind the densest enemy cluster.",
      baseStats: { cooldown: 8, invulnSeconds: 0.5 },
    },
  });
  const ssRoot = await prisma.skillUpgrade.create({
    data: {
      skillId: shadowStep.id,
      name: "Shadow Step I",
      description: "Cooldown -1s.",
    },
  });
  await prisma.skillUpgrade.create({
    data: {
      skillId: shadowStep.id,
      parentId: ssRoot.id,
      name: "Afterimage",
      description: "Leaves a decoy that taunts for 2s.",
      unlockReq: "4/8",
    },
  });

  // ---- unique weapon + its own branching tree ----
  const kusanagi = await prisma.weapon.create({
    data: {
      mechId: shadowWarrior.id,
      name: "Kusanagi Blade",
      description: "A monomolecular edge humming with static charge.",
      baseStats: { attack: 480, critRate: 0.15 },
    },
  });
  const wRoot = await prisma.weaponUpgrade.create({
    data: {
      weaponId: kusanagi.id,
      name: "Sharpened Edge",
      description: "ATK +8%.",
    },
  });
  await prisma.weaponUpgrade.create({
    data: {
      weaponId: kusanagi.id,
      parentId: wRoot.id,
      name: "Twin Fangs",
      description: "Attacks strike twice at 40% damage.",
      unlockReq: "3/8",
    },
  });
  const voltEdge = await prisma.weaponUpgrade.create({
    data: {
      weaponId: kusanagi.id,
      parentId: wRoot.id,
      name: "Volt Edge",
      description: "Hits apply Shock for 2s.",
      unlockReq: "3/8",
    },
  });
  await prisma.weaponUpgrade.create({
    data: {
      weaponId: kusanagi.id,
      parentId: voltEdge.id,
      name: "Kusanagi Awakened",
      description: "Evolve: Shocked enemies take 25% more damage from all sources.",
      isEvolution: true,
      unlockReq: "5/8",
    },
  });

  // ---- accessory (deliberately minimal: name + description) ----
  await prisma.accessory.create({
    data: {
      mechId: shadowWarrior.id,
      name: "Shadow Pendant",
      description: "Crit hits restore 1% HP.",
    },
  });

  // ---- skins: one owned by the MECH, one owned by the WEAPON ----
  // (covers both branches of the dual-nullable-FK pattern)
  await prisma.skin.create({
    data: {
      mechId: shadowWarrior.id, // mech-owned: weaponId stays null
      name: "Void Stalker",
      description: "Matte-black plating with violet circuit glow.",
      stars: {
        create: [
          { star: 1, perk: "HP +3%" },
          { star: 2, perk: "ATK +3%" },
          { star: 3, perk: "Thunder damage +5%" },
        ],
      },
    },
  });
  await prisma.skin.create({
    data: {
      weaponId: kusanagi.id, // weapon-owned: mechId stays null
      name: "Gilded Kusanagi",
      description: "Gold-etched blade with a trailing ember effect.",
      stars: {
        create: [
          { star: 1, perk: "Weapon ATK +2%" },
          { star: 2, perk: "Crit damage +4%" },
        ],
      },
    },
  });

  // ---- helpers: same mech-owned / weapon-owned split as skins ----
  await prisma.helper.create({
    data: {
      mechId: shadowWarrior.id,
      name: "Darren",
      passiveEffect: "ATK +5%",
      ranks: {
        create: [
          { rank: 1, effect: "ATK +5%" },
          { rank: 2, effect: "ATK +8%" },
          { rank: 3, effect: "ATK +12%, skills charge 10% faster" },
        ],
      },
    },
  });
  await prisma.helper.create({
    data: {
      weaponId: kusanagi.id,
      name: "Akira",
      passiveEffect: "Crit rate +3%",
      ranks: {
        create: [
          { rank: 1, effect: "Crit rate +3%" },
          { rank: 2, effect: "Crit rate +5%" },
        ],
      },
    },
  });

  // ---- awakening: 3 levels, each with exactly 5 nodes + unlocks ----
  const awakeningLevels = [
    {
      level: 1,
      statBonus: { atk: 120, hp: 800 },
      specialEffect: null,
      requirement: "Shadow Warrior Shard x30",
      unlocks: [{ name: "Node Slot", description: "Unlocks awakening nodes." }],
    },
    {
      level: 2,
      statBonus: { atk: 180, hp: 1200, def: 60 },
      specialEffect: "Thunder Slash chains +1 target",
      requirement: "Shadow Warrior Shard x60",
      unlocks: [{ name: "Exclusive Pose", description: "Hangar pose: Storm Vigil." }],
    },
    {
      level: 3,
      statBonus: { atk: 260, hp: 1800, critRate: 0.03 },
      specialEffect: "Shadow Step leaves a shock field",
      requirement: "Shadow Warrior Shard x100",
      unlocks: [
        { name: "Title: Stormbreaker", description: "Profile title." },
        { name: "Portrait Frame", description: "Animated lightning frame." },
      ],
    },
  ];
  // Every level gets the same 5 node attributes at positions 1-5.
  // "Exactly 5 nodes" is an app-level invariant — the seed upholds it.
  const nodeAttributes = ["ATK", "HP", "DEF", "Crit Rate", "Skill Damage"];
  for (const lvl of awakeningLevels) {
    await prisma.awakeningLevel.create({
      data: {
        mechId: shadowWarrior.id,
        level: lvl.level,
        statBonus: lvl.statBonus,
        specialEffect: lvl.specialEffect,
        requirement: lvl.requirement,
        nodes: {
          create: nodeAttributes.map((attribute, i) => ({
            position: i + 1,
            attribute,
          })),
        },
        unlocks: { create: lvl.unlocks },
      },
    });
  }

  // ================= Pirate Gunner (Standard, minimal) =================
  // No weapon/accessory/skins/helpers/awakening — proves those relations
  // stay empty for Standard mechs.
  const pirateGunner = await prisma.mech.create({
    data: {
      name: "Pirate Gunner",
      epithet: "Powder Keg",
      typeId: physicalType.id,
      rank: "Standard",
      quality: "Rare",
      specialBonus: "DEF +200",
      traits: {
        create: [{ traitId: physical.id }, { traitId: spreadshots.id }],
      },
    },
  });
  const cannonBarrage = await prisma.mechSkill.create({
    data: {
      mechId: pirateGunner.id,
      name: "Cannon Barrage",
      description: "Fires a spread of six cannonballs.",
      baseStats: { damage: 90, projectiles: 6, cooldown: 6 },
    },
  });
  const cbRoot = await prisma.skillUpgrade.create({
    data: {
      skillId: cannonBarrage.id,
      name: "Cannon Barrage I",
      description: "Projectiles +2.",
    },
  });
  await prisma.skillUpgrade.create({
    data: {
      skillId: cannonBarrage.id,
      parentId: cbRoot.id,
      name: "Chain Powder",
      description: "Cannonballs explode on impact.",
      unlockReq: "2/6",
    },
  });

  console.log("Seed complete: Shadow Warrior (S) + Pirate Gunner (Standard).");
}

main()
  .catch((e) => {
    console.error(e);
    // Note: process.exit() won't wait for the .finally() disconnect below.
    // Fine for a one-shot script; don't copy this pattern into a server.
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
