-- AlterTable
ALTER TABLE "drones" ADD COLUMN     "atk" TEXT,
ADD COLUMN     "def" TEXT,
ADD COLUMN     "drone_type_id" UUID,
ADD COLUMN     "hp" TEXT,
ADD COLUMN     "inherit_attack" TEXT,
ADD COLUMN     "level_up_bonuses" TEXT[],
ADD COLUMN     "preview_video_url" TEXT,
ADD COLUMN     "tier" "MechRank" NOT NULL DEFAULT 'Standard';

-- AddForeignKey
ALTER TABLE "drones" ADD CONSTRAINT "drones_drone_type_id_fkey" FOREIGN KEY ("drone_type_id") REFERENCES "drone_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;
