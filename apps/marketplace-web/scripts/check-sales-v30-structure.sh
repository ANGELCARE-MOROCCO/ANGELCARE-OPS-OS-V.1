#!/usr/bin/env bash
echo "Checking Sales V30 structure..."

paths=(
  "app/sales"
  "app/sales/closing-room"
  "app/sales/orchestrator"
  "lib/sales"
  "types/sales"
  "supabase/migrations"
)

for p in "${paths[@]}"; do
  if [ -d "$p" ]; then
    echo "✅ $p exists"
  else
    echo "⚠️  Missing: $p"
  fi
done

echo ""
echo "Now run:"
echo "npm run dev"
echo ""
echo "If errors appear, copy the full error and send it."
