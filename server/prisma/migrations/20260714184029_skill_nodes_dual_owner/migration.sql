-- AlterTable
ALTER TABLE "skill_nodes" ADD COLUMN     "mech_id" UUID,
ALTER COLUMN "weapon_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "skill_nodes" ADD CONSTRAINT "skill_nodes_mech_id_fkey" FOREIGN KEY ("mech_id") REFERENCES "mechs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
