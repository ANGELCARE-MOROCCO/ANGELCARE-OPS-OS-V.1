#!/usr/bin/env bash
set -euo pipefail

echo "Applying HR V3 MAX Phase 1 Verified Pack..."

# This pack is intended to be extracted at app root.
# It overwrites /hr dashboard and adds recruitment/task/approval/executive max pages.
# Existing V1/V2 pages not included here remain untouched.

echo "Files are already positioned by unzip/merge."
echo "Now run SQL:"
echo "lib/supabase/migrations/104_hr_v3_max_phase1_verified.sql"
echo ""
echo "Then run:"
echo "npm run build"
