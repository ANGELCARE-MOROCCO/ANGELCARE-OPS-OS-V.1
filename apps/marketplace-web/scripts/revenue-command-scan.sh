#!/usr/bin/env bash
set -euo pipefail

echo "Revenue Command route count:"
find app/\(protected\)/revenue-command-center -name "page.tsx" | wc -l

echo "Revenue Command TS files:"
find app/\(protected\)/revenue-command-center app/api/revenue-command-center lib/revenue-command-center -name "*.ts" -o -name "*.tsx" 2>/dev/null | wc -l

echo "Potential legacy engines:"
find app/\(protected\)/revenue-command-center -maxdepth 2 -type d | grep -E "_v|_final|_max|_execution|_lib|_components" || true

echo "Supabase throwOnError catch chains:"
grep -R "throwOnError().catch" app/api/revenue-command-center app/\(protected\)/revenue-command-center -n || true

echo "Server form action direct calls to known actions:"
grep -R "action={.*Revenue" app/\(protected\)/revenue-command-center -n || true

echo "Run TypeScript scan:"
npx tsc --noEmit --pretty false > ts-errors.txt 2>&1 || true
cat ts-errors.txt
