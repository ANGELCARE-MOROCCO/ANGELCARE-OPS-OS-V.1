#!/usr/bin/env bash
set -euo pipefail

echo "Applying HR Unified Module V3 Executive Operations Layer..."

mkdir -p "app/(protected)/hr"
mkdir -p "lib/hr-unified"
mkdir -p "lib/supabase/migrations"

cp -R app lib . 2>/dev/null || true

echo "V3 files copied. Now run SQL migration:"
echo "lib/supabase/migrations/103_hr_unified_module_v3_executive_operations.sql"
echo "Then run: npm run build"
