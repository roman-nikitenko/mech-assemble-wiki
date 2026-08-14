-- CreateEnum
CREATE TYPE "QualityTier" AS ENUM ('Blue', 'Purple', 'Orange', 'Red', 'Turquoise', 'Gold', 'Mythic');

-- AlterTable
ALTER TABLE "builds" ADD COLUMN     "quality" "QualityTier" NOT NULL DEFAULT 'Blue',
ADD COLUMN     "weapon_qualities" JSONB NOT NULL DEFAULT '{}';

-- AlterTable
ALTER TABLE "skill_nodes" ADD COLUMN     "initial_at_tier" "QualityTier";
