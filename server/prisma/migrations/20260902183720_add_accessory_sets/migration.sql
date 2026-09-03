-- CreateTable
CREATE TABLE "accessory_sets" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "bonus" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "accessory_sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accessory_set_members" (
    "set_id" UUID NOT NULL,
    "accessory_id" UUID NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "accessory_set_members_pkey" PRIMARY KEY ("set_id","accessory_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "accessory_sets_name_key" ON "accessory_sets"("name");

-- AddForeignKey
ALTER TABLE "accessory_set_members" ADD CONSTRAINT "accessory_set_members_set_id_fkey" FOREIGN KEY ("set_id") REFERENCES "accessory_sets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accessory_set_members" ADD CONSTRAINT "accessory_set_members_accessory_id_fkey" FOREIGN KEY ("accessory_id") REFERENCES "accessories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
