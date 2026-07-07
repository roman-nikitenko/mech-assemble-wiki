# Database + Seed Implementation Plan (Phase 1, Part A)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the PostgreSQL database for the Mech Assemble wiki: 15-table Prisma schema, first migration, and an idempotent seed with one full S-tier mech and one Standard mech.

**Architecture:** Single repo, `/server` folder only for now (client comes in a later plan). Prisma ORM over local Postgres (Postgres.app). One `schema.prisma` with 15 models + 2 enums; a linear, heavily commented `seed.ts`; a `verify.ts` that fetches a mech fully nested as a preview of the future detail endpoint.

**Tech Stack:** TypeScript, Prisma 6, PostgreSQL (Postgres.app), tsx (run TS without a build step).

**Spec:** `docs/superpowers/specs/2026-07-07-database-and-seed-design.md` — read it first; it explains every modeling decision.

**Verification model:** No business logic in this plan, so no unit tests. Each task ends with an operational check (command + expected output) instead — this is the spec's stated verification approach.

---

### Task 1: Server scaffold

**Files:**
- Create: `.gitignore` (repo root)
- Create: `server/package.json`
- Create: `server/tsconfig.json`

- [ ] **Step 1: Create `.gitignore` at the repo root**

```gitignore
node_modules/
dist/
.env
.DS_Store
```

- [ ] **Step 2: Create `server/package.json`**

Note: no `express` yet — this plan is DB-only. `tsx` runs TypeScript files directly (no compile step), which is all we need for seed/verify scripts.

```json
{
  "name": "mech-assemble-server",
  "private": true,
  "version": "0.1.0",
  "description": "Backend for the Mech Assemble wiki. Phase 1 Part A: database only.",
  "scripts": {
    "seed": "tsx prisma/seed.ts",
    "verify": "tsx src/verify.ts",
    "studio": "prisma studio"
  },
  "dependencies": {
    "@prisma/client": "^6.0.0",
    "dotenv": "^16.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "prisma": "^6.0.0",
    "tsx": "^4.0.0",
    "typescript": "^5.0.0"
  }
}
```

- [ ] **Step 2b: Create `server/prisma.config.ts`** (the `package.json#prisma` field is deprecated in Prisma 6, removed in 7):

```typescript
// Prisma CLI configuration. This replaces the deprecated `prisma` field in
// package.json (removed in Prisma 7). One subtlety: when this file exists,
// the Prisma CLI stops auto-loading .env — the `import "dotenv/config"` line
// below takes over that job.
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
```

- [ ] **Step 3: Create `server/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist"
  },
  "include": ["src", "prisma"]
}
```

- [ ] **Step 4: Install dependencies**

Run: `cd /Users/banzaifun/dev/mech-assemble-wiki/server && npm install`
Expected: completes without errors; `server/node_modules/` and `server/package-lock.json` appear.

- [ ] **Step 5: Confirm Postgres is running**

Run: `psql -lqt`
Expected: a list of databases prints (any list is fine — we just need the server up).
If it fails with "could not connect": open Postgres.app and start the server, then re-run.

- [ ] **Step 6: Commit**

```bash
cd /Users/banzaifun/dev/mech-assemble-wiki
git add .gitignore server/package.json server/package-lock.json server/tsconfig.json
git commit -m "chore: scaffold server package (TypeScript + Prisma deps)"
```

---

### Task 2: Prisma schema — 15 models, 2 enums

**Files:**
- Create: `server/.env` (gitignored — verify it does NOT show in `git status`)
- Create: `server/.env.example`
- Create: `server/prisma/schema.prisma`

- [ ] **Step 1: Create `server/.env`**

Postgres.app's default superuser is the macOS username with no password.

```env
DATABASE_URL="postgresql://banzaifun@localhost:5432/mech_assemble_wiki?schema=public"
```

- [ ] **Step 2: Create `server/.env.example`** (committed template)

