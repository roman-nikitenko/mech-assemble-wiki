-- DropIndex
DROP INDEX "users_auth0_sub_key";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "auth0_sub",
ADD COLUMN     "provider" TEXT NOT NULL,
ADD COLUMN     "provider_account_id" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "users_provider_provider_account_id_key" ON "users"("provider", "provider_account_id");

