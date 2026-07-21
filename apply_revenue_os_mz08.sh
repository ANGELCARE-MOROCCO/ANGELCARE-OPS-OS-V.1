#!/usr/bin/env bash
set -euo pipefail
ROOT="${1:-}"; ZIP="${2:-}"
if [[ -z "$ROOT" || -z "$ZIP" ]]; then
  echo "Usage: bash apply_revenue_os_mz08.sh /Users/user/Desktop/angelcare-platform /Users/user/Downloads/ANGELCARE_REVENUE_COMMAND_OS_MZ08_COMMANDS_2000.zip" >&2
  exit 64
fi
[[ -d "$ROOT" ]] || { echo "Monorepo directory not found: $ROOT" >&2; exit 65; }
[[ -f "$ZIP" ]] || { echo "MZ08 ZIP not found: $ZIP" >&2; exit 66; }
ROOT="$(cd "$ROOT" && pwd)"; ZIP="$(cd "$(dirname "$ZIP")" && pwd)/$(basename "$ZIP")"
APP="$ROOT/apps/ops-web"
[[ -d "$APP" ]] || { echo "Expected apps/ops-web not found under $ROOT" >&2; exit 67; }
for cmd in unzip node find cp awk; do command -v "$cmd" >/dev/null 2>&1 || { echo "Required command missing: $cmd" >&2; exit 68; }; done
sha256_file(){ if command -v sha256sum >/dev/null 2>&1; then sha256sum "$1"|awk '{print $1}'; elif command -v shasum >/dev/null 2>&1; then shasum -a 256 "$1"|awk '{print $1}'; else echo "No SHA-256 utility found" >&2; return 1; fi; }
SIDE="${ZIP}.sha256"
if [[ -f "$SIDE" ]]; then EXPECTED="$(awk '{print $1}' "$SIDE"|head -1)"; ACTUAL="$(sha256_file "$ZIP")"; [[ "$EXPECTED" == "$ACTUAL" ]] || { echo "Checksum mismatch" >&2; exit 69; }; echo "✓ ZIP checksum verified: $ACTUAL"; else echo "Checksum sidecar not found; ZIP integrity will still be checked." >&2; fi
TMP="$(mktemp -d "${TMPDIR:-/tmp}/angelcare-mz08.XXXXXX")"; trap 'rm -rf "$TMP"' EXIT
unzip -q "$ZIP" -d "$TMP/package"; PKG="$TMP/package"
[[ -f "$PKG/INSTALL_MANIFEST_MZ08.txt" ]] || { echo "INSTALL_MANIFEST_MZ08.txt missing" >&2; exit 70; }
# Verify cumulative archive before touching the target.
for spec in \
 "1:foundation" "2:digital_twin" "3:doctrine_memory" "4:signal_fabric" \
 "5:command_kernel" "6:golden_300" "7:commands_1000" "8:commands_2000"; do
  phase="${spec%%:*}"; name="${spec#*:}"
  f="$PKG/apps/ops-web/supabase/migrations/20260720_revenue_command_os_phase${phase}_${name}.sql"
  [[ -f "$f" ]] || { echo "Cumulative migration missing: $f" >&2; exit 71; }
done
# MZ07 prerequisite verification. Missing local evidence is restored from this cumulative archive,
# then validated by the MZ07 suites before MZ08 acceptance.
PREREQS=(
 "apps/ops-web/supabase/migrations/20260720_revenue_command_os_phase7_commands_1000.sql"
 "apps/ops-web/lib/revenue-command-os/command-kernel/commands-1000/commands-1000.commands.json"
 "apps/ops-web/scripts/revenue-command-os/verify-phase7.mjs"
)
for rel in "${PREREQS[@]}"; do
  if [[ ! -f "$ROOT/$rel" ]]; then
    [[ -f "$PKG/$rel" ]] || { echo "MZ07 prerequisite unavailable in target and cumulative package: $rel" >&2; exit 72; }
    echo "⚠ Restoring missing cumulative MZ07 prerequisite: $rel"
  fi
done
STAMP="$(date +%Y%m%d-%H%M%S)"; BACKUP="$ROOT/backups/revenue-command-os/mz08-$STAMP"
mkdir -p "$BACKUP/files"; : > "$BACKUP/existing-files.txt"; : > "$BACKUP/new-files.txt"
backup_one(){ local rel="$1"; if [[ -f "$ROOT/$rel" || -L "$ROOT/$rel" ]]; then mkdir -p "$BACKUP/files/$(dirname "$rel")"; cp -p "$ROOT/$rel" "$BACKUP/files/$rel"; echo "$rel" >> "$BACKUP/existing-files.txt"; else echo "$rel" >> "$BACKUP/new-files.txt"; fi; }
[[ -f "$ROOT/package.json" ]] && backup_one package.json
[[ -f "$APP/package.json" ]] && backup_one apps/ops-web/package.json
while IFS= read -r rel; do
  [[ -n "$rel" ]] || continue
  [[ -f "$PKG/$rel" ]] || { echo "Manifest file missing: $rel" >&2; exit 73; }
  backup_one "$rel"; mkdir -p "$(dirname "$ROOT/$rel")"; cp -p "$PKG/$rel" "$ROOT/$rel"