```env
# Copy to .env and adjust for your local Postgres.
# Postgres.app on macOS: user = your macOS username, no password.
DATABASE_URL="postgresql://YOUR_USER@localhost:5432/mech_assemble_wiki?schema=public"
```

- [ ] **Step 3: Create `server/prisma/schema.prisma`** — the complete schema:

```prisma
// Prisma schema for the Mech Assemble wiki — 15 tables + 2 enums.
// Source of truth for the domain model: CLAUDE.md at the repo root.
//
// Conventions used throughout:
// - Model names are PascalCase, mapped to snake_case table names with @@map.
// - Field names are camelCase, mapped to snake_case columns with @map.
// - Every primary key is a UUID (project convention).
// - Flexible stat blocks are jsonb (Json type) — their shape varies per mech.

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ---------- Enums ----------

enum MechType {
  Fire
  Thunder
  Physical
  Ice
  Energy
  Explosive
}

enum MechRank {
  Standard
  S
}

// ---------- The hub ----------

model Mech {
  id           String   @id @default(uuid()) @db.Uuid
  name         String   @unique
  epithet      String? // subtitle, e.g. "Shadow Hunter"
  type         MechType
  rank         MechRank
  quality      String? // e.g. "Supreme"
  // Deliberately a plain string like "ATK +10%" — NOT structured fields.
  // Explicit product decision (see CLAUDE.md); do not normalize.
  specialBonus String?  @map("special_bonus")
  pilotName    String?  @map("pilot_name")
  lore         String?

  // S-tier-only systems below are optional/empty for Standard mechs;
  // the frontend decides what to show based on `rank`.
  skills          MechSkill[]
  traits          MechTrait[]
  awakeningLevels AwakeningLevel[]
  weapon          Weapon?
  accessory       Accessory?
  skins           Skin[]
  helpers         Helper[]

  @@map("mechs")
}

// ---------- Skills + upgrade tree ----------

model MechSkill {
  id          String  @id @default(uuid()) @db.Uuid
  mechId      String  @map("mech_id") @db.Uuid
  name        String
  description String?
  baseStats   Json?   @map("base_stats") // shape varies per skill -> jsonb

  mech     Mech           @relation(fields: [mechId], references: [id], onDelete: Cascade)
  upgrades SkillUpgrade[]

  @@map("mech_skills")
}

model SkillUpgrade {
  id          String  @id @default(uuid()) @db.Uuid
  skillId     String  @map("skill_id") @db.Uuid
  // Self-reference: each upgrade may point at a parent upgrade in the SAME
  // table — that's how the branching tree is stored. Root nodes have
  // parentId = null. Prisma requires self-relations to be NAMED (the
  // "SkillUpgradeTree" label) so it can tell the two sides (parent vs
  // children) apart.
  parentId    String? @map("parent_id") @db.Uuid
  name        String
  description String?
  isEvolution Boolean @default(false) @map("is_evolution") // "evolve into..." nodes
  unlockReq   String? @map("unlock_req") // e.g. "3/8"

  skill    MechSkill      @relation(fields: [skillId], references: [id], onDelete: Cascade)
  parent   SkillUpgrade?  @relation("SkillUpgradeTree", fields: [parentId], references: [id])
  children SkillUpgrade[] @relation("SkillUpgradeTree")

  @@map("skill_upgrades")
}

// ---------- Traits (many-to-many via join table) ----------

model Trait {
  id    String  @id @default(uuid()) @db.Uuid
  name  String  @unique
  color String? // hex color for the tag chip in the UI

  mechs MechTrait[]

  @@map("traits")
}

model MechTrait {
  // Join table gets its own UUID id (instead of a composite PK) to stay
  // consistent with the "UUIDs for all primary keys" project convention.
  // The @@unique below still prevents duplicate mech<->trait pairs.
  id      String @id @default(uuid()) @db.Uuid
  mechId  String @map("mech_id") @db.Uuid
  traitId String @map("trait_id") @db.Uuid

  mech  Mech  @relation(fields: [mechId], references: [id], onDelete: Cascade)
  trait Trait @relation(fields: [traitId], references: [id], onDelete: Cascade)

  @@unique([mechId, traitId])
  @@map("mech_traits")
}

// ---------- Awakening (S-tier only) ----------

model AwakeningLevel {
  id            String  @id @default(uuid()) @db.Uuid
  mechId        String  @map("mech_id") @db.Uuid
  level         Int
  statBonus     Json?   @map("stat_bonus") // e.g. {"atk": 120, "hp": 800}
  specialEffect String? @map("special_effect")
  requirement   String? // e.g. "Shadow Warrior Shard x30"

  mech    Mech              @relation(fields: [mechId], references: [id], onDelete: Cascade)
  // "Exactly 5 nodes per level" is an app-level rule (enforced by the seed /
  // future admin code), not a DB constraint — kept simple by design.
  nodes   AwakeningNode[]
  unlocks AwakeningUnlock[]

  @@unique([mechId, level])
  @@map("awakening_levels")
}

model AwakeningNode {
  id        String @id @default(uuid()) @db.Uuid
  levelId   String @map("level_id") @db.Uuid
  position  Int // 1-5
  attribute String // e.g. "ATK", "Crit Rate"

  level AwakeningLevel @relation(fields: [levelId], references: [id], onDelete: Cascade)

  @@unique([levelId, position])
  @@map("awakening_nodes")
}

model AwakeningUnlock {
  id          String  @id @default(uuid()) @db.Uuid
  levelId     String  @map("level_id") @db.Uuid
  name        String
  description String?

  level AwakeningLevel @relation(fields: [levelId], references: [id], onDelete: Cascade)

  @@map("awakening_unlocks")
}

// ---------- Unique weapon (S-tier only) + upgrade tree ----------

model Weapon {
  id          String  @id @default(uuid()) @db.Uuid
  mechId      String  @unique @map("mech_id") @db.Uuid // @unique makes this 1:1
  name        String
  description String?
  baseStats   Json?   @map("base_stats")

  mech     Mech            @relation(fields: [mechId], references: [id], onDelete: Cascade)
  upgrades WeaponUpgrade[]
  skins    Skin[]
  helpers  Helper[]

  @@map("weapons")
}

model WeaponUpgrade {
  id          String  @id @default(uuid()) @db.Uuid
  weaponId    String  @map("weapon_id") @db.Uuid
  // Same self-referencing tree pattern as SkillUpgrade — see the comment there.
  parentId    String? @map("parent_id") @db.Uuid
  name        String
  description String?
  isEvolution Boolean @default(false) @map("is_evolution")
  unlockReq   String? @map("unlock_req")

  weapon   Weapon          @relation(fields: [weaponId], references: [id], onDelete: Cascade)
  parent   WeaponUpgrade?  @relation("WeaponUpgradeTree", fields: [parentId], references: [id])
  children WeaponUpgrade[] @relation("WeaponUpgradeTree")

  @@map("weapon_upgrades")
}

// ---------- Accessory (S-tier only, deliberately minimal) ----------

model Accessory {
  id          String  @id @default(uuid()) @db.Uuid
  mechId      String  @unique @map("mech_id") @db.Uuid
  // Just name + description — explicit product decision, do not extend.
  name        String
  description String?

  mech Mech @relation(fields: [mechId], references: [id], onDelete: Cascade)

  @@map("accessories")
}

// ---------- Skins ----------

model Skin {
  id          String  @id @default(uuid()) @db.Uuid
  // A skin belongs to EITHER a mech OR a weapon: two nullable FKs, exactly
  // one filled. Deliberately simple vs. polymorphic associations. Prisma
  // can't declaratively enforce "exactly one is set" — that invariant lives
  // in the code that writes rows (the seed, later the admin API). A Postgres
  // CHECK constraint is the planned later-phase upgrade.
  mechId      String? @map("mech_id") @db.Uuid
  weaponId    String? @map("weapon_id") @db.Uuid
  name        String
  description String?

  mech   Mech?      @relation(fields: [mechId], references: [id], onDelete: Cascade)
  weapon Weapon?    @relation(fields: [weaponId], references: [id], onDelete: Cascade)
  stars  SkinStar[]

  @@map("skins")
}

model SkinStar {
  id     String @id @default(uuid()) @db.Uuid
  skinId String @map("skin_id") @db.Uuid
  star   Int // 1, 2, 3...
  perk   String // what this star level grants

  skin Skin @relation(fields: [skinId], references: [id], onDelete: Cascade)

  @@unique([skinId, star])
  @@map("skin_stars")
}

// ---------- Helpers ----------

model Helper {
  id            String  @id @default(uuid()) @db.Uuid
  // Same dual-nullable-FK pattern as Skin — see the comment there.
  mechId        String? @map("mech_id") @db.Uuid
  weaponId      String? @map("weapon_id") @db.Uuid
  name          String // e.g. "Darren", "Akira"
  passiveEffect String? @map("passive_effect")

  mech   Mech?        @relation(fields: [mechId], references: [id], onDelete: Cascade)
  weapon Weapon?      @relation(fields: [weaponId], references: [id], onDelete: Cascade)
  ranks  HelperRank[]

  @@map("helpers")
}

model HelperRank {
  id       String @id @default(uuid()) @db.Uuid
  helperId String @map("helper_id") @db.Uuid
  rank     Int
  effect   String

  helper Helper @relation(fields: [helperId], references: [id], onDelete: Cascade)

  @@unique([helperId, rank])
  @@map("helper_ranks")
}
```

