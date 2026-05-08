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

cd "$APP_ROOT"

REPORT="HR_PERMISSION_INTEGRATION_REPORT.txt"
: > "$REPORT"

echo "HR Permission Integration Safe Patch" | tee -a "$REPORT"
echo "App root: $APP_ROOT" | tee -a "$REPORT"
echo "Date: $(date)" | tee -a "$REPORT"
echo "" | tee -a "$REPORT"

if [ ! -f "lib/auth/permissions.ts" ]; then
  echo "ERROR: lib/auth/permissions.ts not found." | tee -a "$REPORT"
  exit 1
fi

cp "lib/auth/permissions.ts" "lib/auth/permissions.ts.backup_hr_permissions_$(date +%Y%m%d_%H%M%S)"
echo "Backup created for lib/auth/permissions.ts" | tee -a "$REPORT"

python3 - <<'PY' | tee -a "$REPORT"
from pathlib import Path
import re

p = Path("lib/auth/permissions.ts")
text = p.read_text()

hr_module = """  hr: [
    'hr.view',
    'hr.dashboard',
    'hr.recruitment.view',
    'hr.recruitment.manage',
    'hr.openings.manage',
    'hr.staff.view',
    'hr.staff.manage',
    'hr.onboarding.manage',
    'hr.rosters.manage',
    'hr.attendance.manage',
    'hr.documents.manage',
    'hr.approvals.manage',
    'hr.analytics.view',
    'hr.audit.view',
    'hr.executive.view',
    'hr.settings.manage',
    'hr.admin',
  ],
"""

if "  hr: [" not in text:
    text = text.replace("} as const\n\nexport const MODULE_ACCESS_LINKS", hr_module + "} as const\n\nexport const MODULE_ACCESS_LINKS")
    print("OK added hr namespace to MODULE_PERMISSIONS")
else:
    print("OK hr namespace already exists in MODULE_PERMISSIONS")

hr_links = """  { label: 'HR MAX', href: '/hr', permission: 'hr.view' },
  { label: 'HR Operations Console', href: '/hr/operations-console', permission: 'hr.view' },
  { label: 'HR Boardroom', href: '/hr/boardroom', permission: 'hr.executive.view' },
  { label: 'HR Recruitment', href: '/hr/recruitment', permission: 'hr.recruitment.view' },
  { label: 'HR Staff 360', href: '/hr/staff', permission: 'hr.staff.view' },
  { label: 'HR Approvals', href: '/hr/approvals', permission: 'hr.approvals.manage' },
  { label: 'HR Documents', href: '/hr/documents', permission: 'hr.documents.manage' },
  { label: 'HR Attendance', href: '/hr/attendance', permission: 'hr.attendance.manage' },
  { label: 'HR Rosters', href: '/hr/rosters', permission: 'hr.rosters.manage' },
  { label: 'HR Final QA', href: '/hr/final-qa', permission: 'hr.admin' },
"""

if "{ label: 'HR MAX', href: '/hr', permission: 'hr.view' }" not in text:
    marker = "  { label: 'Sales', href: '/sales', permission: 'sales.view' },"
    if marker in text:
        text = text.replace(marker, hr_links + marker)
    else:
        text = text.replace("] as const\n\nexport type ModuleKey", hr_links + "] as const\n\nexport type ModuleKey")
    print("OK added HR entries to MODULE_ACCESS_LINKS")
else:
    print("OK HR entries already exist in MODULE_ACCESS_LINKS")

hr_access = """  {
    key: "hr.view",
    href: "/hr",
  },
  {
    key: "hr.executive.view",
    href: "/hr/boardroom",
  },
  {
    key: "hr.admin",
    href: "/hr/final-qa",
  },
"""

if 'key: "hr.view"' not in text:
    text = text.replace("] as const;\n\nexport function hasPermission", hr_access + "] as const;\n\nexport function hasPermission")
    print("OK added HR entries to MODULE_ACCESS")
