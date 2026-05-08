#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CWD="$(pwd)"

if [ -f "$CWD/package.json" ]; then
  APP_ROOT="$CWD"
elif [ -f "$SCRIPT_DIR/package.json" ]; then
  APP_ROOT="$SCRIPT_DIR"
elif [ -f "$SCRIPT_DIR/../package.json" ]; then
  APP_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
else
  echo "ERROR: Could not detect app root."
  exit 1
fi

echo "Detected app root: $APP_ROOT"

mkdir -p "$APP_ROOT/app" "$APP_ROOT/lib"

if [ -d "$SCRIPT_DIR/app" ]; then cp -R "$SCRIPT_DIR/app/"* "$APP_ROOT/app/"; fi
if [ -d "$SCRIPT_DIR/lib" ]; then cp -R "$SCRIPT_DIR/lib/"* "$APP_ROOT/lib/"; fi

REPORT="$APP_ROOT/HR_FINAL_PRODUCTION_REPORT.txt"
: > "$REPORT"

echo "HR V3 MAX FINAL PRODUCTION REPORT" | tee -a "$REPORT"
echo "App root: $APP_ROOT" | tee -a "$REPORT"
echo "Date: $(date)" | tee -a "$REPORT"
echo "" | tee -a "$REPORT"

echo "Phase 12 route check:" | tee -a "$REPORT"
for f in \
  "app/(protected)/hr/final-qa/page.tsx" \
  "app/(protected)/hr/deployment-readiness/page.tsx" \
  "app/(protected)/hr/final-route-audit/page.tsx" \
  "lib/hr-unified/max-phase12-final-routes.ts" \
  "lib/supabase/migrations/115_hr_v3_max_phase12_final_production_stabilization.sql"
do
  if [ -f "$APP_ROOT/$f" ]; then echo "OK  $f" | tee -a "$REPORT"; else echo "MISS $f" | tee -a "$REPORT"; fi
done

echo "" | tee -a "$REPORT"
echo "Full HR route inventory:" | tee -a "$REPORT"
if [ -d "$APP_ROOT/app/(protected)/hr" ]; then
  find "$APP_ROOT/app/(protected)/hr" -maxdepth 5 -name "page.tsx" | sed "s#$APP_ROOT/##" | sort | tee -a "$REPORT"
else
  echo "MISS app/(protected)/hr" | tee -a "$REPORT"
fi

echo "" | tee -a "$REPORT"
echo "Known compatibility repairs:" | tee -a "$REPORT"

python3 - <<'PY' | tee -a "$REPORT"
from pathlib import Path

patches = []

v3 = Path("app/(protected)/hr/_components/V3Primitives.tsx")
hrmax = Path("app/(protected)/hr/_components/HRMaxUI.tsx")
if hrmax.exists() and not v3.exists():
    v3.write_text("import { HRHero, HRMetric, HRPanel, HRRow } from './HRMaxUI'\\nexport function V3Hero(props: any) { return <HRHero {...props} /> }\\nexport function V3MetricCard(props: any) { return <HRMetric {...props} /> }\\nexport function V3Panel(props: any) { return <HRPanel {...props} /> }\\nexport function V3Row(props: any) { return <HRRow {...props} /> }\\n")
    patches.append("created V3Primitives compatibility file")

p = Path("app/(protected)/hr/attendance/corrections/page.tsx")
if p.exists():
    text = p.read_text()
    new = text.replace("data.corrections?.map((x:any)=>", "(data as any).corrections?.map((x:any)=>")
    if new != text:
        p.write_text(new)
        patches.append("patched attendance corrections data shape access")

p = Path("components/market-os/MarketOSV17EnterpriseOpsCommand.tsx")
if p.exists():
    text = p.read_text()
    new = text.replace("          next.completed = undefined as never\\n", "")
    if new != text:
        p.write_text(new)
        patches.append("removed invalid MarketOS next.completed assignment")

if patches:
    for patch in patches:
        print("OK", patch)
else:
    print("OK no compatibility repairs needed")
PY

echo "" | tee -a "$REPORT"
echo "Run SQL:" | tee -a "$REPORT"
echo "lib/supabase/migrations/115_hr_v3_max_phase12_final_production_stabilization.sql" | tee -a "$REPORT"
echo "" | tee -a "$REPORT"
echo "Then:" | tee -a "$REPORT"
echo "rm -rf .next" | tee -a "$REPORT"
echo "npm run build" | tee -a "$REPORT"
echo "" | tee -a "$REPORT"
echo "Final QA pages:" | tee -a "$REPORT"
echo "/hr/final-qa" | tee -a "$REPORT"
echo "/hr/final-route-audit" | tee -a "$REPORT"
echo "/hr/deployment-readiness" | tee -a "$REPORT"
