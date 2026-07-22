#!/usr/bin/env bash
set -euo pipefail
EXPECTED_BUNDLE_ID="${1:-com.angelcare.desktop}"
echo "macOS: $(sw_vers -productVersion) ($(uname -m))"
echo "Bundle identifier expected: $EXPECTED_BUNDLE_ID"
command -v profiles >/dev/null && echo "PASS profiles command available" || echo "WARNING profiles command unavailable"
security find-identity -v -p codesigning 2>/dev/null || true
echo "MANUAL: confirm Developer ID signing, notarization, MDM enrollment, supervised/managed status and tested emergency-admin recovery."
echo "Application kiosk mode alone is not Autonomous Single App Mode."
