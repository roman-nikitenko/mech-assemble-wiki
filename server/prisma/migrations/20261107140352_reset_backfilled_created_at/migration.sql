-- Rows that existed BEFORE created_at was introduced were all stamped with the
-- same migration-time value, which would make every one of them show the "New"
-- badge for a week. Push those backfilled rows back to the start of the year so
-- only items added from now on count as new.
--
-- They are identifiable as the rows carrying the table's EARLIEST timestamp
-- (every later row was inserted by the app and has its own, later value).
-- They still tie with each other, so the client keeps ordering them by name.

UPDATE "mechs"
SET "created_at" = TIMESTAMP '2026-01-01 00:00:00'
WHERE "created_at" = (SELECT MIN("created_at") FROM "mechs");

UPDATE "weapons"
SET "created_at" = TIMESTAMP '2026-01-01 00:00:00'
WHERE "created_at" = (SELECT MIN("created_at") FROM "weapons");

UPDATE "pilots"
SET "created_at" = TIMESTAMP '2026-01-01 00:00:00'
WHERE "created_at" = (SELECT MIN("created_at") FROM "pilots");

UPDATE "drones"
SET "created_at" = TIMESTAMP '2026-01-01 00:00:00'
WHERE "created_at" = (SELECT MIN("created_at") FROM "drones");

UPDATE "aircraft"
SET "created_at" = TIMESTAMP '2026-01-01 00:00:00'
WHERE "created_at" = (SELECT MIN("created_at") FROM "aircraft");

UPDATE "accessories"
SET "created_at" = TIMESTAMP '2026-01-01 00:00:00'
WHERE "created_at" = (SELECT MIN("created_at") FROM "accessories");
