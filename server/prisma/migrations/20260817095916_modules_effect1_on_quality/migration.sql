/*
  Warnings:

  - You are about to drop the column `sort_order` on the `modules` table. All the data in the column will be lost.
  - You are about to drop the column `type_id` on the `modules` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "modules" DROP CONSTRAINT "modules_type_id_fkey";

-- AlterTable
ALTER TABLE "module_qualities" ADD COLUMN     "effect1_value" TEXT;

-- AlterTable
ALTER TABLE "modules" DROP COLUMN "sort_order",
DROP COLUMN "type_id";
