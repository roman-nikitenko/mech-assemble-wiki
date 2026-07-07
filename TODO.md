# Mech Assemble Wiki — Build TODO

Build order for Phase 1 (the read-only game-data wiki). Work top to bottom — each
section depends on the ones above it. Check items off as you go.

## 0. Project setup
- [ ] Initialize a monorepo or two folders: `/server` (Node/Express/Prisma) and `/client` (React/Vite)
- [ ] Set up TypeScript in both
- [ ] Confirm a PostgreSQL database is available and reachable (local install or a free
      Railway/Render instance). Help me set this up if I don't have one.
- [ ] Create a `.env` with `DATABASE_URL` (never commit it; add to `.gitignore`)

## 1. Database (the foundation)
- [ ] Install and initialize Prisma in `/server`
- [ ] Write the Prisma schema for all 15 tables described in CLAUDE.md:
      mechs, mech_skills, skill_upgrades, traits, mech_traits, awakening_levels,
      awakening_nodes, awakening_unlocks, weapons, weapon_upgrades, accessories,
      skins, skin_stars, helpers, helper_ranks
- [ ] Pay special attention to the two self-referencing relations
      (skill_upgrades.parent_id, weapon_upgrades.parent_id) and the dual-nullable-FK
      relations (skins and helpers each belong to a mech OR a weapon)
- [ ] Define the enums: MechType (Fire, Thunder, Physical, Ice, Energy, Explosive),
      MechRank (Standard, S)
- [ ] Run the first migration (`prisma migrate dev`) and confirm tables are created
- [ ] Open Prisma Studio to visually confirm the schema looks right

## 2. Seed data (so there's something to display)
- [ ] Write a seed script that inserts 2-3 example mechs end to end, including at least
      one full S-tier mech (Shadow Warrior) with skills, a skill tree, a weapon, an
      accessory, a skin with star perks, a helper, and a few awakening levels
- [ ] Include at least one Standard mech (e.g. Pirate Gunner) with no S-tier systems,
      to test the conditional rendering later
- [ ] Run the seed and verify the data in Prisma Studio

## 3. Backend API
- [ ] Set up an Express server with TypeScript
- [ ] `GET /api/mechs` — list all mechs (id, name, epithet, type, rank, quality) for the
      browse page. Support optional filtering by type and rank via query params.
- [ ] `GET /api/mechs/:id` — one mech with EVERYTHING nested (skills + upgrade tree,
      traits, awakening levels + nodes + unlocks, weapon + its upgrades, accessory,
      skins + star perks, helpers + rank perks). This is the main endpoint the detail
      page uses.
- [ ] Add basic error handling (404 for missing mech, 500 fallback)
- [ ] Enable CORS so the React dev server can call the API
- [ ] Test both endpoints (curl or a REST client) before building the frontend

## 4. Frontend
- [ ] Set up the React app (Vite) with React Router, TanStack Query, Tailwind
- [ ] Browse page: grid of mech cards, fetched from `GET /api/mechs`, with type/rank filters
- [ ] Mech detail page: fetches `GET /api/mechs/:id`, lays out all the systems.
      Conditionally render the Awaken and Skins sections ONLY when rank === "S".
- [ ] Render the skill tree and weapon upgrade tree showing the branching structure
      (parent → children), with evolution nodes visually distinct
- [ ] Render the awakening progression (levels, each with its 5 nodes)
- [ ] Loading and error states on both pages

## 5. Polish (optional for Phase 1)
- [ ] Basic responsive layout (works on mobile — the game is mobile, fans will browse on phones)
- [ ] A simple search box on the browse page
- [ ] Clean up, add a README explaining how to run server + client

## Later phases (DO NOT build yet — noted for context only)
- User accounts and authentication
- User-generated builds and sharing
- Favorites, comments, tier lists
- Admin UI for entering game data
- Deployment

## Notes for whoever builds this
- This is a learning project — explain non-obvious decisions in comments.
- Keep it simple; don't introduce patterns beyond what the task needs.
- The full 15-table data model is described in CLAUDE.md — treat that as the source of truth.
