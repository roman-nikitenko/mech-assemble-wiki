-- CreateTable
CREATE TABLE "aircraft" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "image_url" TEXT,
    "tier" "MechRank" NOT NULL DEFAULT 'Standard',
    "hp" TEXT,
    "atk" TEXT,
    "def" TEXT,
    "rank_up_preview" TEXT[],

    CONSTRAINT "aircraft_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "aircraft_name_key" ON "aircraft"("name");
