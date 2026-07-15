#!/usr/bin/env bash
set -e

echo "Scanning Market-OS buttons without onClick..."
grep -R "<button" components/market-os app/market-os app/\(protected\)/market-os -n 2>/dev/null | grep -v "onClick" || true

echo ""
echo "Scanning Market-OS component imports..."
grep -R "@/components/market-os" app/market-os app/\(protected\)/market-os -n 2>/dev/null || true
