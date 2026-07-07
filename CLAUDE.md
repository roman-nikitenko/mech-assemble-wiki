# Mech Assemble Wiki — Project Context

## What this project is

A community wiki / database website for the mobile game **Mech Assemble: Zombie Swarm**.
Players visit the site to look up a specific mech and see everything it can do: its skills,
skill upgrade tree, unique weapon, accessory, skins, helpers, and awakening progression.

This is inspired by game-reference sites like maxroll.gg and mobalytics.gg.

**This is a study project.** The goal is to learn full-stack development (React, Node.js,
PostgreSQL). Prefer clear, conventional, well-explained code over clever or advanced patterns.
When you make a non-obvious choice, add a short comment explaining why, so it doubles as a
learning resource. Don't over-engineer — simple is a feature here.

## Current phase

**Phase 1: the game-data wiki (read-only reference site).**
An admin enters game data; visitors browse it. There are NO user accounts or user-generated
builds yet — that's a deliberate later phase, do not build it now.

## Tech stack

- Frontend: React (with Vite), React Router, TanStack Query, Tailwind CSS
- Backend: Node.js with Express, REST API
- ORM: Prisma
- Database: PostgreSQL
- Language: TypeScript on both front and back

## Game domain model (important — read carefully)

The game has two kinds of mech:
- **Standard mechs**: simple. Have identity, type, and skills only.
- **S-tier mechs**: rich. Additionally have a unique weapon, an accessory, skins, helpers,
  and an awakening system. The frontend should conditionally show Awaken/Skins tabs only
  for S-tier mechs (based on the `rank` field).

Mech **type** is a fixed enum: Fire, Thunder, Physical, Ice, Energy, Explosive.
Mech **rank** is a fixed enum: Standard, S.

Key systems and how they're modeled (15 tables total):

1. **mechs** — the hub. Fields: id, name, epithet (subtitle like "Shadow Hunter"), type (enum),
   rank (enum), quality (e.g. "Supreme"), special_bonus (a plain string like "ATK +10%" or
   "DEF +200" — deliberately kept as free text, not structured), pilot_name, lore.

2. **Skill tree**: `mech_skills` (base skills) → `skill_upgrades`. `skill_upgrades` is
   SELF-REFERENCING via a `parent_id` column pointing at its own table — this is how the
   branching upgrade tree is represented. An `is_evolution` boolean flags the special
   "evolve into..." nodes; `unlock_req` stores conditions like "3/8".

3. **Traits** (color-coded tags like "Thunder", "Spreadshots"): `traits` + `mech_traits`
   join table (many-to-many).

4. **Awakening** (S-tier only): `awakening_levels` (one row per level, holds stat_bonus jsonb,
   special_effect, requirement) → `awakening_nodes` (each level has exactly 5 nodes, with a
   position 1-5 and an attribute) and `awakening_unlocks` (items/effects a level grants).

5. **Unique weapon** (S-tier only): `weapons` (one per mech) → `weapon_upgrades`
   (also self-referencing via parent_id, its own upgrade tree).

6. **Accessory** (S-tier only): `accessories` — deliberately simple: just name + description.

7. **Skins**: `skins` → `skin_stars` (per-star perks). A skin belongs to EITHER a mech OR a
   weapon — modeled with two nullable foreign keys (mech_id, weapon_id), only one filled.
   This is a deliberate simple choice over polymorphic associations.

8. **Helpers** (characters like "Darren", "Akira" with a passive effect and a rank-up track):
   `helpers` → `helper_ranks`. Like skins, a helper belongs to EITHER a mech OR a weapon
   (two nullable FKs).

## Conventions

- Use UUIDs for primary keys.
- Use snake_case for database columns; Prisma models can map to them.
- Store flexible/variable stat blocks (base_stats, stat_bonus) as JSON (jsonb) columns.
- Keep the accessory simple (name + description only) — this was an explicit decision.
- special_bonus on mechs is a plain string by explicit decision — do not split it into
  structured stat/value/percent fields.

## What NOT to do (yet)

- No user accounts, authentication, favorites, comments, or user-generated builds.
- No admin UI yet — data can be seeded via scripts or entered directly for now.
- Don't add systems that aren't in the model above without asking.
