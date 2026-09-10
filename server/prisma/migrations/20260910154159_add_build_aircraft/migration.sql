-- AlterTable
ALTER TABLE "builds" ADD COLUMN     "aircraft_id" TEXT,
ADD COLUMN     "aircraft_quality" TEXT NOT NULL DEFAULT 'Q1',
ADD COLUMN     "aircraft_reset_slots" JSONB NOT NULL DEFAULT '{}';
