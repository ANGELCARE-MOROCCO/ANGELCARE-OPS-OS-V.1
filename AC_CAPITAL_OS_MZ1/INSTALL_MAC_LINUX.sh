#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
node "$ROOT/scripts/apply_ac_capital_os_mz1.mjs"
node "$ROOT/scripts/verify_ac_capital_os_mz1.mjs"
