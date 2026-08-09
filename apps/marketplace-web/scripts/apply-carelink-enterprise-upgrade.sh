#!/usr/bin/env bash
set -euo pipefail

ROOT="$(pwd)"
BACKUP_DIR="carelink_duplicate_route_backup_$(date +%Y%m%d_%H%M%S)"

if [ -d "app/(protected)/carelink" ]; then
  mkdir -p "$BACKUP_DIR/app/(protected)"
  mv "app/(protected)/carelink" "$BACKUP_DIR/app/(protected)/carelink"
  echo "Moved duplicate protected CareLink route to $BACKUP_DIR"
fi

if [ -d "app/carelink-v5" ] || [ -d "app/carelink/v5" ] || [ -d "components/carelink-v5" ] || [ -d "lib/carelink-v5" ]; then
  echo "WARNING: Found old v5 duplicate folders. Review and remove them before build."
fi

echo "CareLink enterprise single-module upgrade applied."
echo "Run: npm run build"
