-- CreateEnum
CREATE TYPE "MechType" AS ENUM ('Fire', 'Thunder', 'Physical', 'Ice', 'Energy', 'Explosive');

-- CreateEnum
CREATE TYPE "MechRank" AS ENUM ('Standard', 'S');

-- CreateTable
CREATE TABLE "mechs" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "epithet" TEXT,
    "type" "MechType" NOT NULL,
    "rank" "MechRank" NOT NULL,
    "quality" TEXT,
    "special_bonus" TEXT,
    "pilot_name" TEXT,
    "lore" TEXT,

    CONSTRAINT "mechs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mech_skills" (
    "id" UUID NOT NULL,
    "mech_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "base_stats" JSONB,

    CONSTRAINT "mech_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_upgrades" (
    "id" UUID NOT NULL,
    "skill_id" UUID NOT NULL,
    "parent_id" UUID,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_evolution" BOOLEAN NOT NULL DEFAULT false,
    "unlock_req" TEXT,

    CONSTRAINT "skill_upgrades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "traits" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,

    CONSTRAINT "traits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mech_traits" (
    "id" UUID NOT NULL,
    "mech_id" UUID NOT NULL,
    "trait_id" UUID NOT NULL,

    CONSTRAINT "mech_traits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "awakening_levels" (
    "id" UUID NOT NULL,
    "mech_id" UUID NOT NULL,
    "level" INTEGER NOT NULL,
    "stat_bonus" JSONB,
    "special_effect" TEXT,
    "requirement" TEXT,

    CONSTRAINT "awakening_levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "awakening_nodes" (
    "id" UUID NOT NULL,
    "level_id" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "attribute" TEXT NOT NULL,

    CONSTRAINT "awakening_nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "awakening_unlocks" (
    "id" UUID NOT NULL,
    "level_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "awakening_unlocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weapons" (
    "id" UUID NOT NULL,
    "mech_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "base_stats" JSONB,

    CONSTRAINT "weapons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weapon_upgrades" (
    "id" UUID NOT NULL,
    "weapon_id" UUID NOT NULL,
    "parent_id" UUID,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_evolution" BOOLEAN NOT NULL DEFAULT false,
    "unlock_req" TEXT,

    CONSTRAINT "weapon_upgrades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accessories" (
    "id" UUID NOT NULL,
    "mech_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "accessories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skins" (
    "id" UUID NOT NULL,
    "mech_id" UUID,
    "weapon_id" UUID,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "skins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skin_stars" (
    "id" UUID NOT NULL,
    "skin_id" UUID NOT NULL,
    "star" INTEGER NOT NULL,
    "perk" TEXT NOT NULL,

    CONSTRAINT "skin_stars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "helpers" (
    "id" UUID NOT NULL,
    "mech_id" UUID,
    "weapon_id" UUID,
    "name" TEXT NOT NULL,
    "passive_effect" TEXT,

    CONSTRAINT "helpers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "helper_ranks" (
    "id" UUID NOT NULL,
    "helper_id" UUID NOT NULL,
    "rank" INTEGER NOT NULL,
    "effect" TEXT NOT NULL,

    CONSTRAINT "helper_ranks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mechs_name_key" ON "mechs"("name");

-- CreateIndex
CREATE UNIQUE INDEX "traits_name_key" ON "traits"("name");

-- CreateIndex
CREATE UNIQUE INDEX "mech_traits_mech_id_trait_id_key" ON "mech_traits"("mech_id", "trait_id");

-- CreateIndex
CREATE UNIQUE INDEX "awakening_levels_mech_id_level_key" ON "awakening_levels"("mech_id", "level");

-- CreateIndex
CREATE UNIQUE INDEX "awakening_nodes_level_id_position_key" ON "awakening_nodes"("level_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "weapons_mech_id_key" ON "weapons"("mech_id");

-- CreateIndex
CREATE UNIQUE INDEX "accessories_mech_id_key" ON "accessories"("mech_id");

-- CreateIndex
CREATE UNIQUE INDEX "skin_stars_skin_id_star_key" ON "skin_stars"("skin_id", "star");

-- CreateIndex
CREATE UNIQUE INDEX "helper_ranks_helper_id_rank_key" ON "helper_ranks"("helper_id", "rank");

-- AddForeignKey
ALTER TABLE "mech_skills" ADD CONSTRAINT "mech_skills_mech_id_fkey" FOREIGN KEY ("mech_id") REFERENCES "mechs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_upgrades" ADD CONSTRAINT "skill_upgrades_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "mech_skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_upgrades" ADD CONSTRAINT "skill_upgrades_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "skill_upgrades"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mech_traits" ADD CONSTRAINT "mech_traits_mech_id_fkey" FOREIGN KEY ("mech_id") REFERENCES "mechs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mech_traits" ADD CONSTRAINT "mech_traits_trait_id_fkey" FOREIGN KEY ("trait_id") REFERENCES "traits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "awakening_levels" ADD CONSTRAINT "awakening_levels_mech_id_fkey" FOREIGN KEY ("mech_id") REFERENCES "mechs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "awakening_nodes" ADD CONSTRAINT "awakening_nodes_level_id_fkey" FOREIGN KEY ("level_id") REFERENCES "awakening_levels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "awakening_unlocks" ADD CONSTRAINT "awakening_unlocks_level_id_fkey" FOREIGN KEY ("level_id") REFERENCES "awakening_levels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weapons" ADD CONSTRAINT "weapons_mech_id_fkey" FOREIGN KEY ("mech_id") REFERENCES "mechs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weapon_upgrades" ADD CONSTRAINT "weapon_upgrades_weapon_id_fkey" FOREIGN KEY ("weapon_id") REFERENCES "weapons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weapon_upgrades" ADD CONSTRAINT "weapon_upgrades_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "weapon_upgrades"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accessories" ADD CONSTRAINT "accessories_mech_id_fkey" FOREIGN KEY ("mech_id") REFERENCES "mechs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skins" ADD CONSTRAINT "skins_mech_id_fkey" FOREIGN KEY ("mech_id") REFERENCES "mechs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skins" ADD CONSTRAINT "skins_weapon_id_fkey" FOREIGN KEY ("weapon_id") REFERENCES "weapons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skin_stars" ADD CONSTRAINT "skin_stars_skin_id_fkey" FOREIGN KEY ("skin_id") REFERENCES "skins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "helpers" ADD CONSTRAINT "helpers_mech_id_fkey" FOREIGN KEY ("mech_id") REFERENCES "mechs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "helpers" ADD CONSTRAINT "helpers_weapon_id_fkey" FOREIGN KEY ("weapon_id") REFERENCES "weapons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "helper_ranks" ADD CONSTRAINT "helper_ranks_helper_id_fkey" FOREIGN KEY ("helper_id") REFERENCES "helpers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
