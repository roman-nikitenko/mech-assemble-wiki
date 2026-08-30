/*
  Warnings:

  - You are about to drop the column `requirement` on the `awakening_levels` table. All the data in the column will be lost.
  - You are about to drop the column `special_effect` on the `awakening_levels` table. All the data in the column will be lost.
  - You are about to drop the column `stat_bonus` on the `awakening_levels` table. All the data in the column will be lost.
  - You are about to drop the column `attribute` on the `awakening_nodes` table. All the data in the column will be lost.
  - You are about to drop the `awakening_unlocks` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "awakening_unlocks" DROP CONSTRAINT "awakening_unlocks_level_id_fkey";

-- AlterTable
ALTER TABLE "awakening_levels" DROP COLUMN "requirement",
DROP COLUMN "special_effect",
DROP COLUMN "stat_bonus",
ADD COLUMN     "core_attr" TEXT[],
ADD COLUMN     "core_cd" INTEGER[],
ADD COLUMN     "core_info" TEXT,
ADD COLUMN     "core_lucky_id" INTEGER,
ADD COLUMN     "core_power" INTEGER,
ADD COLUMN     "core_reward" TEXT,
ADD COLUMN     "core_skill" TEXT,
ADD COLUMN     "core_skin" TEXT,
ADD COLUMN     "is_live" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "awakening_nodes" DROP COLUMN "attribute",
ADD COLUMN     "cond_entry" TEXT,
ADD COLUMN     "cond_raw" TEXT,
ADD COLUMN     "cond_target_id" INTEGER,
ADD COLUMN     "cond_text" TEXT,
ADD COLUMN     "cond_threshold" INTEGER,
ADD COLUMN     "enh_modes" INTEGER[],
ADD COLUMN     "enh_text" TEXT,
ADD COLUMN     "icon" TEXT,
ADD COLUMN     "mech_stat" TEXT;

-- DropTable
DROP TABLE "awakening_unlocks";

-- CreateTable
CREATE TABLE "awakening_cost_tiers" (
    "level" INTEGER NOT NULL,
    "outer_points" INTEGER NOT NULL,
    "outer_shards" INTEGER NOT NULL,
    "core_major" INTEGER NOT NULL,
    "core_shards" INTEGER NOT NULL,
    "acct_stats" TEXT[],

    CONSTRAINT "awakening_cost_tiers_pkey" PRIMARY KEY ("level")
);
