-- CreateEnum
CREATE TYPE "SkillNodeType" AS ENUM ('Normal', 'Premium', 'Core');

-- CreateTable
CREATE TABLE "skill_nodes" (
    "id" UUID NOT NULL,
    "weapon_id" UUID NOT NULL,
    "parent_id" UUID,
    "name" TEXT,
    "description" TEXT,
    "appearance_level" INTEGER NOT NULL DEFAULT 1,
    "type" "SkillNodeType" NOT NULL DEFAULT 'Normal',
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "skill_nodes_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "skill_nodes" ADD CONSTRAINT "skill_nodes_weapon_id_fkey" FOREIGN KEY ("weapon_id") REFERENCES "weapons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_nodes" ADD CONSTRAINT "skill_nodes_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "skill_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
