#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-}"
ZIP="${2:-}"

if [[ -z "$ROOT" || -z "$ZIP" ]]; then
  echo "Usage: bash apply_revenue_os_mz07.sh /Users/user/Desktop/angelcare-platform /Users/user/Downloads/ANGELCARE_REVENUE_COMMAND_OS_MZ07_COMMANDS_1000.zip" >&2
  exit 64
fi

[[ -d "$ROOT" ]] || { echo "Monorepo directory not found: $ROOT" >&2; exit 65; }
[[ -f "$ZIP" ]] || { echo "MZ07 ZIP not found: $ZIP" >&2; exit 66; }

ROOT="$(cd "$ROOT" && pwd)"
ZIP="$(cd "$(dirname "$ZIP")" && pwd)/$(basename "$ZIP")"
APP="$ROOT/apps/ops-web"
[[ -d "$APP" ]] || { echo "Expected apps/ops-web not found under $ROOT" >&2; exit 67; }

for cmd in unzip node find cp awk; do
  command -v "$cmd" >/dev/null 2>&1 || { echo "Required command missing: $cmd" >&2; exit 68; }
done

sha256_file() {
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$1" | awk '{print $1}'
  elif command -v shasum >/dev/null 2>&1; then
    shasum -a 256 "$1" | awk '{print $1}'
  else
    echo "No SHA-256 utility found." >&2
    return 1
  fi
}

SIDE="${ZIP}.sha256"
if [[ -f "$SIDE" ]]; then
  EXPECTED="$(awk '{print $1}' "$SIDE" | head -1)"
  ACTUAL="$(sha256_file "$ZIP")"
  [[ "$EXPECTED" == "$ACTUAL" ]] || { echo "Checksum mismatch" >&2; exit 69; }
  echo "✓ ZIP checksum verified: $ACTUAL"
else
  echo "Checksum sidecar not found; archive integrity will still be checked." >&2
fi

PREREQUISITES=(
  "apps/ops-web/supabase/migrations/20260720_revenue_command_os_phase6_golden_300.sql"
  "apps/ops-web/lib/revenue-command-os/command-kernel/golden-300/golden-300.commands.json"
  "apps/ops-web/scripts/revenue-command-os/verify-phase6.mjs"
)
for prereq in "${PREREQUISITES[@]}"; do
  [[ -f "$ROOT/$prereq" ]] || { echo "MZ06 prerequisite missing from target: $prereq" >&2; exit 70; }
done

TMP="$(mktemp -d "${TMPDIR:-/tmp}/angelcare-mz07.XXXXXX")"
trap 'rm -rf "$TMP"' EXIT
unzip -q "$ZIP" -d "$TMP/package"
PKG="$TMP/package"
[[ -f "$PKG/INSTALL_MANIFEST_MZ07.txt" ]] || { echo "INSTALL_MANIFEST_MZ07.txt missing" >&2; exit 71; }

for phase in 1 2 3 4 5 6 7; do
  case "$phase" in
    1) name="foundation" ;;
    2) name="digital_twin" ;;
    3) name="doctrine_memory" ;;
    4) name="signal_fabric" ;;
    5) name="command_kernel" ;;
    6) name="golden_300" ;;
    7) name="commands_1000" ;;
  esac
  migration="$PKG/apps/ops-web/supabase/migrations/20260720_revenue_command_os_phase${phase}_${name}.sql"
  [[ -f "$migration" ]] || { echo "Cumulative migration missing: $migration" >&2; exit 72; }
done

STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP="$ROOT/backups/revenue-command-os/mz07-$STAMP"
mkdir -p "$BACKUP/files"
: > "$BACKUP/existing-files.txt"
: > "$BACKUP/new-files.txt"

backup_one() {
  local rel="$1"
  if [[ -f "$ROOT/$rel" || -L "$ROOT/$rel" ]]; then
    mkdir -p "$BACKUP/files/$(dirname "$rel")"
    cp -p "$ROOT/$rel" "$BACKUP/files/$rel"
    echo "$rel" >> "$BACKUP/existing-files.txt"
  else
    echo "$rel" >> "$BACKUP/new-files.txt"
  fi
}

[[ -f "$ROOT/package.json" ]] && backup_one "package.json"
[[ -f "$APP/package.json" ]] && backup_one "apps/ops-web/package.json"

while IFS= read -r rel; do
  [[ -n "$rel" ]] || continue
  [[ -f "$PKG/$rel" ]] || { echo "Manifest file missing: $rel" >&2; exit 73; }
  backup_one "$rel"
  mkdir -p "$(dirname "$ROOT/$rel")"
  cp -p "$PKG/$rel" "$ROOT/$rel"
