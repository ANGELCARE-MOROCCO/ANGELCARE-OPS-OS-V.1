#!/usr/bin/env bash
set -euo pipefail
ROOT="${1:?monorepo path required}"
exec "$ROOT/tools/revenue-os/apply-phase13-migration.sh" "$ROOT"
