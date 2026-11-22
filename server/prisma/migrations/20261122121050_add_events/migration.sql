-- CreateEnum
CREATE TYPE "EventCategory" AS ENUM ('draw', 'guild', 'explore', 'rank', 'shop', 'season');

-- CreateTable
CREATE TABLE "events" (
    "id" UUID NOT NULL,
    "game_id" INTEGER,
    "name" TEXT NOT NULL,
    "category" "EventCategory" NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "min_server_day" INTEGER,
    "featuring" TEXT,
    "icon_url" TEXT,
    "background_url" TEXT,
    "other_backgrounds" TEXT[],
    "rewards" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_assets" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_assets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "events_game_id_key" ON "events"("game_id");

-- CreateIndex
CREATE INDEX "events_start_date_end_date_idx" ON "events"("start_date", "end_date");

-- CreateIndex
CREATE UNIQUE INDEX "event_assets_key_key" ON "event_assets"("key");
