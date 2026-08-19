-- Move Effect 2/3 bonuses from per-(module,quality) to per-module.

-- 1. add the new owner column (nullable while we backfill)
ALTER TABLE "module_bonuses" ADD COLUMN "module_id" UUID;

-- 2. copy each bonus's module from its parent effect row
UPDATE "module_bonuses" b
SET "module_id" = e."module_id"
FROM "module_quality_effects" e
WHERE b."module_quality_effect_id" = e."id";

-- 3. dedupe identical bonuses that came from different qualities
DELETE FROM "module_bonuses" a
USING "module_bonuses" b
WHERE a."module_id" = b."module_id"
  AND a."slot" = b."slot"
  AND COALESCE(a."mech_id"::text, '') = COALESCE(b."mech_id"::text, '')
  AND COALESCE(a."weapon_id"::text, '') = COALESCE(b."weapon_id"::text, '')
  AND a."effect_text" = b."effect_text"
  AND a."ctid" > b."ctid";

-- 4. drop the old parent link (also drops its FK) and the now-empty grouping table
ALTER TABLE "module_bonuses" DROP COLUMN "module_quality_effect_id";
DROP TABLE "module_quality_effects";

-- 5. lock in the new owner column
ALTER TABLE "module_bonuses" ALTER COLUMN "module_id" SET NOT NULL;
ALTER TABLE "module_bonuses"
  ADD CONSTRAINT "module_bonuses_module_id_fkey"
  FOREIGN KEY ("module_id") REFERENCES "modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
