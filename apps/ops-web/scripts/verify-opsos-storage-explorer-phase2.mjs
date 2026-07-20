import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const requiredFiles = [
  "components/opsos/windows-node/StorageDataControlCenter.tsx",
  "components/opsos/windows-node/StorageExplorerPhase2.tsx",
  "components/opsos/windows-node/WindowsNodeControlCenter.tsx",
  "app/api/opsos/windows-node/storage/inventory/route.ts",
  "app/api/opsos/windows-node/storage/browse/route.ts",
  "app/api/opsos/windows-node/storage/file/route.ts",
  "app/api/opsos/windows-node/storage/preview/route.ts",
  "app/api/opsos/windows-node/storage/email/route.ts",
  "app/api/opsos/windows-node/storage/duplicates/route.ts",
  "app/api/opsos/windows-node/storage/orphans/route.ts",
  "app/api/opsos/windows-node/storage/export/route.ts",
  "lib/opsos/windows-node-types.ts",
  "bridge/windows-email-bridge/server.js",
  "bridge/windows-email-bridge/deploy-storage-explorer-phase2-update.ps1",
]

for (const relative of requiredFiles) {
  const file = path.join(root, relative)
  if (!fs.existsSync(file)) throw new Error(`Required Phase 2 file missing: ${relative}`)
}

const explorer = fs.readFileSync(path.join(root, "components/opsos/windows-node/StorageExplorerPhase2.tsx"), "utf8")
const storage = fs.readFileSync(path.join(root, "components/opsos/windows-node/StorageDataControlCenter.tsx"), "utf8")
const bridge = fs.readFileSync(path.join(root, "bridge/windows-email-bridge/server.js"), "utf8")
const types = fs.readFileSync(path.join(root, "lib/opsos/windows-node-types.ts"), "utf8")

const uiContracts = [
  "Phase 2 · Exploration sécurisée",
  "Aucune suppression autorisée",
  "Explorateur, traçabilité et aperçu sécurisé",
  "Pièces jointes Email OS",
  "Messages",
  "Fichiers volumineux",
  "Doublons",
  "Orphelins",
  "Sources & synchronisation",
  "/api/opsos/windows-node/storage/browse",
  "/api/opsos/windows-node/storage/file",
  "/api/opsos/windows-node/storage/preview",
  "/api/opsos/windows-node/storage/email",
  "/api/opsos/windows-node/storage/duplicates",
  "/api/opsos/windows-node/storage/orphans",
  "/api/opsos/windows-node/storage/export",
]
for (const contract of uiContracts) {
  if (!explorer.includes(contract)) throw new Error(`Phase 2 UI contract missing: ${contract}`)
}

if (!storage.includes("<StorageExplorerPhase2")) throw new Error("StorageDataControlCenter does not mount Phase 2 explorer")

const bridgeContracts = [
  'pathname === "/admin/storage/inventory"',
  'pathname === "/admin/storage/browse"',
  'pathname === "/admin/storage/file"',
  'pathname === "/admin/storage/preview"',
  'pathname === "/admin/storage/duplicates"',
  'pathname === "/admin/storage/orphans"',
  "resolveExplorerPath",
  "storagePreviewKind",
  "isWithinRoot",
  "readOnly: true",
]
for (const contract of bridgeContracts) {
  if (!bridge.includes(contract)) throw new Error(`Bridge Phase 2 contract missing: ${contract}`)
}

const typeContracts = [
  "WindowsStorageBrowseResult",
  "WindowsStorageFileDossier",
  "WindowsStoragePreviewResult",
  "WindowsStorageEmailInvestigationResult",
  "WindowsStorageDuplicateInvestigation",
  "WindowsStorageOrphanInvestigation",
]
for (const contract of typeContracts) {
  if (!types.includes(contract)) throw new Error(`Phase 2 type contract missing: ${contract}`)
}

const destructiveUiPatterns = [
  '/api/opsos/windows-node/storage/delete',
  '/api/opsos/windows-node/storage/quarantine',
  'method: "DELETE"',
  "Supprimer définitivement",
  "Mettre en quarantaine",
]
for (const pattern of destructiveUiPatterns) {
  if (explorer.includes(pattern)) throw new Error(`Destructive Phase 2 UI contract detected: ${pattern}`)
}

console.log("OPSOS Storage & Data Phase 2 explorer verified.")
