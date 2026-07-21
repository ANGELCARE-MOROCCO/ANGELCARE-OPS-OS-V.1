#!/usr/bin/env bash
set -euo pipefail
ROOT="${1:?monorepo path required}"; ZIP="${2:?zip required}"
DIR="$(cd "$(dirname "$ZIP")" && pwd)"; BASE="$(basename "$ZIP")"; SUM="$DIR/$BASE.sha256"
[[ -f "$ZIP" && -f "$SUM" ]] || { echo 'ZIP/checksum missing'; exit 1; }
EXPECTED="$(awk '{print $1}' "$SUM")"; ACTUAL="$(shasum -a 256 "$ZIP"|awk '{print $1}')"; [[ "$EXPECTED" == "$ACTUAL" ]] || { echo 'checksum mismatch'; exit 1; }
[[ -d "$ROOT/apps/ops-web" ]] || { echo 'invalid monorepo'; exit 1; }
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT; unzip -q "$ZIP" -d "$TMP/pkg"
[[ -f "$TMP/pkg/apps/ops-web/supabase/migrations/20260721_revenue_command_os_phase9_commands_3000.sql" ]] || { echo 'MZ09 prerequisite absent from cumulative archive'; exit 1; }
BACKUP="$ROOT/.revenue-os-backups/mz10-$(date +%Y%m%d-%H%M%S)"; mkdir -p "$BACKUP/files"; : > "$BACKUP/FILES_ADDED.txt"
while IFS= read -r rel; do [[ -z "$rel" ]] && continue; src="$TMP/pkg/$rel"; dst="$ROOT/$rel"; [[ -f "$src" ]] || continue; if [[ -e "$dst" ]]; then mkdir -p "$BACKUP/files/$(dirname "$rel")"; cp "$dst" "$BACKUP/files/$rel"; else echo "$rel" >> "$BACKUP/FILES_ADDED.txt"; fi; mkdir -p "$(dirname "$dst")"; cp "$src" "$dst"; done < "$TMP/pkg/INSTALL_MANIFEST_MZ10.txt"
if [[ -f "$ROOT/apps/ops-web/package.json" ]]; then node "$ROOT/tools/revenue-os/patch-package-scripts-mz10.mjs" "$ROOT/apps/ops-web/package.json"; fi
(cd "$ROOT/apps/ops-web" && node scripts/revenue-command-os/verify-phase10.mjs && node scripts/revenue-command-os/test-phase10.mjs)
echo "MZ10 installed in Shadow mode. Backup: $BACKUP"
echo "Apply SQL manually: apps/ops-web/supabase/migrations/20260721_revenue_command_os_phase10_strategy_brain.sql"
echo "Rollback: $ROOT/rollback_revenue_os_mz10_application.sh '$ROOT' '$BACKUP'"
