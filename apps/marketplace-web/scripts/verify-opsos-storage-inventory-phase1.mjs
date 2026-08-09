import fs from "node:fs"
import path from "node:path"
import { createRequire } from "node:module"

const root = process.cwd()
const files = {
  control: path.join(root, "components/opsos/windows-node/WindowsNodeControlCenter.tsx"),
  storage: path.join(root, "components/opsos/windows-node/StorageDataControlCenter.tsx"),
  route: path.join(root, "app/api/opsos/windows-node/storage/inventory/route.ts"),
  types: path.join(root, "lib/opsos/windows-node-types.ts"),
  bridge: path.join(root, "bridge/windows-email-bridge/server.js"),
  deploy: path.join(root, "bridge/windows-email-bridge/deploy-storage-inventory-update.ps1"),
}

for (const [label, file] of Object.entries(files)) {
  if (!fs.existsSync(file)) throw new Error(`${label} missing: ${file}`)
}

const control = fs.readFileSync(files.control, "utf8")
const storage = fs.readFileSync(files.storage, "utf8")
const route = fs.readFileSync(files.route, "utf8")
const types = fs.readFileSync(files.types, "utf8")
const bridge = fs.readFileSync(files.bridge, "utf8")

for (const contract of [
  'id: "storage", label: "Stockage & données"',
  "<StorageDataControlCenter />",
  'activeSection === "storage"',
]) {
  if (!control.includes(contract)) throw new Error(`Control center contract missing: ${contract}`)
}

for (const contract of [
  "Phase 1 · Inventaire en lecture seule",
  "Analyse approfondie",
  "Fichiers volumineux",
  "Doublons potentiels",
  "Orphelins potentiels",
  "Sources & synchronisation",
  "/api/opsos/windows-node/storage/inventory",
  "Aucune suppression autorisée",
]) {
  if (!storage.includes(contract)) throw new Error(`Storage workspace contract missing: ${contract}`)
}

for (const forbidden of [
  '/api/opsos/windows-node/storage/delete',
  '/api/opsos/windows-node/storage/quarantine',
  'fetch("/admin/storage/delete',
]) {
  if (storage.includes(forbidden)) throw new Error(`Destructive Phase 1 UI contract detected: ${forbidden}`)
}

for (const contract of [
  'callWindowsBridgeAdmin<WindowsStorageInventory>',
  "/admin/storage/inventory",
  "readOnly",
]) {
  if (!route.includes(contract)) throw new Error(`Inventory API contract missing: ${contract}`)
}

for (const contract of [
  "export interface WindowsStorageInventory",
  "WindowsStorageDuplicateGroup",
  "WindowsStorageOrphanCandidate",
  "readOnly: true",
]) {
  if (!types.includes(contract)) throw new Error(`Storage type contract missing: ${contract}`)
}

for (const contract of [
  "async function handleStorageInventory",
  "async function buildStorageInventory",
  'pathname === "/admin/storage/inventory"',
  "STORAGE_INVENTORY_MAX_FILES",
  "duplicateRecoverableBytes",
  "orphanCandidates",
  "readOnly: true",
]) {
  if (!bridge.includes(contract)) throw new Error(`Bridge inventory contract missing: ${contract}`)
}

const require = createRequire(import.meta.url)
let ts
try {
  ts = require("typescript")
} catch {
  ts = null
}

if (ts) {
  for (const file of [files.control, files.storage, files.route, files.types]) {
    const source = fs.readFileSync(file, "utf8")
    const result = ts.transpileModule(source, {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ESNext,
        jsx: ts.JsxEmit.Preserve,
        isolatedModules: true,
      },
      reportDiagnostics: true,
      fileName: file,
    })
    const diagnostics = result.diagnostics || []
    if (diagnostics.length) {
      throw new Error(`${file}: ${diagnostics.map((item) => ts.flattenDiagnosticMessageText(item.messageText, "\n")).join("\n")}`)
    }
  }
}

console.log("OPSOS Storage & Data Phase 1 inventory verified.")
