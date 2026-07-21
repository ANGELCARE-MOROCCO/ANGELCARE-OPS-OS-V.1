import fs from "node:fs"
import path from "node:path"
import { createRequire } from "node:module"
import { spawnSync } from "node:child_process"

const desktopRoot = path.resolve(import.meta.dirname, "..")
const projectRoot = path.resolve(desktopRoot, "..", "..")
const opsRoot = path.join(projectRoot, "apps", "ops-web")
const desktopFiles = [
  "src/main.cjs", "src/preload.cjs", "config/defaults.json", "scripts/verify-mega-zip-4.mjs", "docs/MEGA_ZIP_4_HANDOVER.md",
]
const opsFiles = [
  "components/desktop/DesktopRuntimeBridge.tsx", "components/whatsapp-os/WhatsAppDesktopWorkspace.tsx",
  "components/whatsapp-os/useWhatsAppBusinessContext.ts", "components/whatsapp-os/WhatsAppBusinessContextRail.tsx",
  "components/whatsapp-os/WhatsAppContextAction.tsx", "components/whatsapp-os/WhatsAppContextAnalytics.tsx", "components/whatsapp-os/WhatsAppEntityTimeline.tsx",
  "lib/whatsapp-desktop/context-types.ts", "lib/whatsapp-desktop/context-server.ts", "lib/whatsapp-desktop/context-client.ts",
  "lib/whatsapp-desktop/adapters/base.ts", "lib/whatsapp-desktop/adapters/registry.ts",
  "app/(protected)/whatsapp-os/web-session/page.tsx", "app/(protected)/whatsapp-os/analytics/page.tsx",
  "supabase/migrations/20260720_whatsapp_business_context_mega_zip4.sql",
  "database/whatsapp-business-context-mega-zip4-20260720.sql",
  "components/b2b-partnerships/B2BProspectDirectoryWorkspace.tsx",
]
const adapters = ["b2b","academy","traininghub","customer","admissions","support","finance","recruitment","refferq","operations"].map((name) => `lib/whatsapp-desktop/adapters/${name}.ts`)
for (const relative of desktopFiles) if (!fs.existsSync(path.join(desktopRoot, relative))) throw new Error(`Missing Mega ZIP 4 desktop file: ${relative}`)
for (const relative of [...opsFiles, ...adapters]) if (!fs.existsSync(path.join(opsRoot, relative))) throw new Error(`Missing Mega ZIP 4 OPS file: ${relative}`)
for (const relative of ["src/main.cjs", "src/preload.cjs", "scripts/verify-mega-zip-4.mjs"]) {
  const result = spawnSync(process.execPath, ["--check", path.join(desktopRoot, relative)], { encoding: "utf8" })
  if (result.status !== 0) throw new Error(`JavaScript syntax failed for ${relative}:\n${result.stderr || result.stdout}`)
}
const main = fs.readFileSync(path.join(desktopRoot, "src/main.cjs"), "utf8")
const preload = fs.readFileSync(path.join(desktopRoot, "src/preload.cjs"), "utf8")
const server = fs.readFileSync(path.join(opsRoot, "lib/whatsapp-desktop/context-server.ts"), "utf8")
const workspace = fs.readFileSync(path.join(opsRoot, "components/whatsapp-os/WhatsAppDesktopWorkspace.tsx"), "utf8")
const rail = fs.readFileSync(path.join(opsRoot, "components/whatsapp-os/WhatsAppBusinessContextRail.tsx"), "utf8")
const b2bProspectWorkspace = fs.readFileSync(path.join(opsRoot, "components/b2b-partnerships/B2BProspectDirectoryWorkspace.tsx"), "utf8")
const contextClient = fs.readFileSync(path.join(opsRoot, "lib/whatsapp-desktop/context-client.ts"), "utf8")
const migration = fs.readFileSync(path.join(opsRoot, "supabase/migrations/20260720_whatsapp_business_context_mega_zip4.sql"), "utf8")
const contracts = [
  [main, "whatsapp_business_context_navigation", "desktop business-context navigation evidence"],
  [preload, "whatsappBusinessContext", "preload business-context capability"],
  [server, "normalizeWhatsAppPhone", "authoritative phone normalization"],
  [server, "requireWorkspaceAssignment", "workspace permission enforcement"],
  [server, "NEXT_ACTION_REQUIRED", "next-action policy support", true],
  [workspace, "WhatsAppBusinessContextRail", "business-context rail integration"],
  [rail, "Le message reste non envoyé", "manual-send boundary"],
  [rail, "Déclaration opérateur", "operator-declared outcome boundary"],
  [rail, "/api/whatsapp-desktop/context/documents/", "governed document redirect"],
  [rail, "Sélectionner l’espace destinataire", "human-readable handoff workspace selector"],
  [b2bProspectWorkspace, "WhatsAppContextAction", "real B2B prospect entry-point integration"],
  [b2bProspectWorkspace, 'contextType="b2b_prospect"', "B2B context type wiring"],
  [b2bProspectWorkspace, "envoi manuel uniquement", "source-module manual-send disclosure"],
  [contextClient, "url.searchParams.set", "safe context deep-link construction"],
  [migration, "whatsapp_context_sessions", "context session table"],
  [migration, "whatsapp_contact_attempts", "contact attempt table"],
  [migration, "whatsapp_contact_outcomes", "outcome table"],
  [migration, "whatsapp_context_handoffs", "handoff table"],
  [migration, "whatsapp_context_escalations", "escalation table"],
]
for (const item of contracts) { const [content, needle, label, optional] = item; if (!content.includes(needle) && !optional) throw new Error(`Missing Mega ZIP 4 contract: ${label}`) }
const forbidden = ["executeJavaScript(", "document.cookie", "indexedDB.databases", "querySelector('[data-testid=", "click() // send", "message_delivery_status_from_browser", "whatsapp_cookie"]
const combined = [main, preload, server, workspace, rail, b2bProspectWorkspace, contextClient].join("\n")
for (const needle of forbidden) if (combined.includes(needle)) throw new Error(`Forbidden Mega ZIP 4 pattern detected: ${needle}`)
const packageJson = JSON.parse(fs.readFileSync(path.join(desktopRoot, "package.json"), "utf8"))
if (!["1.3.0", "1.4.0"].includes(packageJson.version)) throw new Error("Mega ZIP 4 requires desktop version 1.3.0 or a supported cumulative version.")
if (!packageJson.scripts?.verify?.includes("verify-mega-zip-4.mjs")) throw new Error("Mega ZIP 4 verifier is not wired into npm run verify.")
if (packageJson.devDependencies?.["@electron-forge/maker-dmg"] || packageJson.devDependencies?.appdmg || packageJson.devDependencies?.["macos-alias"]) throw new Error("Native hdiutil DMG pipeline must remain intact.")
const apiRoot = path.join(opsRoot, "app", "api", "whatsapp-desktop")
const routeFiles = []
function walk(dir) { for (const entry of fs.readdirSync(dir, { withFileTypes: true })) { const file = path.join(dir, entry.name); if (entry.isDirectory()) walk(file); else if (entry.name === "route.ts") routeFiles.push(file) } }
walk(apiRoot)
const mega4Routes = routeFiles.filter((file) => /context|phone|templates|snippets|prepared-messages|contact-attempts|analytics/.test(file))
if (mega4Routes.length < 19) throw new Error(`Expected at least 19 Mega ZIP 4 routes, found ${mega4Routes.length}.`)
for (const requiredRoute of ["context/documents/[id]/open/route.ts", "context/entity-timeline/route.ts"]) {
  if (!fs.existsSync(path.join(apiRoot, requiredRoute))) throw new Error(`Missing Mega ZIP 4 route: ${requiredRoute}`)
}
const require = createRequire(import.meta.url)
let typescript = null
for (const candidate of [path.join(opsRoot, "node_modules", "typescript"), path.join(projectRoot, "node_modules", "typescript"), "typescript"]) { try { typescript = require(candidate); break } catch {} }
if (typescript) {
  const tsFiles = [...opsFiles, ...adapters, ...mega4Routes.map((file) => path.relative(opsRoot, file))].filter((item) => /\.(ts|tsx)$/.test(item) && !item.endsWith(".d.ts"))
  for (const relative of [...new Set(tsFiles)]) {
    const fileName = path.join(opsRoot, relative); const source = fs.readFileSync(fileName, "utf8")
    const result = typescript.transpileModule(source, { fileName, reportDiagnostics: true, compilerOptions: { target: typescript.ScriptTarget.ES2022, module: typescript.ModuleKind.ESNext, jsx: typescript.JsxEmit.Preserve } })
    const errors = (result.diagnostics || []).filter((diagnostic) => diagnostic.category === typescript.DiagnosticCategory.Error)
    if (errors.length) throw new Error(`TypeScript syntax failed for ${relative}:\n${errors.map((d) => typescript.flattenDiagnosticMessageText(d.messageText, "\n")).join("\n")}`)
  }
} else console.warn("TypeScript package unavailable; static contracts only.")
const tableCount = (migration.match(/create table if not exists public\.whatsapp_/g) || []).length
if (tableCount < 13) throw new Error(`Expected at least 13 Mega ZIP 4 business tables, found ${tableCount}.`)
console.log("ANGELCARE Desktop Mega ZIP 4 business context bridge verified.")
console.log(`${mega4Routes.length} context API routes, ${adapters.length} module adapters and ${tableCount} governed business tables are present.`)
console.log("WhatsApp remains human-operated; no DOM scraping, auto-send or browser-derived delivery evidence is implemented.")
