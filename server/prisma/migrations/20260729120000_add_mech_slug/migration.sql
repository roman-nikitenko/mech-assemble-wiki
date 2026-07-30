-- Add the public "slug" column, backfill it for existing mechs from their
-- names, guarantee uniqueness, then add the unique index. The column stays
-- nullable so it can be added to the already-populated `mechs` table; the app
-- generates a slug for every new mech from here on.

ALTER TABLE "mechs" ADD COLUMN "slug" TEXT;

-- Backfill from name: lowercase, turn every run of non-alphanumerics into a
-- single hyphen, trim edge hyphens. Mirrors slugify() in src/lib/slug.ts.
-- (SQL can't strip accents without the `unaccent` extension; existing mech
-- names are ASCII, so this matches. Edit any odd result in the admin form.)
UPDATE "mechs"
SET "slug" = trim(BOTH '-' FROM regexp_replace(lower("name"), '[^a-z0-9]+', '-', 'g'));

-- Safety net: if a name slugified to empty (all punctuation), fall back to a
-- short id-based slug so the row still gets a usable, unique value.
UPDATE "mechs"
SET "slug" = 'mech-' || substr("id"::text, 1, 8)
WHERE "slug" IS NULL OR "slug" = '';

-- De-duplicate collisions by appending -2, -3, ... to all but the first
-- (ordered by id for determinism) — same suffixing the app's uniqueMechSlug does.
WITH ranked AS (
  SELECT "id", "slug",
         row_number() OVER (PARTITION BY "slug" ORDER BY "id") AS rn
  FROM "mechs"
)
UPDATE "mechs" m
SET "slug" = m."slug" || '-' || ranked.rn
FROM ranked
WHERE m."id" = ranked."id" AND ranked.rn > 1;

CREATE UNIQUE INDEX "mechs_slug_key" ON "mechs"("slug");
