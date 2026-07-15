#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SERVICE_DIR="$ROOT_DIR/services/angelcare-sales-vendure"

echo "ANGELCARE SALES · Vendure production install"

if [ ! -f "$SERVICE_DIR/.env" ]; then
  cp "$SERVICE_DIR/.env.example" "$SERVICE_DIR/.env"
  echo "Created services/angelcare-sales-vendure/.env from example. Edit secrets before production."
fi

cd "$SERVICE_DIR"
npm install
npm run build

echo "Done. Next:"
echo "1) Edit $SERVICE_DIR/.env"
echo "2) docker compose -f $ROOT_DIR/docker-compose.angelcare-sales-vendure.yml up -d angelcare_sales_vendure_db"
echo "3) cd $SERVICE_DIR && npm run migration:generate && npm run migration:run"
echo "4) docker compose -f $ROOT_DIR/docker-compose.angelcare-sales-vendure.yml up -d --build"
