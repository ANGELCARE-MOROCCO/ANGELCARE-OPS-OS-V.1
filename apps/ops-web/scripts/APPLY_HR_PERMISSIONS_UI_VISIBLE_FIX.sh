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

REPORT="HR_PERMISSIONS_UI_VISIBLE_FIX_REPORT.txt"
: > "$REPORT"

echo "HR Permissions UI Visible Fix" | tee -a "$REPORT"
echo "App root: $APP_ROOT" | tee -a "$REPORT"
echo "Date: $(date)" | tee -a "$REPORT"
echo "" | tee -a "$REPORT"

TARGET="app/(protected)/users/_components/SmartPermissionsPanel.tsx"

if [ ! -f "$TARGET" ]; then
  echo "ERROR: $TARGET not found." | tee -a "$REPORT"
  exit 1
fi

cp "$TARGET" "$TARGET.backup_hr_ui_visible_$(date +%Y%m%d_%H%M%S)"
echo "Backup created for $TARGET" | tee -a "$REPORT"

python3 - <<'PY' | tee -a "$REPORT"
from pathlib import Path

p = Path("app/(protected)/users/_components/SmartPermissionsPanel.tsx")
text = p.read_text()

if "const HR_CORE_PERMISSION_OPTIONS" not in text:
    insert_after_type = """type SmartPermissionsPanelProps = {
  corePermissions: PermissionOption[]
  pagePermissions: PermissionOption[]
  defaultPermissions?: string[]
}
"""
    hr_block = """
const HR_CORE_PERMISSION_OPTIONS: PermissionOption[] = [
  { value: 'hr.view', label: 'Voir HR MAX', module: 'hr', moduleLabel: 'HR MAX' },
  { value: 'hr.dashboard', label: 'Dashboard HR', module: 'hr', moduleLabel: 'HR MAX' },
  { value: 'hr.recruitment.view', label: 'Voir recrutement', module: 'hr', moduleLabel: 'HR MAX' },
  { value: 'hr.recruitment.manage', label: 'Gérer recrutement', module: 'hr', moduleLabel: 'HR MAX' },
  { value: 'hr.openings.manage', label: 'Gérer postes ouverts', module: 'hr', moduleLabel: 'HR MAX' },
  { value: 'hr.staff.view', label: 'Voir Staff 360', module: 'hr', moduleLabel: 'HR MAX' },
  { value: 'hr.staff.manage', label: 'Gérer Staff 360', module: 'hr', moduleLabel: 'HR MAX' },
  { value: 'hr.onboarding.manage', label: 'Gérer onboarding', module: 'hr', moduleLabel: 'HR MAX' },
  { value: 'hr.rosters.manage', label: 'Gérer rosters/planning', module: 'hr', moduleLabel: 'HR MAX' },
  { value: 'hr.attendance.manage', label: 'Gérer attendance', module: 'hr', moduleLabel: 'HR MAX' },
  { value: 'hr.documents.manage', label: 'Gérer documents HR', module: 'hr', moduleLabel: 'HR MAX' },
  { value: 'hr.approvals.manage', label: 'Gérer approvals HR', module: 'hr', moduleLabel: 'HR MAX' },
  { value: 'hr.analytics.view', label: 'Voir analytics HR', module: 'hr', moduleLabel: 'HR MAX' },
  { value: 'hr.audit.view', label: 'Voir audit HR', module: 'hr', moduleLabel: 'HR MAX' },
  { value: 'hr.executive.view', label: 'Voir Boardroom HR', module: 'hr', moduleLabel: 'HR MAX' },
  { value: 'hr.settings.manage', label: 'Gérer settings HR', module: 'hr', moduleLabel: 'HR MAX' },
  { value: 'hr.admin', label: 'Admin HR complet', module: 'hr', moduleLabel: 'HR MAX' },
]

const HR_PAGE_PERMISSION_OPTIONS: PermissionOption[] = [
  { value: 'page:/hr', label: 'HR MAX', module: 'hr-pages', moduleLabel: 'HR MAX Pages', href: '/hr' },
  { value: 'page:/hr/operations-console', label: 'HR Operations Console', module: 'hr-pages', moduleLabel: 'HR MAX Pages', href: '/hr/operations-console' },
  { value: 'page:/hr/boardroom', label: 'HR Boardroom', module: 'hr-pages', moduleLabel: 'HR MAX Pages', href: '/hr/boardroom' },
  { value: 'page:/hr/recruitment', label: 'HR Recruitment', module: 'hr-pages', moduleLabel: 'HR MAX Pages', href: '/hr/recruitment' },
  { value: 'page:/hr/recruitment/candidates', label: 'HR Candidates', module: 'hr-pages', moduleLabel: 'HR MAX Pages', href: '/hr/recruitment/candidates' },
  { value: 'page:/hr/openings', label: 'HR Openings', module: 'hr-pages', moduleLabel: 'HR MAX Pages', href: '/hr/openings' },
  { value: 'page:/hr/staff', label: 'HR Staff 360', module: 'hr-pages', moduleLabel: 'HR MAX Pages', href: '/hr/staff' },
  { value: 'page:/hr/staff/new', label: 'HR New Staff', module: 'hr-pages', moduleLabel: 'HR MAX Pages', href: '/hr/staff/new' },
  { value: 'page:/hr/onboarding', label: 'HR Onboarding', module: 'hr-pages', moduleLabel: 'HR MAX Pages', href: '/hr/onboarding' },
  { value: 'page:/hr/rosters', label: 'HR Rosters', module: 'hr-pages', moduleLabel: 'HR MAX Pages', href: '/hr/rosters' },
  { value: 'page:/hr/attendance', label: 'HR Attendance', module: 'hr-pages', moduleLabel: 'HR MAX Pages', href: '/hr/attendance' },
  { value: 'page:/hr/documents', label: 'HR Documents', module: 'hr-pages', moduleLabel: 'HR MAX Pages', href: '/hr/documents' },
  { value: 'page:/hr/approvals', label: 'HR Approvals', module: 'hr-pages', moduleLabel: 'HR MAX Pages', href: '/hr/approvals' },
  { value: 'page:/hr/tasks', label: 'HR Tasks', module: 'hr-pages', moduleLabel: 'HR MAX Pages', href: '/hr/tasks' },
  { value: 'page:/hr/final-qa', label: 'HR Final QA', module: 'hr-pages', moduleLabel: 'HR MAX Pages', href: '/hr/final-qa' },
]

function mergePermissionOptions(base: PermissionOption[], extra: PermissionOption[]) {
  const byValue = new Map<string, PermissionOption>()
  for (const item of base) byValue.set(item.value, item)
  for (const item of extra) {
    if (!byValue.has(item.value)) byValue.set(item.value, item)
  }
  return Array.from(byValue.values())
}

"""
    if insert_after_type not in text:
        raise SystemExit("Could not find SmartPermissionsPanelProps block.")
    text = text.replace(insert_after_type, insert_after_type + hr_block)
    print("OK inserted HR option constants and merge helper")
