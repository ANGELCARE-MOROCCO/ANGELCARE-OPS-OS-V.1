#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PACK_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "Injecting HR V2 Final Core Completion Pack..."

mkdir -p "$ROOT_DIR/app/(protected)/hr/lib"
mkdir -p "$ROOT_DIR/app/(protected)/hr/components"
mkdir -p "$ROOT_DIR/lib/supabase/migrations"

cp -R "$PACK_DIR/app/" "$ROOT_DIR/app/"
cp -R "$PACK_DIR/lib/" "$ROOT_DIR/lib/"

echo "Done."
echo "Now run the SQL migration in Supabase:"
echo "lib/supabase/migrations/014_hr_v2_final_core_completion.sql"
echo "Then start app: npm run dev"
echo "Test: /hr/final-core"
