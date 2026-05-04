#!/usr/bin/env bash
set -e
ROOT="$(cd .. && pwd)"
PACK="$(pwd)"
echo "Injecting HR V2 Operational Control + QA Pack into: $ROOT"
mkdir -p "$ROOT/.hr-v2-backups"
STAMP="$(date +%Y%m%d_%H%M%S)"
mkdir -p "$ROOT/.hr-v2-backups/operational_control_qa_$STAMP"
for target in app components lib; do
  if [ -d "$ROOT/$target" ]; then
    cp -R "$ROOT/$target" "$ROOT/.hr-v2-backups/operational_control_qa_$STAMP/$target" 2>/dev/null || true
  fi
done
cp -R "$PACK/app" "$ROOT/"
cp -R "$PACK/components" "$ROOT/"
cp -R "$PACK/lib" "$ROOT/"
echo "Done. Run Supabase SQL: lib/supabase/migrations/017_hr_v2_operational_control_qa.sql"
