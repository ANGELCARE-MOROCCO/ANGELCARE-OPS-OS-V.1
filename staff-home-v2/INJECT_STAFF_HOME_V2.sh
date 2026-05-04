#!/usr/bin/env bash
set -e
mkdir -p "app/(protected)/staff-home"
cp staff-home/page.tsx "app/(protected)/staff-home/page.tsx"
echo "✅ Staff Home V2 installed at app/(protected)/staff-home/page.tsx"
echo "Now run: npm run dev"
