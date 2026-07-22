#!/usr/bin/env bash
set -euo pipefail
ROOT="${1:?monorepo path required}"
bash "$ROOT/tools/revenue-os/apply-phase16-migration.sh" "$ROOT"
echo '✓ MZ16 database migration and verification completed.'
