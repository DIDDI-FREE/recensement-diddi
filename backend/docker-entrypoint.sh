#!/bin/sh
set -e

echo "[entrypoint] Attente de PostgreSQL..."
# Attendre que la base soit prête (max 60s)
i=0
until node -e "const{PrismaClient}=require('@prisma/client');new PrismaClient().\$queryRawUnsafe('SELECT 1').then(()=>process.exit(0)).catch(()=>process.exit(1))" 2>/dev/null; do
  i=$((i+1))
  if [ "$i" -ge 30 ]; then
    echo "[entrypoint] PostgreSQL indisponible après 60s, démarrage quand même..."
    break
  fi
  sleep 2
done

echo "[entrypoint] Migrations Prisma..."
npx prisma migrate deploy || echo "[entrypoint] Aucune migration à appliquer (prisma db push nécessaire ?)"

if [ "$SEED_ON_START" = "true" ]; then
  echo "[entrypoint] Seed des comptes initiaux..."
  node dist/seed-runner.js || true
fi

echo "[entrypoint] Démarrage de l'API..."
exec node dist/index.js
