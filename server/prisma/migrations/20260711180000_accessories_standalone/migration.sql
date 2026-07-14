-- Accessories become admin-managed entities. RENAME preserves the old
-- description text as the new exclusive_effect. FK switches to SET NULL:
-- a standalone accessory must survive its mech being deleted.

ALTER TABLE "accessories" RENAME COLUMN "description" TO "exclusive_effect";
ALTER TABLE "accessories" ALTER COLUMN "mech_id" DROP NOT NULL;
ALTER TABLE "accessories" ADD COLUMN "tier" "MechRank" NOT NULL DEFAULT 'Standard';
ALTER TABLE "accessories" ADD COLUMN "attributes" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "accessories" ADD COLUMN "image_url" TEXT;

-- backfill: every mech-linked accessory is an S-tier pair
UPDATE "accessories" SET "tier" = 'S' WHERE "mech_id" IS NOT NULL;

-- Cascade -> SetNull
ALTER TABLE "accessories" DROP CONSTRAINT "accessories_mech_id_fkey";
ALTER TABLE "accessories" ADD CONSTRAINT "accessories_mech_id_fkey" FOREIGN KEY ("mech_id") REFERENCES "mechs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
