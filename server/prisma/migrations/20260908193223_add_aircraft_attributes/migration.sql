-- CreateEnum
CREATE TYPE "AircraftAttributeUnit" AS ENUM ('Flat', 'Percent');

-- CreateTable
CREATE TABLE "aircraft_attribute_groups" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "unit" "AircraftAttributeUnit" NOT NULL,
    "q1_max" DOUBLE PRECISION NOT NULL,
    "q8_max" DOUBLE PRECISION NOT NULL,
    "q13_max" DOUBLE PRECISION NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "aircraft_attribute_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aircraft_attributes" (
    "id" UUID NOT NULL,
    "group_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "aircraft_attributes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "aircraft_attribute_groups_name_key" ON "aircraft_attribute_groups"("name");

-- CreateIndex
CREATE UNIQUE INDEX "aircraft_attributes_name_key" ON "aircraft_attributes"("name");

-- CreateIndex
CREATE INDEX "aircraft_attributes_group_id_idx" ON "aircraft_attributes"("group_id");

-- AddForeignKey
ALTER TABLE "aircraft_attributes" ADD CONSTRAINT "aircraft_attributes_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "aircraft_attribute_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- DATA: seed the reset-effect catalog (10 groups / 29 attributes).
-- There is no admin CRUD for these tables — this migration IS the catalog.
-- gen_random_uuid() (as in 20260709120000_weapons_standalone) plus the UNIQUE
-- name means rows are addressable by name, and ON CONFLICT DO NOTHING makes a
-- re-run, or a restore of a dump that already holds them, a no-op.
INSERT INTO "aircraft_attribute_groups" ("id","name","unit","q1_max","q8_max","q13_max","sort_order")
VALUES
  (gen_random_uuid(), 'Flat HP',              'Flat',    1000, 15000, 20000,  1),
  (gen_random_uuid(), 'Flat ATK / DEF',       'Flat',     100,  1500,  2000,  2),
  (gen_random_uuid(), 'Percent core',         'Percent',    5,    80,   100,  3),
  (gen_random_uuid(), 'Target type',          'Percent',    5,    80,   100,  4),
  (gen_random_uuid(), 'Source type',          'Percent',    5,    80,   100,  5),
  (gen_random_uuid(), 'Source type (halved)', 'Percent',  2.5,    40,    50,  6),
  (gen_random_uuid(), 'Element DMG',          'Percent',    5,    80,   100,  7),
  (gen_random_uuid(), 'Element immunity',     'Percent',    5,    80,   100,  8),
  (gen_random_uuid(), 'PvE final',            'Percent',    5,    80,   100,  9),
  (gen_random_uuid(), 'PvP final',            'Percent',    5,    80,   100, 10)
ON CONFLICT ("name") DO NOTHING;

-- Attributes carry their group BY NAME and join to it, so no uuid is pasted
-- twice. NOTE: the six "… Immunity" names are inferred from the game's stat
-- table (only the DMG rows were visible in-game) — correct them with a follow-
-- up UPDATE migration if the real strings differ; nothing references them by
-- name, only by id.
INSERT INTO "aircraft_attributes" ("id","group_id","name","sort_order")
SELECT gen_random_uuid(), g."id", v."name", v."sort_order"
  FROM (VALUES
    ('Flat HP',              'HP',                    1),

    ('Flat ATK / DEF',       'Attack',                1),
    ('Flat ATK / DEF',       'Defense',               2),

    ('Percent core',         'HP %',                  1),
    ('Percent core',         'Attack %',              2),
    ('Percent core',         'Defense %',             3),

    ('Target type',          'DMG to Minions',        1),
    ('Target type',          'DMG to BOSS',           2),

    ('Source type',          'Mech DMG',              1),
    ('Source type',          'Drone DMG',             2),
    ('Source type',          'Support DMG',           3),

    ('Source type (halved)', 'Weapon DMG',            1),
    ('Source type (halved)', 'Drone Skill CD Speed',  2),

    ('Element DMG',          'Ice DMG',               1),
    ('Element DMG',          'Fire DMG',              2),
    ('Element DMG',          'Thunder DMG',           3),
    ('Element DMG',          'Energy DMG',            4),
    ('Element DMG',          'Physical DMG',          5),
    ('Element DMG',          'Explosive DMG',         6),

    ('Element immunity',     'Ice Immunity',          1),
    ('Element immunity',     'Fire Immunity',         2),
    ('Element immunity',     'Thunder Immunity',      3),
    ('Element immunity',     'Energy Immunity',       4),
    ('Element immunity',     'Physical Immunity',     5),
    ('Element immunity',     'Explosive Immunity',    6),

    ('PvE final',            'DMG to monsters',       1),
    ('PvE final',            'Monster DMG Reduction', 2),

    ('PvP final',            'DMG in PvP',            1),
    ('PvP final',            'DMG Immunity in PvP',   2)
  ) AS v("group_name","name","sort_order")
  JOIN "aircraft_attribute_groups" g ON g."name" = v."group_name"
ON CONFLICT ("name") DO NOTHING;
