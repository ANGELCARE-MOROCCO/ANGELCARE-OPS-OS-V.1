#!/usr/bin/env bash
set -euo pipefail
rm -rf "app/(protected)/carelink"
echo "Removed old protected CareLink route. CareLink now lives at app/carelink."