done < "$PKG/INSTALL_MANIFEST_MZ08.txt"
touch "$BACKUP/backup-complete.marker"
node "$PKG/tools/revenue-os/patch-package-scripts-mz08.mjs" "$ROOT"
compiler(){ if command -v tsc >/dev/null 2>&1; then command -v tsc; elif [[ -x "$ROOT/node_modules/.bin/tsc" ]]; then echo "$ROOT/node_modules/.bin/tsc"; elif [[ -x "$APP/node_modules/.bin/tsc" ]]; then echo "$APP/node_modules/.bin/tsc"; else return 1; fi; }
run_core(){
 (cd "$APP" && node scripts/revenue-command-os/verify-phase8-cumulative-package.mjs)
 for p in 4 5 6 7 8; do (cd "$APP" && node "scripts/revenue-command-os/verify-phase${p}.mjs"); done
 (cd "$APP" && node scripts/revenue-command-os/review-phase7-sql.mjs)
 (cd "$APP" && node scripts/revenue-command-os/review-phase8-sql.mjs)
 local tsc_bin; tsc_bin="$(compiler)" || { echo "TypeScript compiler not found" >&2; exit 74; }
 (cd "$APP" && "$tsc_bin" -p tsconfig.revenue-os-phase8-kernel.json --noEmit)
 (cd "$APP" && node scripts/revenue-command-os/transpile-phase8-ui.mjs)
}

run_simulation_core(){
 (cd "$APP" && node scripts/revenue-command-os/verify-phase8-cumulative-package.mjs)
 (cd "$APP" && node scripts/revenue-command-os/verify-phase8.mjs)
 (cd "$APP" && node scripts/revenue-command-os/review-phase8-sql.mjs)
 (cd "$APP" && node scripts/revenue-command-os/transpile-phase8-ui.mjs)
}
if [[ "${REVENUE_OS_INSTALLER_SIMULATION:-0}" == 1 ]]; then
 echo "Installer simulation: surgical copy, cumulative package, MZ08 static/SQL/UI checks."
 run_simulation_core
else
 echo "Running complete live cumulative regression MZ01–MZ08..."
 for p in 1 2 3 4 5 6 7 8; do [[ -f "$APP/scripts/revenue-command-os/verify-phase${p}.mjs" ]] || { echo "Missing verification script phase $p" >&2; exit 75; }; (cd "$APP" && node "scripts/revenue-command-os/verify-phase${p}.mjs"); done
 (cd "$APP" && node scripts/revenue-command-os/run-phase5-kernel-tests.mjs)
 (cd "$APP" && node scripts/revenue-command-os/run-phase6-golden-tests.mjs)
 (cd "$APP" && node scripts/revenue-command-os/run-phase7-command-tests.mjs)
 (cd "$APP" && node scripts/revenue-command-os/run-phase8-command-tests.mjs)
 (cd "$APP" && node scripts/revenue-command-os/review-phase7-sql.mjs)
 (cd "$APP" && node scripts/revenue-command-os/review-phase8-sql.mjs)
 (cd "$APP" && node scripts/revenue-command-os/review-phase8-semantic-duplicates.mjs >/dev/null)
 TSC_BIN="$(compiler)" || { echo "TypeScript compiler not found" >&2; exit 74; }
 (cd "$APP" && "$TSC_BIN" -p tsconfig.revenue-os-phase8-kernel.json --noEmit)
 if [[ "${REVENUE_OS_SKIP_INTEGRATION_TYPECHECK:-0}" != 1 ]]; then (cd "$ROOT" && "$TSC_BIN" -p apps/ops-web/tsconfig.revenue-os-phase8.json --noEmit); fi
 (cd "$APP" && node scripts/revenue-command-os/transpile-phase8-ui.mjs)
fi
cat <<OUT

ANGELCARE Revenue Command OS MZ08 installed successfully.
Backup:
  $BACKUP
Migration to apply manually through psql:
  $ROOT/apps/ops-web/supabase/migrations/20260720_revenue_command_os_phase8_commands_2000.sql
Database helper:
  DATABASE_URL='YOUR_SESSION_POOLER_URL' bash "$ROOT/tools/revenue-os/apply-phase8-migration.sh" "$ROOT"
Application rollback:
  bash "$ROOT/rollback_revenue_os_mz08_application.sh" "$ROOT" "$BACKUP"
Database rollback SQL:
  $ROOT/apps/ops-web/docs/revenue-command-os/phase-08/ROLLBACK.sql
Post-install:
  cd "$ROOT"
  npm run revenue-os:phase08:typecheck
  npm run revenue-os:phase08:verify
  npm run revenue-os:phase08:test
  npm run revenue-os:phase08:typecheck:integration
Route:
  /revenue-command-os/command-kernel
No database migration, Git stage/commit, or production build was performed.
Cumulative library: 2,000 commands. MZ08 new commands: 1,000. External actions remain disabled in Shadow mode.
OUT
