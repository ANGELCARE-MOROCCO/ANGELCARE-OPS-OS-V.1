import fs from "node:fs"
import path from "node:path"
import { createRequire } from "node:module"
import { spawnSync } from "node:child_process"

const desktopRoot = path.resolve(import.meta.dirname, "..")
const projectRoot = path.resolve(desktopRoot, "..", "..")
const opsRoot = path.join(projectRoot, "apps", "ops-web")

const desktopFiles = [
  "src/main.cjs",
  "src/preload.cjs",
  "src/runtime/governance.cjs",
  "config/defaults.json",
  "scripts/verify-mega-zip-3.mjs",
  "docs/MEGA_ZIP_3_HANDOVER.md",
]
const opsFiles = [
  "components/desktop/DesktopRuntimeBridge.tsx",
  "components/whatsapp-os/useWhatsAppGovernance.ts",
  "components/whatsapp-os/WhatsAppGovernanceGate.tsx",
  "components/whatsapp-os/WhatsAppGovernanceStatusPanel.tsx",
  "components/whatsapp-os/WhatsAppDesktopAdmin.tsx",
  "lib/whatsapp-desktop/types.ts",
  "lib/whatsapp-desktop/server.ts",
  "lib/desktop-runtime.ts",
  "types/angelcare-desktop.d.ts",
  "app/(protected)/whatsapp-os/admin/page.tsx",
  "app/(protected)/whatsapp-os/web-session/page.tsx",
  "app/(protected)/whatsapp-os/session-control/page.tsx",
  "app/api/whatsapp-desktop/workspaces/route.ts",
  "app/api/whatsapp-desktop/workspaces/[id]/route.ts",
  "app/api/whatsapp-desktop/assignments/route.ts",
  "app/api/whatsapp-desktop/assignments/[id]/route.ts",
  "app/api/whatsapp-desktop/assignments/[id]/revoke/route.ts",
  "app/api/whatsapp-desktop/devices/route.ts",
  "app/api/whatsapp-desktop/devices/register/route.ts",
  "app/api/whatsapp-desktop/devices/heartbeat/route.ts",
  "app/api/whatsapp-desktop/devices/[id]/approve/route.ts",
  "app/api/whatsapp-desktop/devices/[id]/suspend/route.ts",
  "app/api/whatsapp-desktop/devices/[id]/revoke/route.ts",
  "app/api/whatsapp-desktop/authorization/issue/route.ts",
  "app/api/whatsapp-desktop/authorization/renew/route.ts",
  "app/api/whatsapp-desktop/authorization/check/route.ts",
  "app/api/whatsapp-desktop/commands/route.ts",
  "app/api/whatsapp-desktop/commands/[id]/acknowledge/route.ts",
  "app/api/whatsapp-desktop/access-requests/route.ts",
  "app/api/whatsapp-desktop/access-requests/[id]/decide/route.ts",
  "app/api/whatsapp-desktop/policies/route.ts",
  "app/api/whatsapp-desktop/security-events/route.ts",
  "app/api/whatsapp-desktop/audit/route.ts",
  "app/api/whatsapp-desktop/admin/overview/route.ts",
  "supabase/migrations/20260720_whatsapp_desktop_governance_mega_zip3.sql",
  "database/whatsapp-desktop-governance-mega-zip3-20260720.sql",
]

for (const relative of desktopFiles) if (!fs.existsSync(path.join(desktopRoot, relative))) throw new Error(`Missing Mega ZIP 3 desktop file: ${relative}`)
for (const relative of opsFiles) if (!fs.existsSync(path.join(opsRoot, relative))) throw new Error(`Missing Mega ZIP 3 OPS file: ${relative}`)

for (const relative of ["src/main.cjs", "src/preload.cjs", "src/runtime/governance.cjs", "scripts/verify-mega-zip-3.mjs"]) {
  const result = spawnSync(process.execPath, ["--check", path.join(desktopRoot, relative)], { encoding: "utf8" })
  if (result.status !== 0) throw new Error(`JavaScript syntax verification failed for ${relative}:\n${result.stderr || result.stdout}`)
}

const main = fs.readFileSync(path.join(desktopRoot, "src/main.cjs"), "utf8")
const preload = fs.readFileSync(path.join(desktopRoot, "src/preload.cjs"), "utf8")
const governance = fs.readFileSync(path.join(desktopRoot, "src/runtime/governance.cjs"), "utf8")
const server = fs.readFileSync(path.join(opsRoot, "lib/whatsapp-desktop/server.ts"), "utf8")
const migration = fs.readFileSync(path.join(opsRoot, "supabase/migrations/20260720_whatsapp_desktop_governance_mega_zip3.sql"), "utf8")
const admin = fs.readFileSync(path.join(opsRoot, "components/whatsapp-os/WhatsAppDesktopAdmin.tsx"), "utf8")
const gate = fs.readFileSync(path.join(opsRoot, "components/whatsapp-os/WhatsAppGovernanceGate.tsx"), "utf8")
const types = fs.readFileSync(path.join(opsRoot, "types/angelcare-desktop.d.ts"), "utf8")

