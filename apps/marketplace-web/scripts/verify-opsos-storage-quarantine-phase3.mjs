import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const required = [
  "components/opsos/windows-node/StorageDataControlCenter.tsx",
  "components/opsos/windows-node/StorageExplorerPhase2.tsx",
  "components/opsos/windows-node/StorageQuarantinePhase3.tsx",
  "components/email-os-core/ScopedMailboxCommandCenter.tsx",
  "app/api/storage/download/[fileId]/route.ts",
  "app/api/opsos/windows-node/storage/quarantine/route.ts",
  "app/api/opsos/windows-node/storage/quarantine/impact/route.ts",
  "app/api/opsos/windows-node/storage/quarantine/[caseId]/route.ts",
  "app/api/opsos/windows-node/storage/quarantine/[caseId]/approve/route.ts",
  "app/api/opsos/windows-node/storage/quarantine/[caseId]/execute/route.ts",
  "app/api/opsos/windows-node/storage/quarantine/[caseId]/restore/route.ts",
  "app/api/opsos/windows-node/storage/quarantine/[caseId]/extend/route.ts",
  "app/api/opsos/windows-node/storage/quarantine/policies/route.ts",
  "lib/opsos/storage-quarantine.ts",
  "lib/opsos/windows-node-types.ts",
  "supabase/migrations/20260719_opsos_storage_quarantine_phase3.sql",
  "bridge/windows-email-bridge/server.js",
  "bridge/windows-email-bridge/deploy-storage-quarantine-phase3-update.ps1",
]

for (const relative of required) {
  if (!fs.existsSync(path.join(root, relative))) throw new Error(`Phase 3 required file missing: ${relative}`)
}

const ui = fs.readFileSync(path.join(root, "components/opsos/windows-node/StorageQuarantinePhase3.tsx"), "utf8")
const parent = fs.readFileSync(path.join(root, "components/opsos/windows-node/StorageDataControlCenter.tsx"), "utf8")
const explorer = fs.readFileSync(path.join(root, "components/opsos/windows-node/StorageExplorerPhase2.tsx"), "utf8")
const mailbox = fs.readFileSync(path.join(root, "components/email-os-core/ScopedMailboxCommandCenter.tsx"), "utf8")
const download = fs.readFileSync(path.join(root, "app/api/storage/download/[fileId]/route.ts"), "utf8")
const bridge = fs.readFileSync(path.join(root, "bridge/windows-email-bridge/server.js"), "utf8")
const migration = fs.readFileSync(path.join(root, "supabase/migrations/20260719_opsos_storage_quarantine_phase3.sql"), "utf8")
const types = fs.readFileSync(path.join(root, "lib/opsos/windows-node-types.ts"), "utf8")

const uiContracts = [
  "Phase 3 · Intervention réversible",
  "Quarantaine & restauration",
  "Suppression définitive interdite",
  "Créer le dossier de quarantaine",
  "Analyse d’impact",
  "Restauration terminée et intégrité vérifiée",
  "/api/opsos/windows-node/storage/quarantine",
  "aucune suppression automatique",
]
for (const value of uiContracts) if (!ui.includes(value)) throw new Error(`Phase 3 UI contract missing: ${value}`)
if (!parent.includes("<StorageQuarantinePhase3")) throw new Error("StorageDataControlCenter does not mount Phase 3")
if (!explorer.includes("Analyser pour quarantaine Phase 3")) throw new Error("Phase 2 → Phase 3 handoff missing")
if (!mailbox.includes("Pièce jointe en quarantaine")) throw new Error("Email OS quarantine placeholder missing")
if (!download.includes("STORAGE_FILE_QUARANTINED") || !download.includes("status: 423")) throw new Error("Quarantined attachment download guard missing")

const bridgeContracts = [
  'pathname === "/admin/storage/quarantine/impact"',
  'pathname === "/admin/storage/quarantine/execute"',
  'pathname === "/admin/storage/quarantine/status"',
  'pathname === "/admin/storage/quarantine/restore"',
  'pathname === "/admin/storage/quarantine/verify"',
  "quarantineToken",
  "parseQuarantineToken",
  "quarantineBlockedReason",
  "Post-quarantine integrity verification failed",
  "A different file exists at the original destination",
  "reversible: true",
]
for (const value of bridgeContracts) if (!bridge.includes(value)) throw new Error(`Phase 3 bridge contract missing: ${value}`)

const dbContracts = [
  "opsos_storage_quarantine_cases",
  "opsos_storage_quarantine_items",
  "opsos_storage_quarantine_references",
  "opsos_storage_restore_jobs",
  "opsos_storage_quarantine_events",
  "opsos_storage_quarantine_policies",
  "opsos_storage_legal_holds",
  "Permanent deletion is deliberately unsupported",
]
for (const value of dbContracts) if (!migration.includes(value)) throw new Error(`Phase 3 database contract missing: ${value}`)

const typeContracts = [
  "WindowsStorageQuarantineImpact",
  "WindowsStorageQuarantineCase",
  "WindowsStorageQuarantinePolicy",
  "WindowsStorageQuarantineJobResult",
  "approvalsRequired",
  "secondApprovedBy",
]
for (const value of typeContracts) if (!types.includes(value)) throw new Error(`Phase 3 type contract missing: ${value}`)

const quarantineRoutes = required.filter((item) => item.includes("/quarantine/") && item.endsWith("route.ts"))
for (const relative of quarantineRoutes) {
  const content = fs.readFileSync(path.join(root, relative), "utf8")
  if (/export\s+async\s+function\s+DELETE\b/.test(content)) throw new Error(`Permanent delete method detected in Phase 3 route: ${relative}`)
}
if (ui.includes("Vider la quarantaine") || ui.includes("Purger maintenant")) throw new Error("Permanent purge action detected in Phase 3 UI")

console.log("OPSOS Storage & Data Phase 3 quarantine and recovery verified.")
