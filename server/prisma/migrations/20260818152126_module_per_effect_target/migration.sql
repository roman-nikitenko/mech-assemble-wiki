/*
  Warnings:

  - You are about to drop the column `target_kind` on the `modules` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "modules" DROP COLUMN "target_kind",
ADD COLUMN     "effect2_target" "ModuleTargetKind" NOT NULL DEFAULT 'Weapon',
ADD COLUMN     "effect3_target" "ModuleTargetKind" NOT NULL DEFAULT 'Weapon';
