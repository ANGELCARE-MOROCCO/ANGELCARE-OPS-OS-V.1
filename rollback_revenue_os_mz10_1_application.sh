#!/usr/bin/env bash
set -euo pipefail
ROOT="${1:-}"; BACKUP="${2:-}"
[[ -d "$ROOT" && -d "$BACKUP" ]] || { echo "Usage: $0 <monorepo> <backup_dir>"; exit 2; }
if [[ -f "$BACKUP/FILES_ADDED.txt" ]]; then while IFS= read -r rel; do [[ -n "$rel" ]] && rm -f "$ROOT/$rel"; done < "$BACKUP/FILES_ADDED.txt"; fi
if [[ -d "$BACKUP/files" ]]; then (cd "$BACKUP/files" && find . -type f -print0) | while IFS= read -r -d '' rel; do rel="${rel#./}"; mkdir -p "$(dirname "$ROOT/$rel")"; cp "$BACKUP/files/$rel" "$ROOT/$rel"; done; fi
echo "MZ10.1 application rollback complete. Database rollback remains explicit and separate."