else:
    print("OK HR option constants already present")

# Add HR presets into PRESETS object
if "hr_admin:" not in text:
    preset_marker = "const PRESETS: Record<string, string[]> = {"
    hr_presets = """const PRESETS: Record<string, string[]> = {
  hr_admin: [
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
    'page:/hr',
    'page:/hr/operations-console',
    'page:/hr/boardroom',
    'page:/hr/recruitment',
    'page:/hr/recruitment/candidates',
    'page:/hr/openings',
    'page:/hr/staff',
    'page:/hr/staff/new',
    'page:/hr/onboarding',
    'page:/hr/rosters',
    'page:/hr/attendance',
    'page:/hr/documents',
    'page:/hr/approvals',
    'page:/hr/tasks',
    'page:/hr/final-qa',
  ],
  hr_executive: [
    'hr.view',
    'hr.dashboard',
    'hr.analytics.view',
    'hr.audit.view',
    'hr.executive.view',
    'page:/hr',
    'page:/hr/boardroom',
    'page:/hr/enterprise-dashboard',
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
    'page:/hr/staff',
    'page:/hr/rosters',
    'page:/hr/attendance',
    'page:/hr/documents',
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
    'page:/hr/recruitment/candidates',
    'page:/hr/openings',
  ],"""
    if preset_marker not in text:
        raise SystemExit("Could not find PRESETS object.")
    text = text.replace(preset_marker, hr_presets)
    print("OK inserted HR presets")
