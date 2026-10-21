#!/bin/sh
# Cópia consistente da base de dados SQLite (usa a API de backup do SQLite, segura com o site a correr).
# Uso, na pasta do portfólio no servidor:  sh deploy/backup.sh
set -e
mkdir -p backups
STAMP=$(date +%Y%m%d-%H%M%S)
docker compose exec -T web python - <<PY
import os, sqlite3
src = sqlite3.connect(os.environ["SQLITE_PATH"])
dst = sqlite3.connect("/data/backup-$STAMP.sqlite3")
src.backup(dst)
dst.close(); src.close()
PY
docker compose cp web:/data/backup-$STAMP.sqlite3 backups/db-$STAMP.sqlite3
docker compose exec -T web rm /data/backup-$STAMP.sqlite3
# mantém só as últimas 14 cópias
ls -1t backups/db-*.sqlite3 | tail -n +15 | xargs -r rm --
echo "backup guardado em backups/db-$STAMP.sqlite3"
