#!/usr/bin/env bash
set -euo pipefail

APP_ROOT="${1:-$(pwd)}"
cd "$APP_ROOT"

echo "========================================================================"
echo "SANILA PUBLIC V2 — POST-APPLY REPOSITORY GATES"
echo "========================================================================"

required=(
  "package.json"
  "app/angelcare-marketplace/[locale]/[[...slug]]/page.tsx"
  "angelcare-marketplace/sanila-public/pageBlueprints.ts"
  "angelcare-marketplace/sanila-public/pageRegistry.tsx"
  "scripts/sanila-public-v2-static-qa.mjs"
)
for path in "${required[@]}"; do
  [[ -f "$path" ]] || { echo "FAIL missing $path"; exit 1; }
done

echo "[1/5] Static SANILA contract QA"
node scripts/sanila-public-v2-static-qa.mjs

echo "[2/5] Project route scanner"
if npm run | grep -q 'scan:routes'; then npm run scan:routes; else echo "SKIP scan:routes not configured"; fi

echo "[3/5] TypeScript"
if [[ -x node_modules/.bin/tsc ]]; then
  npx tsc --noEmit --pretty false
else
  echo "NOT_EXECUTED project TypeScript: node_modules missing"
  exit 2
fi

echo "[4/5] Production build"
if [[ -x node_modules/.bin/next ]]; then
  npm run build
else
  echo "NOT_EXECUTED production build: node_modules missing"
  exit 2
fi

echo "[5/5] Browser evidence readiness"
if node -e "require.resolve('playwright')" >/dev/null 2>&1; then
  echo "READY Playwright available. Run: node scripts/sanila-public-v2-browser-evidence.mjs"
else
  echo "RUNTIME_EVIDENCE_REQUIRED Playwright unavailable"
fi

echo "SANILA_PUBLIC_V2_REPOSITORY_GATES=PASS"