else:
    print("OK HR presets already present")

# Replace usage to include merged arrays
old_fn = "export default function SmartPermissionsPanel({ corePermissions, pagePermissions, defaultPermissions = [] }: SmartPermissionsPanelProps) {"
if old_fn in text and "mergedCorePermissions" not in text:
    text = text.replace(
        old_fn,
        old_fn + """
  const mergedCorePermissions = useMemo(
    () => mergePermissionOptions(corePermissions, HR_CORE_PERMISSION_OPTIONS),
    [corePermissions]
  )
  const mergedPagePermissions = useMemo(
    () => mergePermissionOptions(pagePermissions, HR_PAGE_PERMISSION_OPTIONS),
    [pagePermissions]
  )
"""
    )
    text = text.replace("const coreGroups = useMemo(() => groupByModule(corePermissions), [corePermissions])", "const coreGroups = useMemo(() => groupByModule(mergedCorePermissions), [mergedCorePermissions])")
    text = text.replace("const pageGroups = useMemo(() => groupByModule(pagePermissions), [pagePermissions])", "const pageGroups = useMemo(() => groupByModule(mergedPagePermissions), [mergedPagePermissions])")
    text = text.replace("const allCoreValues = corePermissions.map((item) => item.value)", "const allCoreValues = mergedCorePermissions.map((item) => item.value)")
    text = text.replace("const allPageValues = pagePermissions.map((item) => item.value)", "const allPageValues = mergedPagePermissions.map((item) => item.value)")
    print("OK switched panel to merged HR-aware permissions")
elif "mergedCorePermissions" in text:
    print("OK merged HR-aware permissions already active")
else:
    raise SystemExit("Could not patch SmartPermissionsPanel function")

# Open HR groups by default
text = text.replace(
    "new Set(['Users', 'Market OS', 'Revenue Command Center', 'Leads', 'Missions'])",
    "new Set(['Users', 'Market OS', 'Revenue Command Center', 'Leads', 'Missions', 'HR MAX', 'HR MAX Pages'])"
)

# Add preset buttons
if "Preset HR Admin" not in text:
    text = text.replace(
        "<button type=\"button\" style={lightButtonStyle} onClick={() => applyPreset('manager')}>Preset Manager</button>",
        "<button type=\"button\" style={lightButtonStyle} onClick={() => applyPreset('manager')}>Preset Manager</button>\n        <button type=\"button\" style={lightButtonStyle} onClick={() => applyPreset('hr_admin')}>Preset HR Admin</button>\n        <button type=\"button\" style={lightButtonStyle} onClick={() => applyPreset('hr_executive')}>Preset HR Executive</button>\n        <button type=\"button\" style={lightButtonStyle} onClick={() => applyPreset('hr_ops')}>Preset HR Ops</button>"
    )
    text = text.replace("gridTemplateColumns: '1fr auto auto auto'", "gridTemplateColumns: '1fr repeat(6, auto)'")
    print("OK added HR preset buttons")
else:
    print("OK HR preset buttons already present")

p.write_text(text)
print("OK wrote SmartPermissionsPanel HR UI patch")
PY

echo "" | tee -a "$REPORT"
echo "Verification snippets:" | tee -a "$REPORT"
grep -n "HR_CORE_PERMISSION_OPTIONS\|Preset HR Admin\|HR MAX Pages\|mergedCorePermissions" "$TARGET" | tee -a "$REPORT" || true

echo "" | tee -a "$REPORT"
echo "Now run:" | tee -a "$REPORT"
echo "rm -rf .next" | tee -a "$REPORT"
echo "npm run build" | tee -a "$REPORT"
