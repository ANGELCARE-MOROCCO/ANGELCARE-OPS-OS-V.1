import fs from "node:fs"
import path from "node:path"
import { createRequire } from "node:module"
import { spawnSync } from "node:child_process"

const desktopRoot = path.resolve(import.meta.dirname, "..")
const projectRoot = path.resolve(desktopRoot, "..", "..")
const opsRoot = path.join(projectRoot, "apps", "ops-web")

const requiredDesktopFiles = [
  "src/main.cjs",
  "src/preload.cjs",
  "config/defaults.json",
  "scripts/verify-mega-zip-2.mjs",
  "scripts/build-macos-dmg.mjs",
]
const requiredOpsFiles = [
  "components/desktop/DesktopRuntimeBridge.tsx",
  "components/whatsapp-os/useWhatsAppDesktop.ts",
  "components/whatsapp-os/WhatsAppDesktopWorkspace.tsx",
  "components/whatsapp-os/WhatsAppSessionControl.tsx",
  "lib/desktop-runtime.ts",
  "types/angelcare-desktop.d.ts",
  "app/(protected)/whatsapp-os/page.tsx",
  "app/(protected)/whatsapp-os/web-session/page.tsx",
  "app/(protected)/whatsapp-os/session-control/page.tsx",
  "app/api/desktop/runtime/health/route.ts",
]

for (const relative of requiredDesktopFiles) {
  if (!fs.existsSync(path.join(desktopRoot, relative))) throw new Error(`Missing Mega ZIP 2 desktop file: ${relative}`)
}
for (const relative of requiredOpsFiles) {
  if (!fs.existsSync(path.join(opsRoot, relative))) throw new Error(`Missing Mega ZIP 2 OPS Web file: ${relative}`)
}

for (const relative of ["src/main.cjs", "src/preload.cjs", "scripts/verify-mega-zip-2.mjs"]) {
  const result = spawnSync(process.execPath, ["--check", path.join(desktopRoot, relative)], { encoding: "utf8" })
  if (result.status !== 0) throw new Error(`Syntax verification failed for ${relative}:\n${result.stderr || result.stdout}`)
}

const main = fs.readFileSync(path.join(desktopRoot, "src/main.cjs"), "utf8")
const preload = fs.readFileSync(path.join(desktopRoot, "src/preload.cjs"), "utf8")
const workspace = fs.readFileSync(path.join(opsRoot, "components/whatsapp-os/WhatsAppDesktopWorkspace.tsx"), "utf8")
const sessionControl = fs.readFileSync(path.join(opsRoot, "components/whatsapp-os/WhatsAppSessionControl.tsx"), "utf8")
const types = fs.readFileSync(path.join(opsRoot, "types/angelcare-desktop.d.ts"), "utf8")

const contracts = [
  [main, "persist:angelcare-whatsapp-main", "persistent WhatsApp partition"],
  [main, "new WebContentsView", "WhatsApp WebContentsView"],
  [main, "https://web.whatsapp.com/", "official WhatsApp Web URL"],
  [main, "setPermissionRequestHandler", "permission request governance"],
  [main, "setPermissionCheckHandler", "permission check governance"],
  [main, "will-download", "download governance"],
  [main, "DANGEROUS_DOWNLOAD_EXTENSIONS", "dangerous download blocking"],
  [main, "render-process-gone", "WhatsApp renderer crash handling"],
  [main, "angelcare-desktop:whatsapp-bounds", "reserved-region synchronization"],
  [main, "clearStorageData", "local linked-session erasure"],
  [main, "whatsappAutomation: false", "automation disabled contract"],
  [preload, "allowedCommands", "IPC allowlist"],
  [preload, "contextBridge.exposeInMainWorld", "isolated desktop API"],
  [workspace, "ResizeObserver", "dynamic view bounds"],
  [workspace, "Aucune extraction de conversations", "human-operated boundary"],
  [sessionControl, "Effacer la session liée", "session control"],
  [types, "AngelCareWhatsAppDesktopApi", "typed desktop API"],
]
for (const [content, needle, label] of contracts) {
  if (!content.includes(needle)) throw new Error(`Missing Mega ZIP 2 contract: ${label}`)
}

for (const forbidden of ["executeJavaScript(", "BrowserView", "<webview", "webviewTag", "nodeIntegration: true"]) {
  if (main.includes(forbidden) || preload.includes(forbidden) || workspace.includes(forbidden)) {
    throw new Error(`Forbidden WhatsApp runtime pattern detected: ${forbidden}`)
  }
}

const packageJson = JSON.parse(fs.readFileSync(path.join(desktopRoot, "package.json"), "utf8"))
if (packageJson.version !== "1.1.0") throw new Error("Mega ZIP 2 must set ANGELCARE Desktop version 1.1.0.")
if (!packageJson.scripts?.verify?.includes("verify-mega-zip-2.mjs")) throw new Error("Mega ZIP 2 verifier is not wired into npm run verify.")
if (packageJson.devDependencies?.["@electron-forge/maker-dmg"]) throw new Error("The native hdiutil DMG pipeline must remain intact.")

let typescript = null
for (const candidate of [
  path.join(opsRoot, "node_modules", "typescript"),
  path.join(projectRoot, "node_modules", "typescript"),
  "typescript",
]) {
  try {
    const require = createRequire(import.meta.url)
    typescript = require(candidate)
    break
  } catch {
    // Continue to next candidate.
  }
}

if (typescript) {
  const syntaxTargets = requiredOpsFiles.filter((relative) => /\.(?:ts|tsx)$/.test(relative) && !relative.endsWith(".d.ts"))
  for (const relative of syntaxTargets) {
    const fileName = path.join(opsRoot, relative)
    const source = fs.readFileSync(fileName, "utf8")
    const result = typescript.transpileModule(source, {
      fileName,
      reportDiagnostics: true,
      compilerOptions: {
        target: typescript.ScriptTarget.ES2022,
        module: typescript.ModuleKind.ESNext,
        jsx: typescript.JsxEmit.Preserve,
      },
    })
    const errors = (result.diagnostics || []).filter((diagnostic) => diagnostic.category === typescript.DiagnosticCategory.Error)
    if (errors.length > 0) {
      const text = errors.map((diagnostic) => typescript.flattenDiagnosticMessageText(diagnostic.messageText, "\n")).join("\n")
      throw new Error(`TypeScript syntax verification failed for ${relative}:\n${text}`)
    }
  }
} else {
  console.warn("TypeScript package not available; TS/TSX contract checks completed without transpilation.")
}

console.log("ANGELCARE Desktop Mega ZIP 2 WhatsApp runtime verified.")
console.log("Persistent profile, secure WebContentsView, bounds sync, permissions, downloads, diagnostics and session erasure are present.")
console.log("No DOM scraping, automatic sending or WhatsApp cookie export is implemented.")
