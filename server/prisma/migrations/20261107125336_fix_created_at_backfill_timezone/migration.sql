-- The previous migration backfilled created_at with CURRENT_TIMESTAMP, which
-- stores the session's LOCAL wall-clock time in a timezone-less column, while
-- Prisma writes UTC for every new row. On a database whose timezone is ahead
-- of UTC the backfilled rows therefore looked NEWER than rows created later,
-- so newest-first lists put new items at the bottom.
--
-- Convert only the rows that are "in the future" (impossible for a real UTC
-- timestamp): read the stored wall time as the session timezone, then express
-- it in UTC. Rows already correct (UTC databases) are left alone.

UPDATE "mechs"
SET "created_at" = ("created_at" AT TIME ZONE current_setting('TimeZone')) AT TIME ZONE 'UTC'
WHERE "created_at" > (now() AT TIME ZONE 'UTC');

UPDATE "weapons"
SET "created_at" = ("created_at" AT TIME ZONE current_setting('TimeZone')) AT TIME ZONE 'UTC'
WHERE "created_at" > (now() AT TIME ZONE 'UTC');

UPDATE "pilots"
SET "created_at" = ("created_at" AT TIME ZONE current_setting('TimeZone')) AT TIME ZONE 'UTC'
WHERE "created_at" > (now() AT TIME ZONE 'UTC');

UPDATE "drones"
SET "created_at" = ("created_at" AT TIME ZONE current_setting('TimeZone')) AT TIME ZONE 'UTC'
WHERE "created_at" > (now() AT TIME ZONE 'UTC');

UPDATE "aircraft"
SET "created_at" = ("created_at" AT TIME ZONE current_setting('TimeZone')) AT TIME ZONE 'UTC'
WHERE "created_at" > (now() AT TIME ZONE 'UTC');

UPDATE "accessories"
SET "created_at" = ("created_at" AT TIME ZONE current_setting('TimeZone')) AT TIME ZONE 'UTC'
WHERE "created_at" > (now() AT TIME ZONE 'UTC');
