-- AlterTable
ALTER TABLE "builds" ADD COLUMN     "module_selections" JSONB NOT NULL DEFAULT '{}';
