-- AlterTable
ALTER TABLE "builds" ADD COLUMN     "drone_selections" JSONB NOT NULL DEFAULT '{}';
