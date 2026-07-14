#!/usr/bin/env bash
# Backs up the wiki: database dump + uploaded images, timestamped.
# Run with: npm run backup    (from server/)
#
# Restore the DB:   pg_restore -d mech_assemble_wiki --clean --if-exists <dir>/db.dump
# Restore images:   cp -R <dir>/uploads/* server/uploads/
set -euo pipefail
cd "$(dirname "$0")/.."   # server/
STAMP=$(date +%Y%m%d-%H%M%S)
DIR="backups/$STAMP"
mkdir -p "$DIR"
pg_dump -d mech_assemble_wiki -F c -f "$DIR/db.dump"
cp -R uploads "$DIR/uploads"
echo "Backup written to server/$DIR"
