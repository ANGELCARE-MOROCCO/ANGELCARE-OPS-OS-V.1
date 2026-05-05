#!/usr/bin/env bash
set -euo pipefail
ROOT="$(pwd)"
SRC="$(cd "$(dirname "$0")/.." && pwd)"
echo "Installing AngelCare Email OS into: $ROOT"
mkdir -p app lib supabase/migrations docs
cp -R "$SRC/app/." "$ROOT/app/"
cp -R "$SRC/lib/." "$ROOT/lib/"
cp -R "$SRC/supabase/migrations/." "$ROOT/supabase/migrations/"
cp -R "$SRC/docs/." "$ROOT/docs/"
echo "Done. Next: run Supabase SQL migration 080_email_os_full_foundation.sql, then npm run build."
