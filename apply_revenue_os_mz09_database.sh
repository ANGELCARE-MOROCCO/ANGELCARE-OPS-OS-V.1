#!/usr/bin/env bash
set -euo pipefail
ROOT="${1:-/Users/user/Desktop/angelcare-platform}"
exec bash "$ROOT/tools/revenue-os/apply-phase9-migration.sh" "$ROOT"
