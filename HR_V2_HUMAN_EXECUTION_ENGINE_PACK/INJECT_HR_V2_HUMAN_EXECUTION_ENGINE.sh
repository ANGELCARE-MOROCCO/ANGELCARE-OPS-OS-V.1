#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$(dirname "$0")"
echo "Injecting HR V2 Human Execution Engine Pack..."
mkdir -p "$ROOT/.angelcare_backups/hr_v2_human_execution_$(date +%Y%m%d_%H%M%S)"
cp -R app "$ROOT"/
cp -R components "$ROOT"/
cp -R lib "$ROOT"/
echo "Done. Run SQL migration 016_hr_v2_human_execution_engine.sql in Supabase, then npm run dev"
