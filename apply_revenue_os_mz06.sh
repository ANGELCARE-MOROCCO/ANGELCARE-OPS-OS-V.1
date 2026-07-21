#!/usr/bin/env bash
set -euo pipefail
ROOT="${1:-}"
ZIP="${2:-}"
if [[ -z "$ROOT" || -z "$ZIP" ]]; then
  echo "Usage: bash apply_revenue_os_mz06.sh /Users/user/Desktop/angelcare-platform /Users/user/Downloads/ANGELCARE_REVENUE_COMMAND_OS_MZ06_GOLDEN_300.zip" >&2
  exit 64
fi
[[ -d "$ROOT" ]] || { echo "Monorepo directory not found: $ROOT" >&2; exit 65; }
[[ -f "$ZIP" ]] || { echo "MZ06 ZIP not found: $ZIP" >&2; exit 66; }
ROOT="$(cd "$ROOT" && pwd)"
ZIP="$(cd "$(dirname "$ZIP")" && pwd)/$(basename "$ZIP")"
[[ -d "$ROOT/apps/ops-web" ]] || { echo "Expected apps/ops-web not found under $ROOT" >&2; exit 67; }
for cmd in unzip node find cp; do command -v "$cmd" >/dev/null 2>&1 || { echo "Required command missing: $cmd" >&2; exit 68; }; done

sha256_file(){
  if command -v sha256sum >/dev/null 2>&1; then sha256sum "$1" | awk '{print $1}'
  elif command -v shasum >/dev/null 2>&1; then shasum -a 256 "$1" | awk '{print $1}'
  else echo "No SHA-256 utility found (sha256sum or shasum)." >&2; return 1
  fi
}
SIDE="${ZIP}.sha256"
if [[ -f "$SIDE" ]]; then
  EXPECTED="$(awk '{print $1}' "$SIDE" | head -1)"
  ACTUAL="$(sha256_file "$ZIP")"
  [[ "$EXPECTED" == "$ACTUAL" ]] || { echo "Checksum mismatch for $ZIP" >&2; exit 69; }
  echo "✓ ZIP checksum verified: $ACTUAL"
else
  echo "Checksum sidecar not found beside ZIP; continuing with archive integrity checks." >&2
fi

# MZ05 must already exist in the target, as signed by the user.
for prereq in \
  apps/ops-web/supabase/migrations/20260720_revenue_command_os_phase5_command_kernel.sql \
  apps/ops-web/lib/revenue-command-os/command-kernel/types.ts \
  apps/ops-web/scripts/revenue-command-os/verify-phase5.mjs; do
  [[ -f "$ROOT/$prereq" ]] || { echo "MZ05 prerequisite missing from target: $prereq" >&2; exit 70; }
done

TMP="$(mktemp -d "${TMPDIR:-/tmp}/angelcare-mz06.XXXXXX")"
trap 'rm -rf "$TMP"' EXIT
unzip -q "$ZIP" -d "$TMP/package"
PKG="$TMP/package"
[[ -f "$PKG/INSTALL_MANIFEST_MZ06.txt" ]] || { echo "INSTALL_MANIFEST_MZ06.txt missing from ZIP" >&2; exit 71; }

for prereq in \
  apps/ops-web/supabase/migrations/20260720_revenue_command_os_phase1_foundation.sql \
  apps/ops-web/supabase/migrations/20260720_revenue_command_os_phase2_digital_twin.sql \
  apps/ops-web/supabase/migrations/20260720_revenue_command_os_phase3_doctrine_memory.sql \
  apps/ops-web/supabase/migrations/20260720_revenue_command_os_phase4_signal_fabric.sql \
  apps/ops-web/supabase/migrations/20260720_revenue_command_os_phase5_command_kernel.sql \
  apps/ops-web/supabase/migrations/20260720_revenue_command_os_phase6_golden_300.sql; do
  [[ -f "$PKG/$prereq" ]] || { echo "Cumulative prerequisite missing from ZIP: $prereq" >&2; exit 72; }
done

STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP="$ROOT/backups/revenue-command-os/mz06-$STAMP"
mkdir -p "$BACKUP/files"
: > "$BACKUP/existing-files.txt"
: > "$BACKUP/new-files.txt"
backup_one(){
  local rel="$1"
  if [[ -f "$ROOT/$rel" || -L "$ROOT/$rel" ]]; then
    mkdir -p "$BACKUP/files/$(dirname "$rel")"
    cp -p "$ROOT/$rel" "$BACKUP/files/$rel"
    echo "$rel" >> "$BACKUP/existing-files.txt"
  else
    echo "$rel" >> "$BACKUP/new-files.txt"
  fi
}
[[ -f "$ROOT/package.json" ]] && backup_one package.json
[[ -f "$ROOT/apps/ops-web/package.json" ]] && backup_one apps/ops-web/package.json

while IFS= read -r rel; do
  [[ -n "$rel" ]] || continue
  [[ -f "$PKG/$rel" ]] || { echo "Manifest references missing package file: $rel" >&2; exit 73; }
  backup_one "$rel"
  mkdir -p "$(dirname "$ROOT/$rel")"
  cp -p "$PKG/$rel" "$ROOT/$rel"
