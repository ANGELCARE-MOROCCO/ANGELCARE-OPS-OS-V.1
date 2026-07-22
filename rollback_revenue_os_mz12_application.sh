#!/usr/bin/env bash
set -euo pipefail
ROOT="${1:?monorepo path required}"; BACKUP="${2:?backup path required}"
[[ -d "$BACKUP/files" ]] || { echo 'invalid backup'; exit 1; }
if [[ -f "$BACKUP/FILES_ADDED.txt" ]]; then
  while IFS= read -r rel; do [[ -n "$rel" ]] && rm -f "$ROOT/$rel"; done < "$BACKUP/FILES_ADDED.txt"
fi
(cd "$BACKUP/files" && find . -type f -print0 | while IFS= read -r -d '' rel; do rel="${rel#./}"; mkdir -p "$ROOT/$(dirname "$rel")"; cp "$BACKUP/files/$rel" "$ROOT/$rel"; done)
echo '✓ MZ12 application rollback completed.'
