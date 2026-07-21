#!/usr/bin/env bash
set -euo pipefail
ROOT="${1:-}"; ZIP="${2:-}"
if [[ -z "$ROOT" || -z "$ZIP" ]]; then
  echo "Usage: bash apply_revenue_os_mz09.sh /Users/user/Desktop/angelcare-platform /Users/user/Downloads/ANGELCARE_REVENUE_COMMAND_OS_MZ09_COMMANDS_3000.zip" >&2
  exit 64
fi
[[ -d "$ROOT" ]] || { echo "Monorepo directory not found: $ROOT" >&2; exit 65; }
[[ -f "$ZIP" ]] || { echo "MZ09 ZIP not found: $ZIP" >&2; exit 66; }
ROOT="$(cd "$ROOT" && pwd)"; ZIP="$(cd "$(dirname "$ZIP")" && pwd)/$(basename "$ZIP")"
APP="$ROOT/apps/ops-web"
[[ -d "$APP" ]] || { echo "Expected apps/ops-web not found under $ROOT" >&2; exit 67; }
for cmd in unzip node find cp awk; do command -v "$cmd" >/dev/null 2>&1 || { echo "Required command missing: $cmd" >&2; exit 68; }; done
sha256_file(){ if command -v sha256sum >/dev/null 2>&1; then sha256sum "$1"|awk '{print $1}'; elif command -v shasum >/dev/null 2>&1; then shasum -a 256 "$1"|awk '{print $1}'; else echo "No SHA-256 utility found" >&2; return 1; fi; }
SIDE="${ZIP}.sha256"
if [[ -f "$SIDE" ]]; then EXPECTED="$(awk '{print $1}' "$SIDE"|head -1)"; ACTUAL="$(sha256_file "$ZIP")"; [[ "$EXPECTED" == "$ACTUAL" ]] || { echo "Checksum mismatch" >&2; exit 69; }; echo "✓ ZIP checksum verified: $ACTUAL"; else echo "Checksum sidecar not found; ZIP integrity will still be checked." >&2; fi
TMP="$(mktemp -d "${TMPDIR:-/tmp}/angelcare-mz09.XXXXXX")"; trap 'rm -rf "$TMP"' EXIT
unzip -q "$ZIP" -d "$TMP/package"; PKG="$TMP/package"
[[ -f "$PKG/INSTALL_MANIFEST_MZ09.txt" ]] || { echo "INSTALL_MANIFEST_MZ09.txt missing" >&2; exit 70; }
for spec in "1:foundation" "2:digital_twin" "3:doctrine_memory" "4:signal_fabric" "5:command_kernel" "6:golden_300" "7:commands_1000" "8:commands_2000" "9:commands_3000"; do
 phase="${spec%%:*}"; name="${spec#*:}"; f="$PKG/apps/ops-web/supabase/migrations/2026072$([[ $phase == 9 ]] && echo 1 || echo 0)_revenue_command_os_phase${phase}_${name}.sql"
 [[ -f "$f" ]] || { echo "Cumulative migration missing: $f" >&2; exit 71; }
done
# MZ08 prerequisite evidence is restored from the cumulative archive if locally absent.
PREREQS=(
 "apps/ops-web/supabase/migrations/20260720_revenue_command_os_phase8_commands_2000.sql"
 "apps/ops-web/lib/revenue-command-os/command-kernel/commands-2000/commands-2000.commands.json"
 "apps/ops-web/scripts/revenue-command-os/verify-phase8.mjs"
)
for rel in "${PREREQS[@]}"; do [[ -f "$ROOT/$rel" ]] || echo "⚠ Restoring missing cumulative MZ08 prerequisite from archive: $rel"; done
STAMP="$(date +%Y%m%d-%H%M%S)"; BACKUP="$ROOT/backups/revenue-command-os/mz09-$STAMP"
mkdir -p "$BACKUP/files"; : > "$BACKUP/existing-files.txt"; : > "$BACKUP/new-files.txt"
backup_one(){ local rel="$1"; if [[ -f "$ROOT/$rel" || -L "$ROOT/$rel" ]]; then mkdir -p "$BACKUP/files/$(dirname "$rel")"; cp -p "$ROOT/$rel" "$BACKUP/files/$rel"; echo "$rel" >> "$BACKUP/existing-files.txt"; else echo "$rel" >> "$BACKUP/new-files.txt"; fi; }
[[ -f "$ROOT/package.json" ]] && backup_one package.json
[[ -f "$APP/package.json" ]] && backup_one apps/ops-web/package.json
while IFS= read -r rel; do
 [[ -n "$rel" ]] || continue
 [[ -f "$PKG/$rel" ]] || { echo "Manifest file missing: $rel" >&2; exit 72; }
 backup_one "$rel"; mkdir -p "$(dirname "$ROOT/$rel")"; cp -p "$PKG/$rel" "$ROOT/$rel"
