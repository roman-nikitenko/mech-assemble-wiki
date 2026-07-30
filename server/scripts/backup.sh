#!/usr/bin/env bash
# Backs up the wiki: database dump + uploaded images, timestamped.
# Run with: npm run backup    (from server/)
#
# Restore the DB:   pg_restore -d "$DATABASE_URL" --clean --if-exists <dir>/db.dump
# Restore images:   cp -R <dir>/uploads/* server/uploads/
set -euo pipefail
cd "$(dirname "$0")/.."   # server/

# pg_dump must use the SAME credentials the app connects with. Given only a db
# name it falls back to peer auth as the OS user (e.g. "deploy"), which is not
# a Postgres role and fails. Reuse DATABASE_URL from the environment, else .env.
if [ -z "${DATABASE_URL:-}" ] && [ -f .env ]; then
  DATABASE_URL=$(grep -E '^\s*DATABASE_URL=' .env | head -n1 | cut -d= -f2-)
  DATABASE_URL="${DATABASE_URL%\"}"; DATABASE_URL="${DATABASE_URL#\"}"  # strip quotes
fi
: "${DATABASE_URL:?DATABASE_URL not set (checked env and server/.env)}"

# Prisma appends ?schema=public, which pg_dump/libpq reject as an unknown
# connection parameter — drop the query string (everything after the first "?").
DB_URL="${DATABASE_URL%%\?*}"

STAMP=$(date +%Y%m%d-%H%M%S)
DIR="backups/$STAMP"
mkdir -p "$DIR"
pg_dump -d "$DB_URL" -F c -f "$DIR/db.dump"
cp -R uploads "$DIR/uploads"
echo "Backup written to server/$DIR"