else:
    print("OK HR entries already exist in MODULE_ACCESS")

p.write_text(text)
print("OK wrote lib/auth/permissions.ts")
PY

echo "" | tee -a "$REPORT"
echo "Optional SmartPermissionsPanel preset patch" | tee -a "$REPORT"

python3 - <<'PY' | tee -a "$REPORT"
from pathlib import Path
import re

candidates = [
    Path("app/(protected)/users/_components/SmartPermissionsPanel.tsx"),
    Path("app/(protected)/user-management/_components/SmartPermissionsPanel.tsx"),
    Path("components/user-manager/SmartPermissionsPanel.tsx"),
]

existing = [p for p in candidates if p.exists()]
if not existing:
    print("OK no SmartPermissionsPanel file found in standard locations. Skipping preset patch.")
    raise SystemExit

p = existing[0]
text = p.read_text()
backup = p.with_suffix(p.suffix + ".backup_hr_permissions")
backup.write_text(text)

hr_admin_permissions = """'hr.view',
  'hr.dashboard',
  'hr.recruitment.view',
  'hr.recruitment.manage',
  'hr.openings.manage',
  'hr.staff.view',
  'hr.staff.manage',
  'hr.onboarding.manage',
  'hr.rosters.manage',
  'hr.attendance.manage',
  'hr.documents.manage',
  'hr.approvals.manage',
  'hr.analytics.view',
  'hr.audit.view',
  'hr.executive.view',
  'hr.settings.manage',
  'hr.admin',
  'page:/hr',
  'page:/hr/operations-console',
  'page:/hr/boardroom',
  'page:/hr/recruitment',
  'page:/hr/staff',
  'page:/hr/documents',
  'page:/hr/attendance',
  'page:/hr/rosters',
  'page:/hr/final-qa'"""

# Try to inject if a preset object exists.
if "hr_admin" in text:
    print(f"OK {p} already appears to include hr_admin preset.")
else:
    if "const ROLE_PRESETS" in text or "ROLE_PRESETS" in text:
        # Find first object literal entry zone by adding a harmless exported constant if risky.
        insertion = f"""
export const HR_PERMISSION_PRESETS = {{
  hr_admin: [
    {hr_admin_permissions}
  ],
  hr_executive: [
    'hr.view',
    'hr.dashboard',
    'hr.analytics.view',
    'hr.audit.view',
    'hr.executive.view',
    'page:/hr',
    'page:/hr/boardroom',
    'page:/hr/enterprise-dashboard'
  ],
  hr_ops: [
    'hr.view',
    'hr.dashboard',
    'hr.staff.view',
    'hr.onboarding.manage',
    'hr.rosters.manage',
    'hr.attendance.manage',
    'hr.documents.manage',
    'page:/hr',
    'page:/hr/operations-console',
    'page:/hr/rosters',
    'page:/hr/attendance'
  ],
  hr_recruiter: [
    'hr.view',
    'hr.dashboard',
    'hr.recruitment.view',
    'hr.recruitment.manage',
    'hr.openings.manage',
    'hr.staff.view',
    'page:/hr',
    'page:/hr/recruitment',
    'page:/hr/openings'
  ],
}} as const
"""
        text = insertion + "\n" + text
        p.write_text(text)
        print(f"OK added HR_PERMISSION_PRESETS export to {p}")
    else:
        print(f"SKIP {p} found, but no obvious preset object. Permissions registry patch is still complete.")
PY

echo "" | tee -a "$REPORT"
echo "Verification:" | tee -a "$REPORT"
grep -n "hr.view\|HR MAX\|hr.executive.view\|hr.admin" lib/auth/permissions.ts | tee -a "$REPORT" || true

echo "" | tee -a "$REPORT"
echo "Now run:" | tee -a "$REPORT"
echo "rm -rf .next" | tee -a "$REPORT"
echo "npm run build" | tee -a "$REPORT"