- [ ] **Step 4: Validate the schema**

Run: `cd /Users/banzaifun/dev/mech-assemble-wiki/server && npx prisma validate`
Expected: `The schema at prisma/schema.prisma is valid 🚀`

- [ ] **Step 5: Confirm `.env` is ignored**

Run: `cd /Users/banzaifun/dev/mech-assemble-wiki && git status --porcelain | grep -c "\.env$" || echo "OK: .env not tracked"`
Expected: `OK: .env not tracked` (only `.env.example` may appear in git status).

- [ ] **Step 6: Commit**

```bash
cd /Users/banzaifun/dev/mech-assemble-wiki
git add server/prisma/schema.prisma server/.env.example
git commit -m "feat: Prisma schema — 15 models, 2 enums, self-referencing trees, dual-FK skins/helpers"
```

---

### Task 3: First migration

**Files:**
- Create (generated): `server/prisma/migrations/<timestamp>_init/migration.sql`

- [ ] **Step 1: Run the migration**

Run: `cd /Users/banzaifun/dev/mech-assemble-wiki/server && npx prisma migrate dev --name init`
Expected: creates the `mech_assemble_wiki` database if missing, applies the migration, and regenerates the Prisma client. Output ends with something like `Your database is now in sync with your schema.`

- [ ] **Step 2: Confirm all 15 tables exist**

