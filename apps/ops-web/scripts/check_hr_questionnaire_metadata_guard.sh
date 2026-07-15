#!/usr/bin/env bash
set -euo pipefail

echo "== Check invalid server event handlers =="
grep -RIn "onSubmit=" "app/(protected)/hr/recruitment/questionnaires" || true

echo ""
echo "== Check hardcoded stale role strings in questionnaire/assessment print code =="
grep -RIn "Strategic Marketing & Communication Digital Officer\|Marketing Strategic\|MARKETING STRATEGIQUE" app components lib \
  --include="*.ts" --include="*.tsx" --include="*.jsx" --include="*.js" || true

echo ""
echo "If the hardcoded strings appear only inside seed/sample HTML, that is OK."
echo "If they appear inside a /print page fallback, replace with row.title / row.role_target."
