#!/usr/bin/env bash
set -euo pipefail
ROOT="${1:-.}"
cd "$ROOT"
TARGET="components/carelink/ops/missions/CareLinkCreateMissionDossierModal.tsx"
if [ ! -f "$TARGET" ]; then
  echo "Missing $TARGET" >&2
  exit 1
fi
cp "$TARGET" "$TARGET.before-enterprise-modal-upgrade"
echo "Enterprise Create Mission Dossier modal installed. Backup: $TARGET.before-enterprise-modal-upgrade"
