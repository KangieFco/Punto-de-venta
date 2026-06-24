#!/bin/bash
set -e

source .env

DATE=$(date +"%Y-%m-%d_%H-%M")
BACKUP_NAME="PosDb_$DATE.bak"

docker exec sqlserver-pos /opt/mssql-tools18/bin/sqlcmd \
  -S localhost \
  -U sa \
  -P "$SA_PASSWORD" \
  -C \
  -Q "BACKUP DATABASE [PosDb] TO DISK = N'/var/opt/mssql/backups/$BACKUP_NAME' WITH INIT, COMPRESSION"

mkdir -p backups

docker cp "sqlserver-pos:/var/opt/mssql/backups/$BACKUP_NAME" "./backups/$BACKUP_NAME"

echo "Backup creado correctamente: backups/$BACKUP_NAME"