done < "$PKG/INSTALL_MANIFEST_MZ09.txt"
# Restore any missing prerequisite not already part of the MZ09 manifest.
for rel in "${PREREQS[@]}"; do if [[ ! -f "$ROOT/$rel" ]]; then backup_one "$rel"; mkdir -p "$(dirname "$ROOT/$rel")"; cp -p "$PKG/$rel" "$ROOT/$rel"; fi; done
touch "$BACKUP/backup-complete.marker"
node "$ROOT/tools/revenue-os/patch-package-scripts-mz09.mjs" "$ROOT"
compiler(){ if command -v tsc >/dev/null 2>&1; then command -v tsc; elif [[ -x "$ROOT/node_modules/.bin/tsc" ]]; then echo "$ROOT/node_modules/.bin/tsc"; elif [[ -x "$APP/node_modules/.bin/tsc" ]]; then echo "$APP/node_modules/.bin/tsc"; else return 1; fi; }
run_phase9(){
 (cd "$APP" && node scripts/revenue-command-os/verify-phase9-cumulative-package.mjs)
 (cd "$APP" && node scripts/revenue-command-os/verify-phase9.mjs)
 (cd "$APP" && node scripts/revenue-command-os/run-phase9-command-tests.mjs)
 (cd "$APP" && node scripts/revenue-command-os/review-phase9-semantic-duplicates.mjs)
 (cd "$APP" && node scripts/revenue-command-os/review-phase9-sql.mjs)
 (cd "$APP" && node scripts/revenue-command-os/transpile-phase9-ui.mjs)
 local tsc_bin; tsc_bin="$(compiler)" || { echo "TypeScript compiler not found" >&2; exit 73; }
 (cd "$APP" && "$tsc_bin" -p tsconfig.revenue-os-phase9-kernel.json --noEmit)
}
if [[ "${REVENUE_OS_INSTALLER_SIMULATION:-0}" == 1 ]]; then
 echo "Installer simulation: MZ09 surgical copy, count, taxonomy, health, SQL, UI and rollback readiness."
 run_phase9
else
 echo "Running complete live cumulative regression MZ01–MZ09..."
 for p in 1 2 3 4 5 6 7 8 9; do [[ -f "$APP/scripts/revenue-command-os/verify-phase${p}.mjs" ]] || { echo "Missing verification script phase $p" >&2; exit 74; }; (cd "$APP" && node "scripts/revenue-command-os/verify-phase${p}.mjs"); done
 (cd "$APP" && node scripts/revenue-command-os/run-phase5-kernel-tests.mjs)
 (cd "$APP" && node scripts/revenue-command-os/run-phase6-golden-tests.mjs)
 (cd "$APP" && node scripts/revenue-command-os/run-phase7-command-tests.mjs)
 (cd "$APP" && node scripts/revenue-command-os/run-phase8-command-tests.mjs)
 (cd "$APP" && node scripts/revenue-command-os/run-phase9-command-tests.mjs)
 (cd "$APP" && node scripts/revenue-command-os/review-phase9-semantic-duplicates.mjs)
 (cd "$APP" && node scripts/revenue-command-os/review-phase9-sql.mjs)
 TSC_BIN="$(compiler)" || { echo "TypeScript compiler not found" >&2; exit 73; }
 (cd "$APP" && "$TSC_BIN" -p tsconfig.revenue-os-phase9-kernel.json --noEmit)
 if [[ "${REVENUE_OS_SKIP_INTEGRATION_TYPECHECK:-0}" != 1 ]]; then (cd "$ROOT" && "$TSC_BIN" -p apps/ops-web/tsconfig.revenue-os-phase9.json --noEmit); fi
 (cd "$APP" && node scripts/revenue-command-os/transpile-phase9-ui.mjs)
fi
cat <<OUT

ANGELCARE Revenue Command OS MZ09 installed successfully.
Backup:
  $BACKUP
Migration to apply manually through psql:
  $ROOT/apps/ops-web/supabase/migrations/20260721_revenue_command_os_phase9_commands_3000.sql
Database helper:
  DATABASE_URL='YOUR_SESSION_POOLER_URL' bash "$ROOT/tools/revenue-os/apply-phase9-migration.sh" "$ROOT"
Application rollback:
  bash "$ROOT/rollback_revenue_os_mz09_application.sh" "$ROOT" "$BACKUP"
Database rollback SQL:
  $ROOT/apps/ops-web/docs/revenue-command-os/phase-09/ROLLBACK.sql
Post-install:
  cd "$ROOT"
  npm run revenue-os:phase09:typecheck
  npm run revenue-os:phase09:verify
  npm run revenue-os:phase09:test
  npm run revenue-os:phase09:typecheck:integration
Route:
  /revenue-command-os/command-kernel
No database migration, Git stage/commit, or production build was performed.
Cumulative library: exactly 3,000 commands. MZ09 new commands: 1,000. External actions remain disabled in Shadow mode.
OUT
