#!/bin/sh
set -e

echo "[entrypoint] Attente de PostgreSQL (db:5432)..."
# Attente TCP simple de la base (max 90 s) — ne dépend pas de Prisma
i=0
until node -e "require('net').connect(5432,'db').on('connect',()=>process.exit(0)).on('error',()=>process.exit(1))" 2>/dev/null; do
  i=$((i+1))
  if [ "$i" -ge 45 ]; then
    echo "[entrypoint] PostgreSQL indisponible apres 90s, tentative de demarrage quand meme..."
    break
  fi
  sleep 2
done

echo "[entrypoint] Migrations Prisma..."
npx prisma migrate deploy

if [ "$SEED_ON_START" = "true" ]; then
  echo "[entrypoint] Seed des comptes initiaux..."
  node dist/seed-runner.js || true
fi

echo "[entrypoint] Demarrage de l'API..."
exec node dist/index.js
