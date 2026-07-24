#!/usr/bin/env bash
#
# Production deploy script — runs ON the VPS, invoked by the GitHub Actions
# workflow in .github/workflows/deploy.yml after it has pulled the latest main.
#
# It installs dependencies, rebuilds the frontend, and restarts the API.
#
# DELIBERATELY does NOT run database migrations. Schema changes are applied by
# hand (`npx prisma migrate deploy` on the server) so that an ordinary push can
# never alter or drop live data. See CLAUDE.md — the DB is treated as production.
#
# .env files and server/uploads/ are gitignored, so the git reset in the
# workflow leaves them untouched.

set -euo pipefail

APP_DIR=/var/www/mech-wiki

echo "==> Installing server dependencies + generating Prisma client"
cd "$APP_DIR/server"
npm ci
npx prisma generate

echo "==> Installing client dependencies + building the frontend"
cd "$APP_DIR/client"
npm ci
npm run build

echo "==> Restarting the API (picks up any .env changes)"
pm2 restart mech-api --update-env

echo "==> Deploy complete"
