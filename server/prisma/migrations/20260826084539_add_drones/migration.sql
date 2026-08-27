-- CreateTable
CREATE TABLE "drones" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "icon_url" TEXT,

    CONSTRAINT "drones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "drones_name_key" ON "drones"("name");
