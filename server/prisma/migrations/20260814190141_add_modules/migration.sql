-- CreateEnum
CREATE TYPE "ModuleTargetKind" AS ENUM ('Weapon', 'Mech');

-- CreateTable
CREATE TABLE "modules" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "icon_url" TEXT,
    "type_id" UUID,
    "target_kind" "ModuleTargetKind" NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "module_qualities" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "icon_url" TEXT,
    "hp" TEXT NOT NULL,
    "atk" TEXT NOT NULL,
    "def" TEXT NOT NULL,
    "effect_count" INTEGER NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "module_qualities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "module_quality_effects" (
    "id" UUID NOT NULL,
    "module_id" UUID NOT NULL,
    "quality_id" UUID NOT NULL,
    "effect1_value" TEXT,

    CONSTRAINT "module_quality_effects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "module_bonuses" (
    "id" UUID NOT NULL,
    "module_quality_effect_id" UUID NOT NULL,
    "slot" INTEGER NOT NULL,
    "mech_id" UUID,
    "weapon_id" UUID,
    "effect_text" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "module_bonuses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "modules_name_key" ON "modules"("name");

-- CreateIndex
CREATE UNIQUE INDEX "module_qualities_name_key" ON "module_qualities"("name");

-- CreateIndex
CREATE UNIQUE INDEX "module_quality_effects_module_id_quality_id_key" ON "module_quality_effects"("module_id", "quality_id");

-- AddForeignKey
ALTER TABLE "modules" ADD CONSTRAINT "modules_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "module_quality_effects" ADD CONSTRAINT "module_quality_effects_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "module_quality_effects" ADD CONSTRAINT "module_quality_effects_quality_id_fkey" FOREIGN KEY ("quality_id") REFERENCES "module_qualities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "module_bonuses" ADD CONSTRAINT "module_bonuses_module_quality_effect_id_fkey" FOREIGN KEY ("module_quality_effect_id") REFERENCES "module_quality_effects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "module_bonuses" ADD CONSTRAINT "module_bonuses_mech_id_fkey" FOREIGN KEY ("mech_id") REFERENCES "mechs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "module_bonuses" ADD CONSTRAINT "module_bonuses_weapon_id_fkey" FOREIGN KEY ("weapon_id") REFERENCES "weapons"("id") ON DELETE SET NULL ON UPDATE CASCADE;
