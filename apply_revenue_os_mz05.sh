#!/usr/bin/env bash
set -euo pipefail
ROOT="${1:-}"
ZIP="${2:-}"
if [[ -z "$ROOT" || -z "$ZIP" ]]; then
  echo "Usage: bash apply_revenue_os_mz05.sh /Users/user/Desktop/angelcare-platform /Users/user/Downloads/ANGELCARE_REVENUE_COMMAND_OS_MZ05_COMMAND_KERNEL.zip" >&2
  exit 64
fi
[[ -d "$ROOT" ]] || { echo "Monorepo directory not found: $ROOT" >&2; exit 65; }
[[ -f "$ZIP" ]] || { echo "MZ05 ZIP not found: $ZIP" >&2; exit 66; }
ROOT="$(cd "$ROOT" && pwd)"
ZIP="$(cd "$(dirname "$ZIP")" && pwd)/$(basename "$ZIP")"
[[ -d "$ROOT/apps/ops-web" ]] || { echo "Expected apps/ops-web not found under $ROOT" >&2; exit 67; }
for cmd in unzip node find cp; do command -v "$cmd" >/dev/null 2>&1 || { echo "Required command missing: $cmd" >&2; exit 68; }; done
sha256_file(){ if command -v sha256sum >/dev/null 2>&1; then sha256sum "$1" | awk '{print $1}'; elif command -v shasum >/dev/null 2>&1; then shasum -a 256 "$1" | awk '{print $1}'; else echo "No SHA-256 utility found (sha256sum or shasum)." >&2; return 1; fi; }
SIDE="${ZIP}.sha256"
if [[ -f "$SIDE" ]]; then
  EXPECTED="$(awk '{print $1}' "$SIDE" | head -1)"
  ACTUAL="$(sha256_file "$ZIP")"
  [[ "$EXPECTED" == "$ACTUAL" ]] || { echo "Checksum mismatch for $ZIP" >&2; exit 69; }
  echo "✓ ZIP checksum verified: $ACTUAL"
fi
TMP="$(mktemp -d "${TMPDIR:-/tmp}/angelcare-mz05.XXXXXX")"
trap 'rm -rf "$TMP"' EXIT
unzip -q "$ZIP" -d "$TMP/package"
PKG="$TMP/package"
[[ -f "$PKG/INSTALL_MANIFEST_MZ05.txt" ]] || { echo "INSTALL_MANIFEST_MZ05.txt missing from ZIP" >&2; exit 70; }
for prereq in \
  apps/ops-web/supabase/migrations/20260720_revenue_command_os_phase1_foundation.sql \
  apps/ops-web/supabase/migrations/20260720_revenue_command_os_phase2_digital_twin.sql \
  apps/ops-web/supabase/migrations/20260720_revenue_command_os_phase3_doctrine_memory.sql \
  apps/ops-web/supabase/migrations/20260720_revenue_command_os_phase4_signal_fabric.sql; do
  [[ -f "$PKG/$prereq" ]] || { echo "Cumulative prerequisite missing from ZIP: $prereq" >&2; exit 71; }
done
STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP="$ROOT/backups/revenue-command-os/mz05-$STAMP"
mkdir -p "$BACKUP/files"
: > "$BACKUP/existing-files.txt"
: > "$BACKUP/new-files.txt"
backup_one(){ local rel="$1"; if [[ -f "$ROOT/$rel" || -L "$ROOT/$rel" ]]; then mkdir -p "$BACKUP/files/$(dirname "$rel")"; cp -p "$ROOT/$rel" "$BACKUP/files/$rel"; echo "$rel" >> "$BACKUP/existing-files.txt"; else echo "$rel" >> "$BACKUP/new-files.txt"; fi; }
# package manifests are modified surgically after file copy
[[ -f "$ROOT/package.json" ]] && backup_one package.json
[[ -f "$ROOT/apps/ops-web/package.json" ]] && backup_one apps/ops-web/package.json
while IFS= read -r rel; do
  [[ -n "$rel" ]] || continue
  [[ -f "$PKG/$rel" ]] || { echo "Manifest references missing package file: $rel" >&2; exit 72; }
  backup_one "$rel"
  mkdir -p "$(dirname "$ROOT/$rel")"
  cp -p "$PKG/$rel" "$ROOT/$rel"
done < "$PKG/INSTALL_MANIFEST_MZ05.txt"
touch "$BACKUP/backup-complete.marker"
node "$PKG/tools/revenue-os/patch-package-scripts.mjs" "$ROOT"

APP="$ROOT/apps/ops-web"
echo ""
if [[ "${REVENUE_OS_INSTALLER_SIMULATION:-0}" == "1" ]]; then
  echo "Installer simulation mode: validating MZ05 copy, backup, package patch, static acceptance and corpus."
  (cd "$APP" && node scripts/revenue-command-os/verify-phase5.mjs)
  (cd "$APP" && node scripts/revenue-command-os/run-phase5-kernel-tests.mjs)
else
  echo "Running cumulative static acceptance MZ01–MZ05..."
  for phase in 1 2 3 4 5; do
    script="$APP/scripts/revenue-command-os/verify-phase${phase}.mjs"
    [[ -f "$script" ]] || { echo "Missing verification script: $script" >&2; exit 73; }
    (cd "$APP" && node "scripts/revenue-command-os/verify-phase${phase}.mjs")
  done

  echo "Running MZ05 evaluation corpus..."
  (cd "$APP" && node scripts/revenue-command-os/run-phase5-kernel-tests.mjs)

  echo "Running targeted TypeScript verification (no build)..."
  if command -v tsc >/dev/null 2>&1; then
    (cd "$ROOT" && tsc -p apps/ops-web/tsconfig.revenue-os-phase5.json --noEmit)
  elif [[ -x "$ROOT/node_modules/.bin/tsc" ]]; then
    (cd "$ROOT" && "$ROOT/node_modules/.bin/tsc" -p apps/ops-web/tsconfig.revenue-os-phase5.json --noEmit)
  elif [[ -x "$APP/node_modules/.bin/tsc" ]]; then
    (cd "$APP" && "$APP/node_modules/.bin/tsc" -p tsconfig.revenue-os-phase5.json --noEmit)
  else
    echo "TypeScript compiler not found. Static acceptance passed, but targeted typecheck must be run after dependencies are installed." >&2
    exit 74
  fi
fi

cat <<OUT

ANGELCARE Revenue Command OS MZ05 installed successfully.

Backup:
  $BACKUP

Migration to apply manually in Supabase SQL Editor:
  $ROOT/apps/ops-web/supabase/migrations/20260720_revenue_command_os_phase5_command_kernel.sql

Application rollback:
  bash "$ROOT/rollback_revenue_os_mz05_application.sh" "$ROOT" "$BACKUP"

Database rollback SQL (manual only):
  $ROOT/apps/ops-web/docs/revenue-command-os/phase-05/ROLLBACK.sql

Post-install commands:
  cd "$ROOT"
  npm run revenue-os:phase05:typecheck
  npm run revenue-os:phase05:verify
  npm run revenue-os:phase05:test

Development route:
  /revenue-command-os/command-kernel

No database migration was applied.
No Git files were staged or committed.
No production build was run.
External actions remain disabled in Shadow mode.
OUT
