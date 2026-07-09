-- CreateTable
CREATE TABLE "pilots" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "unlock_boost" TEXT,
    "relationship_bonus" TEXT,
    "bonus_per_level" TEXT[],
    "icon_url" TEXT,
    "background_url" TEXT,
    "mech_id" UUID,

    CONSTRAINT "pilots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pilots_name_key" ON "pilots"("name");

-- CreateIndex
CREATE UNIQUE INDEX "pilots_mech_id_key" ON "pilots"("mech_id");

-- AddForeignKey
ALTER TABLE "pilots" ADD CONSTRAINT "pilots_mech_id_fkey" FOREIGN KEY ("mech_id") REFERENCES "mechs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
