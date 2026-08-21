#!/usr/bin/env bash
# Restores a backup INTO the local dev database: wipes the current schema,
# loads the dump, then brings the schema up to the current code.
# Run with: npm run restore -- <path/to/db.dump>   (add -y to skip the prompt)
#
# The reverse of scripts/backup.sh. DESTRUCTIVE: it drops every table in the
# local database first, so it is deliberately guarded to localhost only — it
# must never be pointed at production.
set -euo pipefail
cd "$(dirname "$0")/.."   # server/

# --- args: [-y|--yes] <dump-file> ---
ASSUME_YES=0
DUMP=""
for arg in "$@"; do
  case "$arg" in
    -y|--yes) ASSUME_YES=1 ;;
    *) DUMP="$arg" ;;
  esac
done
if [ -z "$DUMP" ]; then
  echo "Usage: npm run restore -- [-y] <path/to/db.dump>" >&2
  exit 1
fi
if [ ! -f "$DUMP" ]; then
  echo "Dump file not found: $DUMP" >&2
  exit 1
fi

# Reuse the app's DATABASE_URL (env first, then .env) — same as backup.sh.
if [ -z "${DATABASE_URL:-}" ] && [ -f .env ]; then
  DATABASE_URL=$(grep -E '^\s*DATABASE_URL=' .env | head -n1 | cut -d= -f2-)
  DATABASE_URL="${DATABASE_URL%\"}"; DATABASE_URL="${DATABASE_URL#\"}"  # strip quotes
fi
: "${DATABASE_URL:?DATABASE_URL not set (checked env and server/.env)}"

# Drop Prisma's ?schema=public query string — pg_restore/libpq reject it.
DB_URL="${DATABASE_URL%%\?*}"

# Safety guard: only ever restore into a LOCAL database. Parse the host out of
# postgresql://user:pass@HOST:port/db and refuse anything but localhost.
HOST=$(printf '%s' "$DB_URL" | sed -E 's#^[^@]*@([^:/]+).*#\1#')
case "$HOST" in
  localhost|127.0.0.1|::1|"") ;;
  *)
    echo "Refusing to restore: DATABASE_URL host is '$HOST', not localhost." >&2
    echo "This script only restores into a local dev database." >&2
    exit 1
    ;;
esac

# Show what we're about to overwrite (mask the password) and confirm.
MASKED=$(printf '%s' "$DB_URL" | sed -E 's#(://[^:]+:)[^@]+(@)#\1****\2#')
echo "About to WIPE and restore:"
echo "  target : $MASKED"
echo "  dump   : $DUMP"
if [ "$ASSUME_YES" -ne 1 ]; then
  printf "Type 'yes' to continue: "
  read -r reply
  [ "$reply" = "yes" ] || { echo "Aborted."; exit 1; }
fi

echo "==> Resetting schema…"
psql "$DB_URL" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

echo "==> Restoring dump…"
# --no-owner: the dump is owned by the server role (e.g. mech_admin) which does
# not exist locally; restore objects as the connecting user instead.
pg_restore -d "$DB_URL" --no-owner "$DUMP"

echo "==> Applying any newer migrations…"
npx prisma migrate deploy

echo "==> Regenerating Prisma client…"
npx prisma generate

echo "Done. Local database restored from $DUMP"