done < "$PKG/INSTALL_MANIFEST_MZ07.txt"
touch "$BACKUP/backup-complete.marker"

node "$PKG/tools/revenue-os/patch-package-scripts.mjs" "$ROOT"

compiler() {
  if command -v tsc >/dev/null 2>&1; then
    command -v tsc
  elif [[ -x "$ROOT/node_modules/.bin/tsc" ]]; then
    echo "$ROOT/node_modules/.bin/tsc"
  elif [[ -x "$APP/node_modules/.bin/tsc" ]]; then
    echo "$APP/node_modules/.bin/tsc"
  else
    return 1
  fi
}

run_phase7_core() {
  (cd "$APP" && node scripts/revenue-command-os/verify-phase7-cumulative-package.mjs)
  (cd "$APP" && node scripts/revenue-command-os/verify-phase4.mjs)
  (cd "$APP" && node scripts/revenue-command-os/verify-phase5.mjs)
  (cd "$APP" && node scripts/revenue-command-os/verify-phase6.mjs)
  (cd "$APP" && node scripts/revenue-command-os/verify-phase7.mjs)
  (cd "$APP" && node scripts/revenue-command-os/run-phase5-kernel-tests.mjs)
  (cd "$APP" && node scripts/revenue-command-os/run-phase6-golden-tests.mjs)
  (cd "$APP" && node scripts/revenue-command-os/run-phase7-command-tests.mjs)
  (cd "$APP" && node scripts/revenue-command-os/review-phase7-semantic-duplicates.mjs)
  (cd "$APP" && node scripts/revenue-command-os/review-phase7-sql.mjs)
  local tsc_bin
  tsc_bin="$(compiler)" || { echo "TypeScript compiler not found" >&2; exit 74; }
  (cd "$APP" && "$tsc_bin" -p tsconfig.revenue-os-phase7-kernel.json --noEmit)
  (cd "$APP" && node scripts/revenue-command-os/transpile-phase7-ui.mjs)
}

if [[ "${REVENUE_OS_INSTALLER_SIMULATION:-0}" == "1" ]]; then
  echo "Installer simulation: MZ04–MZ07 plus cumulative corpora."
  run_phase7_core
else
  echo "Running complete live cumulative regression MZ01–MZ07..."
  for phase in 1 2 3 4 5 6 7; do
    script="$APP/scripts/revenue-command-os/verify-phase${phase}.mjs"
    [[ -f "$script" ]] || { echo "Missing verification script $script" >&2; exit 75; }
    (cd "$APP" && node "scripts/revenue-command-os/verify-phase${phase}.mjs")
  done
  (cd "$APP" && node scripts/revenue-command-os/run-phase5-kernel-tests.mjs)
  (cd "$APP" && node scripts/revenue-command-os/run-phase6-golden-tests.mjs)
  (cd "$APP" && node scripts/revenue-command-os/run-phase7-command-tests.mjs)
  (cd "$APP" && node scripts/revenue-command-os/review-phase7-semantic-duplicates.mjs)
  (cd "$APP" && node scripts/revenue-command-os/review-phase7-sql.mjs)
  TSC_BIN="$(compiler)" || { echo "TypeScript compiler not found" >&2; exit 74; }
  (cd "$APP" && "$TSC_BIN" -p tsconfig.revenue-os-phase7-kernel.json --noEmit)
  if [[ "${REVENUE_OS_SKIP_INTEGRATION_TYPECHECK:-0}" != "1" ]]; then
    (cd "$ROOT" && "$TSC_BIN" -p apps/ops-web/tsconfig.revenue-os-phase7.json --noEmit)
  fi
  (cd "$APP" && node scripts/revenue-command-os/transpile-phase7-ui.mjs)
fi

cat <<OUT

ANGELCARE Revenue Command OS MZ07 installed successfully.
Backup:
  $BACKUP
Migration to apply manually through psql:
  $ROOT/apps/ops-web/supabase/migrations/20260720_revenue_command_os_phase7_commands_1000.sql
Application rollback:
  bash "$ROOT/rollback_revenue_os_mz07_application.sh" "$ROOT" "$BACKUP"
Database rollback SQL:
  $ROOT/apps/ops-web/docs/revenue-command-os/phase-07/ROLLBACK.sql
Post-install commands:
  cd "$ROOT"
  npm run revenue-os:phase07:typecheck
  npm run revenue-os:phase07:verify
  npm run revenue-os:phase07:test
  npm run revenue-os:phase07:typecheck:integration
Development route:
  /revenue-command-os/command-kernel
No database migration was applied. No Git files were staged or committed. No production build was run.
Golden 300 preserved. New commands: 700. Cumulative library: 1,000. External actions remain disabled in Shadow mode.
OUT
