#!/usr/bin/env bash
set -euo pipefail
ROOT="${1:-/Users/user/Desktop/angelcare-platform}"
exec "$ROOT/tools/revenue-os/apply-phase10-migration.sh" "$ROOT"
