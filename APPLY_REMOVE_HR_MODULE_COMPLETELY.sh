#!/usr/bin/env bash
set -euo pipefail

ROOT="$(pwd)"
if [ ! -f "$ROOT/package.json" ]; then
  echo "ERROR: Run this script from your app root (where package.json exists)."
  exit 1
fi

STAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_DIR="$ROOT/_REMOVED_HR_MODULE_BACKUP_$STAMP"
REPORT="$ROOT/HR_REMOVAL_REPORT_$STAMP.txt"
mkdir -p "$BACKUP_DIR"

echo "HR module removal started at $STAMP" | tee "$REPORT"
echo "Backup folder: $BACKUP_DIR" | tee -a "$REPORT"
echo "" | tee -a "$REPORT"

move_if_exists() {
  local target="$1"
  if [ -e "$ROOT/$target" ]; then
    mkdir -p "$BACKUP_DIR/$(dirname "$target")"
    mv "$ROOT/$target" "$BACKUP_DIR/$target"
    echo "REMOVED: $target" | tee -a "$REPORT"
  fi
}

# 1) Remove HR app routes and API routes.
move_if_exists "app/(protected)/hr"
move_if_exists "app/api/hr"
move_if_exists "app/api/hr-v2"
move_if_exists "app/api/hr-v2-max"

# 2) Remove HR components and libraries.
move_if_exists "app/components/hr"
move_if_exists "components/hr"
move_if_exists "components/hr-v2"
move_if_exists "components/hr-v2-max"
move_if_exists "lib/hr"
move_if_exists "lib/hr-v2"
move_if_exists "lib/hr-v2-max"

# 3) Remove known HR backup folders that still contain routes/components and can confuse scans.
for d in .hr_v2_max_backup_* .hr_*_backup_* hr_backup_* HR_BACKUP_*; do
  if [ -e "$ROOT/$d" ]; then
    mv "$ROOT/$d" "$BACKUP_DIR/$d"
    echo "REMOVED BACKUP TRACE: $d" | tee -a "$REPORT"
  fi
done

# 4) Patch global navigation references that expose HR entry points.
python3 - <<'PY'
from pathlib import Path
import re

root = Path.cwd()
patches = []

def patch_file(path: Path, transforms):
    if not path.exists():
        return
    original = path.read_text(errors='ignore')
    updated = original
    for transform in transforms:
        updated = transform(updated)
    if updated != original:
        path.write_text(updated)
        patches.append(str(path))

# Remove the common AppShell HR OS single-line nav item.
def remove_hr_single_line_nav(text: str) -> str:
    lines = []
    for line in text.splitlines():
        compact = line.replace('"', "'")
        if "href: '/hr'" in compact and ("HR" in line or "human resources" in line.lower() or "hr.view" in line):
            continue
        if "href='/hr'" in compact or 'href="/hr"' in line:
            continue
        lines.append(line)
    return "\n".join(lines) + ("\n" if text.endswith("\n") else "")

# Remove permission menu rows for HR when they are single-line objects.
def remove_hr_permission_rows(text: str) -> str:
    lines = []
    for line in text.splitlines():
        compact = line.replace('"', "'")
        if "href: '/hr'" in compact or "permission: 'hr." in compact or "permission: \"hr." in line:
            continue
        lines.append(line)
    return "\n".join(lines) + ("\n" if text.endswith("\n") else "")

for rel in [
    "app/components/erp/AppShell.tsx",
    "permissions.ts",
    "lib/auth/permissions.ts",
    "lib/generated/app-routes.ts",
]:
    patch_file(root / rel, [remove_hr_single_line_nav, remove_hr_permission_rows])

# Remove direct imports/usages of HRTimeClockWidget or components/hr that may remain in layouts.
for path in list(root.glob("app/**/*.tsx")) + list(root.glob("components/**/*.tsx")):
    if "node_modules" in path.parts or ".next" in path.parts:
        continue
    if not path.exists():
        continue
    text = path.read_text(errors='ignore')
    if "HRTimeClockWidget" not in text and "components/hr" not in text and "/hr/" not in text and "'/hr'" not in text and '"/hr"' not in text:
        continue
    original = text
    # Remove import lines for HR widgets/components.
    text = re.sub(r"^.*HRTimeClockWidget.*$\n?", "", text, flags=re.M)
    text = re.sub(r"^.*components/hr.*$\n?", "", text, flags=re.M)
    # Remove JSX self-closing HRTimeClockWidget usage.
    text = re.sub(r"\s*<HRTimeClockWidget[^>]*/>\s*", "", text)
    if text != original:
        path.write_text(text)
        patches.append(str(path))

print("\n".join(sorted(set(patches))))
PY

echo "" | tee -a "$REPORT"
echo "Patched navigation/reference files:" | tee -a "$REPORT"
# Re-run a quick check for patched files timestamp is hard; use remaining trace report below.

# 5) Produce remaining HR trace report. This does NOT fail the script; it tells you what still mentions HR textually.
echo "" | tee -a "$REPORT"
echo "Remaining /hr route traces outside backup, node_modules and .next:" | tee -a "$REPORT"
if command -v grep >/dev/null 2>&1; then
  grep -RIn --exclude-dir=node_modules --exclude-dir=.next --exclude-dir="$(basename "$BACKUP_DIR")" \
    -e "href: ['\"]\/hr" -e "href=['\"]\/hr" -e "\/hr\/" -e "permission: ['\"]hr\." \
    app components lib permissions.ts 2>/dev/null | tee -a "$REPORT" || true
fi

echo "" | tee -a "$REPORT"
echo "DONE. HR routes/API/components/libs were moved to backup, not permanently destroyed." | tee -a "$REPORT"
echo "Now run:" | tee -a "$REPORT"
echo "rm -rf .next" | tee -a "$REPORT"
echo "NODE_OPTIONS=\"--max-old-space-size=8192\" npm run build" | tee -a "$REPORT"
