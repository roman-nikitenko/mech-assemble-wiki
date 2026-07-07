# Mech Assemble Wiki — Phase 1, Part A: Database + Seed

**Date:** 2026-07-07
**Status:** Approved
**Scope:** TODO.md sections 0–2 (project setup, Prisma schema, seed data).
The REST API (section 3) and frontend (section 4) get their own specs later.

## Context

Community wiki for the mobile game *Mech Assemble: Zombie Swarm*. This is a study
project — clear, conventional code beats clever code, and non-obvious choices get
explanatory comments. Source of truth for the domain model is `CLAUDE.md` in the
repo root (15 tables; the original "16" was a counting typo, fixed).

Decisions made during brainstorming:

- Build in `/Users/banzaifun/dev/mech-assemble-wiki` (this repo); `CLAUDE.md` and
  `TODO.md` moved into the repo root.
- Single repo, two folders: `/server` and `/client`, each with its own
  `package.json`. No npm workspaces.
- This spec covers **database + seed only**. Verify in Prisma Studio, then plan
  the API and frontend as separate cycles.
- Seed data is **invented but plausible** — it exists to exercise every table and
  relationship, and can be replaced with real game data later.
- Local PostgreSQL via Postgres.app (already installed).

## Project scaffold

```
mech-assemble-wiki/
├── CLAUDE.md              # project context (source of truth for domain model)
├── TODO.md                # phase 1 build order
├── .gitignore             # node_modules, .env, dist
├── docs/superpowers/specs/  # design docs like this one
├── server/
│   ├── package.json       # typescript, prisma, @prisma/client, tsx
│   ├── tsconfig.json
│   ├── .env               # DATABASE_URL (gitignored)
│   ├── .env.example       # committed template
│   ├── prisma/
│   │   ├── schema.prisma  # single file: 15 models + 2 enums
│   │   └── seed.ts        # idempotent seed, invented data
│   └── src/
│       └── verify.ts      # fetches one mech fully nested, prints it
└── client/                # NOT created in this spec — later cycle
```

- `DATABASE_URL="postgresql://banzaifun@localhost:5432/mech_assemble_wiki?schema=public"`
  (Postgres.app default: superuser named after the macOS user, no password).
- `prisma migrate dev` creates the database if it doesn't exist.
- `tsx` runs TypeScript scripts directly (seed, verify) without a build step.

## Prisma schema

One `schema.prisma` file. Conventions:

- **Naming:** PascalCase model names mapped to snake_case tables with `@@map`;
  camelCase fields mapped to snake_case columns with `@map`.
- **Primary keys:** UUIDs everywhere — `@id @default(uuid()) @db.Uuid`.
- **Enums:** `MechType` (Fire, Thunder, Physical, Ice, Energy, Explosive) and
  `MechRank` (Standard, S).
- **JSON:** flexible stat blocks (`base_stats`, `stat_bonus`) are `Json` columns
  (jsonb in Postgres).
- `special_bonus` on mechs stays a plain string (explicit product decision).
- Accessory stays name + description only (explicit product decision).

### The 15 models

| Model (table) | Belongs to | Notes |
|---|---|---|
| `Mech` (mechs) | — | hub: name, epithet, type, rank, quality, special_bonus, pilot_name, lore |
| `MechSkill` (mech_skills) | Mech | base skills |
| `SkillUpgrade` (skill_upgrades) | MechSkill | **self-referencing** via `parent_id`; `is_evolution` bool; `unlock_req` string |
| `Trait` (traits) | — | color-coded tag |
| `MechTrait` (mech_traits) | Mech + Trait | join table; own UUID PK + `@@unique([mechId, traitId])` |
| `AwakeningLevel` (awakening_levels) | Mech | stat_bonus jsonb, special_effect, requirement |
| `AwakeningNode` (awakening_nodes) | AwakeningLevel | exactly 5 per level; position 1–5, attribute |
| `AwakeningUnlock` (awakening_unlocks) | AwakeningLevel | items/effects granted |
| `Weapon` (weapons) | Mech (1:1) | S-tier only |
| `WeaponUpgrade` (weapon_upgrades) | Weapon | **self-referencing** via `parent_id` |
| `Accessory` (accessories) | Mech (1:1) | name + description only |
| `Skin` (skins) | Mech **or** Weapon | **dual nullable FK** |
| `SkinStar` (skin_stars) | Skin | per-star perks |
| `Helper` (helpers) | Mech **or** Weapon | **dual nullable FK**; passive effect |
| `HelperRank` (helper_ranks) | Helper | rank-up track |

### The three tricky patterns (each gets a learning comment in the schema)

1. **Self-referencing trees** (`SkillUpgrade`, `WeaponUpgrade`): nullable
   `parentId` plus a *named* self-relation (`parent` / `children`). Prisma
   requires the relation name for self-relations — the comment explains why.
2. **Dual nullable FKs** (`Skin`, `Helper`): two optional relations
   (`mech_id`, `weapon_id`), only one filled. Known trade-off: Prisma cannot
   declaratively enforce "exactly one is set" — correctness lives in the seed
   for now, and a comment notes that a Postgres CHECK constraint is the
   later-phase upgrade.
3. **jsonb columns** for variable stat blocks.

Constraints like "exactly 5 awakening nodes per level" and "positions 1–5" are
app-level invariants, not DB constraints — kept simple by design.

## Seed data (invented, exercises every table)

`prisma/seed.ts`, wired via the `prisma.seed` field in `package.json`.

**Idempotent** by clearing all tables in FK-safe order (children before
parents) and re-inserting — re-run freely.

- **Shadow Warrior** — S-tier, Thunder, quality "Supreme", pilot, lore:
  - Base skills, each with a branching upgrade tree (parent → children),
    including at least one `is_evolution` node and `unlock_req` values like "3/8".
  - Traits: Thunder, Spreadshots (via `mech_traits`).
  - Unique weapon with its own branching upgrade tree.
  - Accessory (name + description).
  - **Two skins:** one owned by the mech, one owned by the weapon — covering
    both branches of the dual-FK pattern. Each with star perks.
  - **Two helpers:** Darren (mech-owned) and one weapon-owned, each with a
    rank-up track.
  - Several awakening levels, each with exactly 5 nodes (positions 1–5) and
    unlocks; stat_bonus as jsonb.
- **Pirate Gunner** — Standard, no S-tier systems: identity + a couple of
  skills with a small upgrade chain + a trait. Exists to prove conditional
  rendering in the later frontend cycle.

## Verification

No business logic yet, so verification is operational:

1. `npx prisma migrate dev` succeeds; all 15 tables exist.
2. Seed runs clean, then **re-runs** clean (proves idempotency).
3. `src/verify.ts` fetches Shadow Warrior with everything nested (skills +
   upgrade trees, traits, awakening levels + nodes + unlocks, weapon + its
   upgrades, accessory, skins + stars, helpers + ranks) and pretty-prints it.
   This doubles as a preview of the query the future `GET /api/mechs/:id`
   endpoint will run. Also fetch Pirate Gunner to confirm its S-tier relations
   are empty/null.
4. Prisma Studio spot-check.

## Out of scope

- Express API, CORS, error handling (next spec).
- React client (spec after that).
- User accounts, admin UI, deployment (later phases per TODO.md).
- DB-level CHECK constraint for the dual-FK exclusivity (noted as future work).
