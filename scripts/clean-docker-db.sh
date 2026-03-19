#!/usr/bin/env bash
set -e
cd "$(dirname "$0")/.."
echo "Removing SQLite DB files in backend container..."
docker-compose exec backend sh -c 'rm -f /data/manu-gen.db /data/manu-gen.db-wal /data/manu-gen.db-shm'
echo "Restarting backend to create fresh DB..."
docker-compose restart backend
echo "Done. Backend is running with an empty database."
