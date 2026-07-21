#!/usr/bin/env bash
set -euo pipefail
ROOT="${1:-}";BACKUP="${2:-}"
if [[ -z "$ROOT" || -z "$BACKUP" ]]; then echo "Usage: bash rollback_revenue_os_mz07_application.sh /path/to/angelcare-platform /path/to/mz07-backup" >&2;exit 64;fi
ROOT="$(cd "$ROOT" && pwd)";BACKUP="$(cd "$BACKUP" && pwd)"
[[ -f "$BACKUP/backup-complete.marker" ]] || { echo "Invalid or incomplete MZ07 backup: $BACKUP" >&2;exit 65; }
if [[ -f "$BACKUP/new-files.txt" ]]; then while IFS= read -r rel;do [[ -n "$rel" ]]||continue;target="$ROOT/$rel";if [[ -f "$target" || -L "$target" ]];then rm -f "$target";fi;done < "$BACKUP/new-files.txt";fi
if [[ -d "$BACKUP/files" ]];then (cd "$BACKUP/files"&&find . -type f -print0)|while IFS= read -r -d '' item;do rel="${item#./}";mkdir -p "$(dirname "$ROOT/$rel")";cp -p "$BACKUP/files/$rel" "$ROOT/$rel";done;fi
printf '
MZ07 application rollback restored from:
  %s
' "$BACKUP"
printf 'Database was not changed by this script. Apply phase-07/ROLLBACK.sql manually only if required.
'
