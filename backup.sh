#!/bin/bash
set -e

DB=~/codespace/personal-finance-tracker/finance.db
BACKUP_REPO=~/codespace/personal-finance-tracker/finance-db-backup
DATE=$(date +%Y-%m-%d)

cp "$DB" "$BACKUP_REPO/finance.db"

cd "$BACKUP_REPO"
git add finance.db
git diff --cached --quiet && echo "No changes since last backup." && exit 0
git commit -m "backup $DATE"
git push
echo "Backup pushed: $DATE"
