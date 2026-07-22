#!/usr/bin/env bash
set -euo pipefail
ROOT="${1:?monorepo path required}"
BACKUP="${2:?backup path required}"
[[ -d "$ROOT" && -d "$BACKUP" ]] || { echo 'invalid root or backup'; exit 1; }
if [[ -d "$BACKUP/files" ]]; then
  (cd "$BACKUP/files" && find . -type f -print0) | while IFS= read -r -d '' rel; do rel="${rel#./}"; mkdir -p "$ROOT/$(dirname "$rel")"; cp "$BACKUP/files/$rel" "$ROOT/$rel"; done
fi
if [[ -f "$BACKUP/FILES_ADDED.txt" ]]; then while IFS= read -r rel; do [[ -z "$rel" ]] || rm -f "$ROOT/$rel"; done < "$BACKUP/FILES_ADDED.txt"; fi
echo '✓ MZ15 application files rolled back. Database rollback remains a separate governed operation.'
