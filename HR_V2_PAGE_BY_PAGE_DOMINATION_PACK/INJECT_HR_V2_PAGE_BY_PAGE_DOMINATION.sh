#!/usr/bin/env bash
set -e

PACK_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_ROOT="$(cd "$PACK_DIR/.." && pwd)"
STAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_DIR="$APP_ROOT/_backup_hr_v2_page_domination_$STAMP"

echo "HR V2 Page-by-Page Domination injection starting..."
echo "App root: $APP_ROOT"

mkdir -p "$BACKUP_DIR"

if [ -d "$APP_ROOT/app/(protected)/hr" ]; then
  echo "Backing up existing app/(protected)/hr to $BACKUP_DIR/hr"
  mkdir -p "$BACKUP_DIR/app/(protected)"
  cp -R "$APP_ROOT/app/(protected)/hr" "$BACKUP_DIR/app/(protected)/hr"
fi

if [ -d "$APP_ROOT/lib/supabase/migrations" ]; then
  mkdir -p "$BACKUP_DIR/lib/supabase"
  cp -R "$APP_ROOT/lib/supabase/migrations" "$BACKUP_DIR/lib/supabase/migrations"
fi

echo "Copying upgraded HR pages and components..."
cp -R "$PACK_DIR/app" "$APP_ROOT/"
cp -R "$PACK_DIR/lib" "$APP_ROOT/"
cp "$PACK_DIR/README_HR_V2_PAGE_BY_PAGE_DOMINATION.md" "$APP_ROOT/README_HR_V2_PAGE_BY_PAGE_DOMINATION.md"

echo "Injection complete."
echo "Backup created at: $BACKUP_DIR"
echo "Next: run npm run dev, then run lib/supabase/migrations/018_hr_v2_page_by_page_domination.sql in Supabase."
