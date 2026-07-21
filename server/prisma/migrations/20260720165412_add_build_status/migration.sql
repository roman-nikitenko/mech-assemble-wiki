-- CreateEnum
CREATE TYPE "BuildStatus" AS ENUM ('Draft', 'Published', 'Unposted');

-- AlterTable
ALTER TABLE "builds" ADD COLUMN     "status" "BuildStatus" NOT NULL DEFAULT 'Draft';

-- Backfill: every build that already exists was posted through the old
-- "Post" flow (rows were only created when published), so mark them Published
-- rather than letting the new Draft default hide them from the feed.
UPDATE "builds" SET "status" = 'Published';
