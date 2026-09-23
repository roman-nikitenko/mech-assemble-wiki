-- CreateEnum
CREATE TYPE "ArsenalSlot" AS ENUM ('Breastplate', 'Greaves', 'Boots', 'Gauntlets', 'Belt', 'Helmet');

-- CreateTable
CREATE TABLE "arsenal_pieces" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "icon_url" TEXT,
    "slot" "ArsenalSlot" NOT NULL,
    "quality_min" INTEGER NOT NULL,
    "quality_max" INTEGER NOT NULL,
    "set_id" UUID,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "arsenal_pieces_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "arsenal_pieces_set_id_idx" ON "arsenal_pieces"("set_id");

-- AddForeignKey
ALTER TABLE "arsenal_pieces" ADD CONSTRAINT "arsenal_pieces_set_id_fkey" FOREIGN KEY ("set_id") REFERENCES "arsenal_sets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
