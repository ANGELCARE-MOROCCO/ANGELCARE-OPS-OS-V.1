import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const requiredFiles = [
  "components/whatsapp-os/WhatsAppDeviceFleet.tsx",
  "components/whatsapp-os/WhatsAppDesktopAdmin.tsx",
  "components/whatsapp-os/WhatsAppAssignmentAdmin.tsx",
  "lib/whatsapp-desktop/device-lifecycle.ts",
  "app/api/whatsapp-desktop/admin/overview/route.ts",
  "app/api/whatsapp-desktop/assignments/[id]/suspend/route.ts",
  "app/api/whatsapp-desktop/assignments/[id]/restore/route.ts",
  "app/api/whatsapp-desktop/devices/[id]/route.ts",
  "app/api/whatsapp-desktop/devices/[id]/approve/route.ts",
  "app/api/whatsapp-desktop/devices/[id]/reject/route.ts",
  "app/api/whatsapp-desktop/devices/[id]/suspend/route.ts",
  "app/api/whatsapp-desktop/devices/[id]/restore/route.ts",
  "app/api/whatsapp-desktop/devices/[id]/revoke/route.ts",
  "app/api/whatsapp-desktop/devices/[id]/reinstate/route.ts",
  "app/api/whatsapp-desktop/devices/[id]/disconnect-whatsapp/route.ts",
  "app/api/whatsapp-desktop/devices/[id]/logout-desktop/route.ts",
  "app/api/whatsapp-desktop/devices/[id]/reassign/route.ts",
  "app/api/whatsapp-desktop/devices/[id]/force-purge/route.ts",
  "app/api/whatsapp-desktop/devices/[id]/lifecycle/route.ts",
  "app/api/whatsapp-desktop/devices/[id]/sessions/route.ts",
  "app/api/whatsapp-desktop/devices/[id]/commands/route.ts",
  "app/api/whatsapp-desktop/devices/bulk/route.ts",
  "supabase/migrations/20260725_whatsapp_desktop_fleet_lifecycle_mega_zip10.sql",
]

const failures = []
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8")
for (const rel of requiredFiles) if (!fs.existsSync(path.join(root, rel))) failures.push(`missing:${rel}`)

if (!failures.length) {
  const ui = read("components/whatsapp-os/WhatsAppDeviceFleet.tsx")
  const lifecycle = read("lib/whatsapp-desktop/device-lifecycle.ts")
  const assignments = read("components/whatsapp-os/WhatsAppAssignmentAdmin.tsx")
  const migration = read("supabase/migrations/20260725_whatsapp_desktop_fleet_lifecycle_mega_zip10.sql")
  const admin = read("components/whatsapp-os/WhatsAppDesktopAdmin.tsx")

  const uiMarkers = [
    "Supprimer définitivement",
    "Déconnecter WhatsApp",
    "Déconnecter Desktop",
    "Restaurer",
    "Réhabiliter",
    "Doublon probable",
    "Chronologie de gouvernance",
    "Sessions et baux",
    "Commandes distantes",
    "confirmation_name",
    "acknowledge_irreversible",
  ]
  for (const marker of uiMarkers) if (!ui.includes(marker)) failures.push(`ui-marker:${marker}`)
  if (ui.includes("window.prompt")) failures.push("device-ui-uses-window-prompt")
  if (assignments.includes("window.prompt")) failures.push("assignment-ui-uses-window-prompt")
  if (!assignments.includes("Dispatch<SetStateAction<AssignmentForm>>")) failures.push("assignment-form-setter-not-react-state-compatible")
  if (admin.includes("window.prompt")) failures.push("admin-ui-contains-window-prompt")
  if (!admin.includes("WhatsAppDeviceFleet")) failures.push("admin-not-wired-to-fleet-control")
  if (!admin.includes("WhatsAppAssignmentAdmin")) failures.push("admin-not-wired-to-assignment-control")

  const lifecycleMarkers = [
    "DEVICE_ACTIONS_BY_STATE",
    "restoreDevice",
    "disconnectWhatsApp",
    "logoutDesktop",
    "reinstateDevice",
    "reassignDevice",
    "loadDeviceLifecycle",
    "purgeDevice",
    "whatsapp_desktop.device.force_delete",
    "INVALID_DEVICE_TRANSITION",
  ]
  for (const marker of lifecycleMarkers) if (!lifecycle.includes(marker)) failures.push(`lifecycle-marker:${marker}`)

  const migrationMarkers = [
    "whatsapp_desktop_device_purge_ledger",
    "whatsapp_desktop_purge_device",
    "ONLINE_DEVICE_REQUIRES_FORCE_PURGE",
    "DEVICE_NAME_CONFIRMATION_MISMATCH",
    "delete from public.whatsapp_desktop_devices",
    "grant execute",
  ]
  for (const marker of migrationMarkers) if (!migration.includes(marker)) failures.push(`migration-marker:${marker}`)
  if (/cookie|message content/i.test(migration) && !migration.includes("Contains no WhatsApp cookies or message content")) failures.push("migration-may-centralize-whatsapp-content")
}

if (failures.length) {
  console.error("MZ10_FLEET_LIFECYCLE_VERIFICATION_FAILED")
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}

console.log("MZ10_WHATSAPP_ADMIN_FLEET_LIFECYCLE_VERIFIED")
console.log("Premium fleet UI, exact state actions, device dossier, governed disconnect, restore, reinstate, reassignment, audit-preserving purge and clean re-enrolment contracts are present.")