const contracts = [
  [main, "createGovernanceController", "desktop governance controller"],
  [main, "requireGovernedWhatsappAccess", "native WhatsApp visibility gate"],
  [main, "angelcare-desktop:governance-command", "governance IPC allowlist"],
  [preload, "governanceCommands", "preload governance command allowlist"],
  [preload, "selectWorkspace", "workspace selection bridge"],
  [governance, "installationId", "persistent installation identity"],
  [governance, "authorization/renew", "short-lived authorization renewal"],
  [governance, "offlineGraceActive", "offline grace enforcement"],
  [governance, "COMMAND_ALLOWLIST", "remote command allowlist"],
  [server, "issueAuthorizationLease", "server-side authorization lease"],
  [server, "WHATSAPP_DESKTOP_LEASE_SECRET", "lease secret contract"],
  [server, "DEVICE_WORKSPACE_NOT_APPROVED", "device/workspace binding"],
  [migration, "whatsapp_desktop_workspaces", "workspace registry table"],
  [migration, "whatsapp_desktop_devices", "device registry table"],
  [migration, "whatsapp_desktop_device_sessions", "authorization lease table"],
  [migration, "whatsapp_desktop_commands", "remote command table"],
  [migration, "whatsapp_desktop_security_events", "security event table"],
  [admin, "Administration WhatsApp Desktop", "central admin cockpit"],
  [gate, "Accès WhatsApp Desktop gouverné", "user-facing governance gate"],
  [types, "AngelCareWhatsAppGovernanceApi", "typed governance desktop API"],
]
for (const [content, needle, label] of contracts) if (!content.includes(needle)) throw new Error(`Missing Mega ZIP 3 contract: ${label}`)

const forbidden = [
  "executeJavaScript(",
  "whatsapp_cookie",
  "whatsapp_cookies",
  "document.cookie",
  "indexedDB.databases",
  "web.whatsapp.com/api",
  "child_process.exec(",
  "command.payload.script",
]
const combined = [main, preload, governance, server, admin, gate].join("\n")
for (const needle of forbidden) if (combined.includes(needle)) throw new Error(`Forbidden Mega ZIP 3 pattern detected: ${needle}`)

const packageJson = JSON.parse(fs.readFileSync(path.join(desktopRoot, "package.json"), "utf8"))
if (!["1.2.0", "1.3.0", "1.4.0", "1.5.0"].includes(packageJson.version)) throw new Error("Mega ZIP 3 requires desktop version 1.2.0 or a supported cumulative version.")
if (!packageJson.scripts?.verify?.includes("verify-mega-zip-3.mjs")) throw new Error("Mega ZIP 3 verifier is not wired into npm run verify.")
if (packageJson.devDependencies?.["@electron-forge/maker-dmg"] || packageJson.devDependencies?.appdmg || packageJson.devDependencies?.["macos-alias"]) throw new Error("Native hdiutil DMG pipeline must remain free of appdmg/macos-alias.")

let typescript = null
const require = createRequire(import.meta.url)
for (const candidate of [path.join(opsRoot, "node_modules", "typescript"), path.join(projectRoot, "node_modules", "typescript"), "typescript"]) {
  try { typescript = require(candidate); break } catch {}
}

if (typescript) {
  for (const relative of opsFiles.filter((relative) => /\.(?:ts|tsx)$/.test(relative) && !relative.endsWith(".d.ts"))) {
    const fileName = path.join(opsRoot, relative)
    const source = fs.readFileSync(fileName, "utf8")
    const result = typescript.transpileModule(source, {
      fileName,
      reportDiagnostics: true,
      compilerOptions: { target: typescript.ScriptTarget.ES2022, module: typescript.ModuleKind.ESNext, jsx: typescript.JsxEmit.Preserve },
    })
    const errors = (result.diagnostics || []).filter((diagnostic) => diagnostic.category === typescript.DiagnosticCategory.Error)
    if (errors.length) throw new Error(`TypeScript syntax failed for ${relative}:\n${errors.map((diagnostic) => typescript.flattenDiagnosticMessageText(diagnostic.messageText, "\n")).join("\n")}`)
  }
  const declarationSource = typescript.createSourceFile("angelcare-desktop.d.ts", types, typescript.ScriptTarget.ES2022, true, typescript.ScriptKind.TS)
  if (declarationSource.parseDiagnostics?.length) throw new Error(`Declaration syntax failed: ${declarationSource.parseDiagnostics.map((diagnostic) => typescript.flattenDiagnosticMessageText(diagnostic.messageText, "\n")).join("\n")}`)
} else {
  console.warn("TypeScript package unavailable; TS/TSX source contracts were inspected without transpilation.")
}

const routeCount = opsFiles.filter((relative) => relative.includes("app/api/whatsapp-desktop") && relative.endsWith("route.ts")).length
if (routeCount < 20) throw new Error(`Expected at least 20 governed API route files, found ${routeCount}.`)

console.log("ANGELCARE Desktop Mega ZIP 3 governance control plane verified.")
console.log(`${routeCount} governed API routes, device registration, leases, policies, commands, revocation, security and audit contracts are present.`)
console.log("No WhatsApp cookies, message content or browser-session secrets are centralized.")
