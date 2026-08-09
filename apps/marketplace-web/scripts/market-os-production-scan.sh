#!/usr/bin/env bash
set -euo pipefail
ROOT="${1:-.}"
echo "MARKET-OS PRODUCTION SCAN"
echo "Root: $ROOT"
echo ""
echo "TSX files:"
find "$ROOT" -path "*/market-os/*" -name "*.tsx" | wc -l | tr -d ' '
echo ""
echo "Button occurrences:"
grep -R "<button" "$ROOT/components/market-os" "$ROOT/app/components/market-os" "$ROOT/app/(protected)/market-os" 2>/dev/null | wc -l | tr -d ' ' || true
echo ""
echo "Potential static buttons without nearby onClick/MarketActionButton:"
python3 - <<'PY' "$ROOT"
import pathlib, re, sys
root = pathlib.Path(sys.argv[1])
paths = []
for base in [root/'components/market-os', root/'app/components/market-os', root/'app/(protected)/market-os']:
    if base.exists():
        paths.extend(base.rglob('*.tsx'))
for p in paths:
    txt=p.read_text(errors='ignore')
    if '<button' in txt and 'onClick' not in txt and 'MarketActionButton' not in txt:
        print(p)
PY
echo ""
echo "Run npm build after SQL and injection."
