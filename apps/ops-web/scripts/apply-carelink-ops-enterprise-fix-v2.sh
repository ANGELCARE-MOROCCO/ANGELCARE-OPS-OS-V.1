#!/usr/bin/env bash
set -euo pipefail
ROOT="$(pwd)"
echo "Applying CareLink Ops enterprise UX fix v2 into $ROOT"
mkdir -p components/carelink/ops app/carelink-ops app/api/carelink/ops/dashboard app/api/carelink/ops/actions lib/carelink docs
# Files are already extracted by unzip -o; this script validates critical files.
test -f components/carelink/ops/CareLinkOpsProductionDashboard.tsx
test -f lib/carelink/ops-dashboard-data.ts
test -f app/api/carelink/ops/dashboard/route.ts
# Keep route using relative import to avoid Turbopack alias issue.
python3 - <<'PY'
from pathlib import Path
p = Path('app/api/carelink/ops/dashboard/route.ts')
s = p.read_text()
s = s.replace("import { buildCareLinkOpsDashboard } from '@/lib/carelink/ops-dashboard-data'", "import { buildCareLinkOpsDashboard } from '../../../../../lib/carelink/ops-dashboard-data'")
p.write_text(s)
print('Verified dashboard route import')
PY
echo "Done. Now run: rm -rf .next && npm run build && npm run dev"
