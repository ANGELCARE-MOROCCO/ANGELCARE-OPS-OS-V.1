#!/usr/bin/env bash
set -euo pipefail
APP_PATH="${1:-/Applications/ANGELCARE Desktop.app}"
[[ -d "$APP_PATH" ]] || { echo "Application not found: $APP_PATH" >&2; exit 2; }
PLIST="$HOME/Library/LaunchAgents/com.angelcare.desktop.login.plist";mkdir -p "$(dirname "$PLIST")"
cat > "$PLIST" <<PLIST
<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd"><plist version="1.0"><dict><key>Label</key><string>com.angelcare.desktop.login</string><key>ProgramArguments</key><array><string>/usr/bin/open</string><string>-a</string><string>$APP_PATH</string></array><key>RunAtLoad</key><true/><key>KeepAlive</key><false/></dict></plist>
PLIST
plutil -lint "$PLIST";echo "LaunchAgent written: $PLIST";echo "No MDM or system-security settings were changed."