done < "$PKG/INSTALL_MANIFEST_MZ06.txt"
touch "$BACKUP/backup-complete.marker"

node "$PKG/tools/revenue-os/patch-package-scripts.mjs" "$ROOT"
APP="$ROOT/apps/ops-web"

run_core_checks(){
  (cd "$APP" && node scripts/revenue-command-os/verify-phase6-cumulative-package.mjs)
  (cd "$APP" && node scripts/revenue-command-os/verify-phase4.mjs)
  (cd "$APP" && node scripts/revenue-command-os/verify-phase5.mjs)
  (cd "$APP" && node scripts/revenue-command-os/verify-phase6.mjs)
  (cd "$APP" && node scripts/revenue-command-os/run-phase5-kernel-tests.mjs)
  (cd "$APP" && node scripts/revenue-command-os/run-phase6-golden-tests.mjs)
  if command -v tsc >/dev/null 2>&1; then
    (cd "$APP" && tsc -p tsconfig.revenue-os-phase6-kernel.json --noEmit)
  elif [[ -x "$ROOT/node_modules/.bin/tsc" ]]; then
    (cd "$APP" && "$ROOT/node_modules/.bin/tsc" -p tsconfig.revenue-os-phase6-kernel.json --noEmit)
  elif [[ -x "$APP/node_modules/.bin/tsc" ]]; then
    (cd "$APP" && "$APP/node_modules/.bin/tsc" -p tsconfig.revenue-os-phase6-kernel.json --noEmit)
  else
    echo "TypeScript compiler not found." >&2
    exit 74
  fi
  (cd "$APP" && node scripts/revenue-command-os/transpile-phase6-ui.mjs)
}

if [[ "${REVENUE_OS_INSTALLER_SIMULATION:-0}" == "1" ]]; then
  echo "Installer simulation mode: checking cumulative package, MZ04–MZ06, corpora, TypeScript and rollback assets."
  run_core_checks
else
  echo "Running complete live cumulative regression MZ01–MZ06..."
  for phase in 1 2 3 4 5 6; do
    script="$APP/scripts/revenue-command-os/verify-phase${phase}.mjs"
    [[ -f "$script" ]] || { echo "Missing verification script: $script" >&2; exit 75; }
    (cd "$APP" && node "scripts/revenue-command-os/verify-phase${phase}.mjs")
  done
  (cd "$APP" && node scripts/revenue-command-os/run-phase5-kernel-tests.mjs)
  (cd "$APP" && node scripts/revenue-command-os/run-phase6-golden-tests.mjs)
  if command -v tsc >/dev/null 2>&1; then
    (cd "$APP" && tsc -p tsconfig.revenue-os-phase6-kernel.json --noEmit)
    if [[ "${REVENUE_OS_SKIP_INTEGRATION_TYPECHECK:-0}" != "1" ]]; then
      (cd "$ROOT" && tsc -p apps/ops-web/tsconfig.revenue-os-phase6.json --noEmit)
    fi
  elif [[ -x "$ROOT/node_modules/.bin/tsc" ]]; then
    (cd "$APP" && "$ROOT/node_modules/.bin/tsc" -p tsconfig.revenue-os-phase6-kernel.json --noEmit)
    if [[ "${REVENUE_OS_SKIP_INTEGRATION_TYPECHECK:-0}" != "1" ]]; then
      (cd "$ROOT" && "$ROOT/node_modules/.bin/tsc" -p apps/ops-web/tsconfig.revenue-os-phase6.json --noEmit)
    fi
  elif [[ -x "$APP/node_modules/.bin/tsc" ]]; then
    (cd "$APP" && "$APP/node_modules/.bin/tsc" -p tsconfig.revenue-os-phase6-kernel.json --noEmit)
    if [[ "${REVENUE_OS_SKIP_INTEGRATION_TYPECHECK:-0}" != "1" ]]; then
      (cd "$APP" && "$APP/node_modules/.bin/tsc" -p tsconfig.revenue-os-phase6.json --noEmit)
    fi
  else
    echo "TypeScript compiler not found." >&2
    exit 74
  fi
  (cd "$APP" && node scripts/revenue-command-os/transpile-phase6-ui.mjs)
fi

cat <<OUT

ANGELCARE Revenue Command OS MZ06 installed successfully.

Backup:
  $BACKUP

Migration to apply manually in Supabase SQL Editor:
  $ROOT/apps/ops-web/supabase/migrations/20260720_revenue_command_os_phase6_golden_300.sql

Application rollback:
  bash "$ROOT/rollback_revenue_os_mz06_application.sh" "$ROOT" "$BACKUP"

Database rollback SQL (manual only):
  $ROOT/apps/ops-web/docs/revenue-command-os/phase-06/ROLLBACK.sql

Post-install commands:
  cd "$ROOT"
  npm run revenue-os:phase06:typecheck
  npm run revenue-os:phase06:verify
  npm run revenue-os:phase06:test
  npm run revenue-os:phase06:typecheck:integration

Development route:
  /revenue-command-os/command-kernel

No database migration was applied.
No Git files were staged or committed.
No production build was run.
Golden commands: 300.
External actions remain disabled in Shadow mode.
OUT
