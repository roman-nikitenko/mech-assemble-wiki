// Postgres uuid columns make Prisma throw on malformed ids BEFORE any lookup
// runs. Routes test against this first so "not a uuid" and "no such row"
// both come out as the same clean 404/400 instead of a 500.
export const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
