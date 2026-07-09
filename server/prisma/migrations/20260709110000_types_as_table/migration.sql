-- CreateTable
CREATE TABLE "types" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "icon_url" TEXT,

    CONSTRAINT "types_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "types_name_key" ON "types"("name");

-- AlterTable: drop the old enum column and add the new nullable FK column.
-- Data loss of mechs.type values is approved (see plan 2026-07-09-types.md).
ALTER TABLE "mechs" DROP COLUMN "type",
ADD COLUMN     "type_id" UUID;

-- AlterTable
ALTER TABLE "weapons" ADD COLUMN     "type_id" UUID;

-- DropEnum: enum is no longer referenced by any column.
DROP TYPE "MechType";

-- AddForeignKey
ALTER TABLE "mechs" ADD CONSTRAINT "mechs_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weapons" ADD CONSTRAINT "weapons_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
