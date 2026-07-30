-- Add the public "slug" column, backfill it for existing weapons from their
-- names, guarantee uniqueness, then add the unique index. Mirrors the mech
-- slug migration. The column stays nullable so it can be added to the already-
-- populated `weapons` table; the app generates a slug for every new weapon.

ALTER TABLE "weapons" ADD COLUMN "slug" TEXT;

-- Backfill from name: lowercase, turn every run of non-alphanumerics into a
-- single hyphen, trim edge hyphens. Mirrors slugify() in src/lib/slug.ts.
UPDATE "weapons"
SET "slug" = trim(BOTH '-' FROM regexp_replace(lower("name"), '[^a-z0-9]+', '-', 'g'));

-- Safety net: if a name slugified to empty (all punctuation), fall back to a
-- short id-based slug so the row still gets a usable, unique value.
UPDATE "weapons"
SET "slug" = 'weapon-' || substr("id"::text, 1, 8)
WHERE "slug" IS NULL OR "slug" = '';

-- De-duplicate collisions by appending -2, -3, ... to all but the first
-- (ordered by id for determinism) — same suffixing uniqueWeaponSlug does.
-- Weapon names are NOT unique, so collisions here are expected, not an edge case.
WITH ranked AS (
  SELECT "id", "slug",
         row_number() OVER (PARTITION BY "slug" ORDER BY "id") AS rn
  FROM "weapons"
)
UPDATE "weapons" w
SET "slug" = w."slug" || '-' || ranked.rn
FROM ranked
WHERE w."id" = ranked."id" AND ranked.rn > 1;

CREATE UNIQUE INDEX "weapons_slug_key" ON "weapons"("slug");
