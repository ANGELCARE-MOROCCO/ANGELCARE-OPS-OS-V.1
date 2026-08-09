#!/usr/bin/env bash
set -euo pipefail

echo "Market-OS Pack 4 local scan"
echo "============================"

echo "Static buttons still without onClick in Market-OS TSX files:"
find app components -path '*market-os*' -name '*.tsx' -type f 2>/dev/null | while read -r file; do
  count=$(grep -o '<button\b' "$file" | wc -l | tr -d ' ')
  onclick=$(grep -o 'onClick=' "$file" | wc -l | tr -d ' ')
  if [ "$count" -gt "$onclick" ]; then
    echo "WARN $file buttons=$count onClick=$onclick"
  fi
done

echo ""
echo "localStorage usage in Market-OS:"
grep -R "localStorage" app components lib -n --include='*.ts' --include='*.tsx' 2>/dev/null | grep -i 'market-os\|market_os\|MOSWorkspace' || true

echo ""
echo "Done. Runtime DB health endpoint after app restart: /api/market-os/production-health"
