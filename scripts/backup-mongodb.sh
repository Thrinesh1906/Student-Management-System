#!/bin/sh
set -e
BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
mkdir -p "$BACKUP_DIR"

echo "Backing up MongoDB..."
docker exec sms-mongodb mongodump --archive --gzip > "$BACKUP_DIR/sms_backup_$TIMESTAMP.gz"
echo "Backup saved to $BACKUP_DIR/sms_backup_$TIMESTAMP.gz"
