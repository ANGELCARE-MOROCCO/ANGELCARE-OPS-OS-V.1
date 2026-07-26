import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const required = [
  "components/whatsapp-os/StationLockSafetyPanel.tsx",
  "components/whatsapp-os/CorporateStationAdmin.tsx",
  "lib/desktop-stations/lock-safety.ts",
  "lib/whatsapp-desktop/control-plane.ts",
  "lib/whatsapp-desktop/control-plane-server.ts",
  "app/api/desktop-stations/assignments/route.ts",
  "app/api/desktop-stations/devices/[id]/lock-rescue/route.ts",
  "app/api/desktop-stations/admin/lock-safety/route.ts",
  "app/api/desktop-stations/admin/fleet-safe-mode/route.ts",
  "supabase/migrations/20260726_desktop_lockout_safety_control_plane_mz16.sql",
]
for (const file of required) if (!fs.existsSync(path.join(root, file))) throw new Error(`MZ16_MISSING:${file}`)
const read = (file) => fs.readFileSync(path.join(root, file), "utf8")
const checks = [
  ["components/whatsapp-os/StationLockSafetyPanel.tsx", "Activer le mode sûr flotte"],
  ["components/whatsapp-os/StationLockSafetyPanel.tsx", "Libérer ce poste"],
  ["lib/desktop-stations/lock-safety.ts", "MINIMUM_SAFE_LOCKED_DESKTOP_VERSION = \"1.7.4\""],
  ["lib/desktop-stations/lock-safety.ts", "desktop_station_queue_lock_rescue_mz16"],
  ["supabase/migrations/20260726_desktop_lockout_safety_control_plane_mz16.sql", "ENTER_STANDARD_MODE"],
  ["supabase/migrations/20260726_desktop_lockout_safety_control_plane_mz16.sql", "UNLOCK_TEMPORARILY"],
  ["app/api/desktop-stations/assignments/route.ts", "LOCKED_MODE_CLIENT_NOT_CERTIFIED"],
  ["lib/whatsapp-desktop/control-plane.ts", "LOCKED_MODE_UNLOCK_PROTOCOL_UNSAFE"],
  ["lib/whatsapp-desktop/control-plane-server.ts", "MZ16_LOCKOUT_PREVENTION"],
  ["supabase/migrations/20260726_desktop_lockout_safety_control_plane_mz16.sql", "desktop_station_lock_rescue_runs"],
  ["components/whatsapp-os/WhatsAppDesktopAdmin.tsx", "Protection anti-verrouillage MZ16"],
]
for (const [file, marker] of checks) if (!read(file).includes(marker)) throw new Error(`MZ16_MARKER_MISSING:${file}:${marker}`)
console.log("MZ16_DESKTOP_LOCKOUT_SAFETY_CONTROL_PLANE_VERIFIED")
console.log("Corporate Locked safety gate, per-device rescue, fleet safe mode, command correlation, lockout reset and rescue evidence are present under /whatsapp-os/admin.")
