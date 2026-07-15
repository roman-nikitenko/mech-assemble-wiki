-- Cleanup requested 2026-07-15: quality and pilot_name were free-text fields
-- superseded by the pilots table (dropdown) and dropped from the product.
ALTER TABLE "mechs" DROP COLUMN "quality";
ALTER TABLE "mechs" DROP COLUMN "pilot_name";
