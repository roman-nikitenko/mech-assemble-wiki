-- Weapons become standalone entities; weapon skins get their own table;
-- pilots become either/or (mech XOR weapon). Includes a DATA migration:
-- weapon-owned rows in "skins" move to "weapon_skins" (star perks -> bonuses).

-- CreateTable
CREATE TABLE "weapon_skins" (
    "id" UUID NOT NULL,
    "weapon_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "bonuses" TEXT[],

    CONSTRAINT "weapon_skins_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "weapon_skins" ADD CONSTRAINT "weapon_skins_weapon_id_fkey" FOREIGN KEY ("weapon_id") REFERENCES "weapons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DATA: move weapon-owned skins into weapon_skins (perks in star order)
INSERT INTO "weapon_skins" ("id", "weapon_id", "name", "bonuses")
SELECT gen_random_uuid(), s."weapon_id", s."name",
       COALESCE(
         (SELECT array_agg(ss."perk" ORDER BY ss."star")
            FROM "skin_stars" ss WHERE ss."skin_id" = s."id"),
         '{}'
       )
  FROM "skins" s
 WHERE s."weapon_id" IS NOT NULL;

-- remove the moved rows (their skin_stars cascade)
DELETE FROM "skins" WHERE "weapon_id" IS NOT NULL;

-- skins becomes mech-only
ALTER TABLE "skins" DROP CONSTRAINT "skins_weapon_id_fkey";
ALTER TABLE "skins" DROP COLUMN "weapon_id";
ALTER TABLE "skins" ALTER COLUMN "mech_id" SET NOT NULL;

-- weapons: standalone + new fields
ALTER TABLE "weapons" ALTER COLUMN "mech_id" DROP NOT NULL;
ALTER TABLE "weapons" ADD COLUMN "tier" "MechRank" NOT NULL DEFAULT 'Standard';
ALTER TABLE "weapons" ADD COLUMN "rank_up_preview" TEXT[];
ALTER TABLE "weapons" ADD COLUMN "image_url" TEXT;

-- pilots: weapon link (either/or with mech_id, app-enforced)
ALTER TABLE "pilots" ADD COLUMN "weapon_id" UUID;
CREATE UNIQUE INDEX "pilots_weapon_id_key" ON "pilots"("weapon_id");
ALTER TABLE "pilots" ADD CONSTRAINT "pilots_weapon_id_fkey" FOREIGN KEY ("weapon_id") REFERENCES "weapons"("id") ON DELETE SET NULL ON UPDATE CASCADE;
