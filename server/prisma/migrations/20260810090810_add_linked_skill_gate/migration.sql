-- AlterTable
ALTER TABLE "skill_nodes" ADD COLUMN     "linked_mech_id" UUID,
ADD COLUMN     "linked_weapon_id" UUID;

-- AddForeignKey
ALTER TABLE "skill_nodes" ADD CONSTRAINT "skill_nodes_linked_weapon_id_fkey" FOREIGN KEY ("linked_weapon_id") REFERENCES "weapons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_nodes" ADD CONSTRAINT "skill_nodes_linked_mech_id_fkey" FOREIGN KEY ("linked_mech_id") REFERENCES "mechs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
