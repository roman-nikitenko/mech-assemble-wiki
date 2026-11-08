-- CreateEnum
CREATE TYPE "ChipCategory" AS ENUM ('Head', 'Shoulder', 'Chest', 'Legs', 'Hands', 'Waist');

-- CreateTable
CREATE TABLE "chips" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "category" "ChipCategory" NOT NULL,
    "qualities" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chips_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "chips_name_key" ON "chips"("name");
