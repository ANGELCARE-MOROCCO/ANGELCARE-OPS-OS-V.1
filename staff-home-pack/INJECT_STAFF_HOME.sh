#!/usr/bin/env bash
set -euo pipefail

echo "✅ Creating Staff Home route..."
mkdir -p "app/(protected)/staff-home" "lib/auth"
cp -f "staff-home/page.tsx" "app/(protected)/staff-home/page.tsx"
cp -f "permissions.ts" "lib/auth/permissions.ts"

echo "✅ Staff Home injected. Login now redirects to /staff-home"
echo "Next: npm run dev and open http://localhost:3000/staff-home"