Run: `psql -d mech_assemble_wiki -c "\dt" `
Expected: 15 app tables (+ Prisma's `_prisma_migrations`):
`accessories, awakening_levels, awakening_nodes, awakening_unlocks, helper_ranks, helpers, mech_skills, mech_traits, mechs, skill_upgrades, skin_stars, skins, traits, weapon_upgrades, weapons`

- [ ] **Step 3: Spot-check a self-referencing FK made it to SQL**

Run: `psql -d mech_assemble_wiki -c "\d skill_upgrades"`
Expected: among the FK constraints, one references `skill_upgrades(id)` itself (the parent_id tree link).

- [ ] **Step 4: Commit the migration**

```bash
cd /Users/banzaifun/dev/mech-assemble-wiki
git add server/prisma/migrations
git commit -m "feat: initial migration — create all 15 tables"
```

---

### Task 4: Seed script

**Files:**
- Create: `server/prisma/seed.ts`

- [ ] **Step 1: Write `server/prisma/seed.ts`** — complete file:

```typescript
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
  await prisma.mech.deleteMany();
  await prisma.trait.deleteMany();

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

  // ================= Shadow Warrior (S-tier, full kit) =================
  const shadowWarrior = await prisma.mech.create({
    data: {
      name: "Shadow Warrior",
      epithet: "Shadow Hunter",
      type: "Thunder",
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
      type: "Physical",
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
```

- [ ] **Step 2: Run the seed**

Run: `cd /Users/banzaifun/dev/mech-assemble-wiki/server && npx prisma db seed`
Expected: `Seed complete: Shadow Warrior (S) + Pirate Gunner (Standard).`

- [ ] **Step 3: Run it AGAIN (idempotency check)**

Run: `npx prisma db seed`
Expected: same success message, no unique-constraint errors.

- [ ] **Step 4: Quick row-count sanity check**

Run: `psql -d mech_assemble_wiki -c "SELECT (SELECT count(*) FROM mechs) AS mechs, (SELECT count(*) FROM skill_upgrades) AS skill_upgrades, (SELECT count(*) FROM awakening_nodes) AS awakening_nodes, (SELECT count(*) FROM skins WHERE weapon_id IS NOT NULL) AS weapon_skins;"`
Expected: `mechs=2`, `skill_upgrades=8`, `awakening_nodes=15`, `weapon_skins=1`.

- [ ] **Step 5: Commit**

```bash
cd /Users/banzaifun/dev/mech-assemble-wiki
git add server/prisma/seed.ts
git commit -m "feat: idempotent seed — Shadow Warrior (S-tier, full kit) + Pirate Gunner (Standard)"
```

---

### Task 5: Verification script

**Files:**
- Create: `server/src/verify.ts`

- [ ] **Step 1: Write `server/src/verify.ts`** — complete file:

```typescript
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
```

- [ ] **Step 2: Run it**

Run: `cd /Users/banzaifun/dev/mech-assemble-wiki/server && npm run verify`
Expected: full nested dump of both mechs, ending with `Verify complete: all relations resolved.`
Manually confirm in the output:
- Shadow Warrior: `Storm Evolution` appears nested under `Chain Lightning` (grandchild of the root) with `isEvolution: true`.
- Shadow Warrior's weapon has BOTH a skin (`Gilded Kusanagi`) and a helper (`Akira`) attached.
- Pirate Gunner: `weapon: null`, `accessory: null`, `skins: []`, `helpers: []`, `awakeningLevels: []`.

- [ ] **Step 3: Commit**

```bash
cd /Users/banzaifun/dev/mech-assemble-wiki
git add server/src/verify.ts
git commit -m "feat: verify script — full nested fetch previewing the detail endpoint query"
```

---

### Task 6: Prisma Studio spot-check + wrap-up

**Files:**
- Modify: `TODO.md` (check off completed items in sections 0-2)

- [ ] **Step 1: Open Prisma Studio for a visual check (user-facing step)**

Run: `cd /Users/banzaifun/dev/mech-assemble-wiki/server && npx prisma studio`
Expected: browser opens at `http://localhost:5555`; all 15 models listed; clicking `Mech` shows Shadow Warrior + Pirate Gunner. Tell the user it's open and let THEM browse — this step is for their eyes. Ctrl+C to stop when done.

- [ ] **Step 2: Check off completed TODO items**

In `TODO.md`, flip `- [ ]` to `- [x]` for every item in sections **0, 1, and 2** (all are done by this plan). Leave sections 3-5 untouched.

- [ ] **Step 3: Final commit**

```bash
cd /Users/banzaifun/dev/mech-assemble-wiki
git add TODO.md
git commit -m "docs: check off TODO sections 0-2 (setup, database, seed)"
```
