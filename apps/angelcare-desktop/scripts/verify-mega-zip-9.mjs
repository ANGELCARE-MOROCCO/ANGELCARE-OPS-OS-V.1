import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fail = (message) => { console.error(`MEGA_ZIP_9_VERIFY_FAILED: ${message}`); process.exit(1); };
const read = (relative) => {
  const file = path.join(root, relative);
  if (!fs.existsSync(file)) fail(`Missing ${relative}`);
  return fs.readFileSync(file, "utf8");
};
const json = (relative) => {
  try { return JSON.parse(read(relative)); }
  catch (error) { fail(`${relative} is not valid JSON: ${error.message}`); }
};
const requireMarkers = (relative, markers) => {
  const content = read(relative);
  for (const marker of markers) if (!content.includes(marker)) fail(`${relative} is missing marker: ${marker}`);
  return content;
};

const required = [
  "package.json", "package-lock.json", "forge.config.cjs", "config/defaults.json",
  "src/main.cjs", "src/preload.cjs", "src/shell-preload.cjs",
  "src/runtime/corporate-browser.cjs", "src/runtime/station-controller.cjs", "src/runtime/station-policy.cjs",
  "src/shell/index.html", "src/shell/shell.js", "src/shell/styles.css",
  "src/whatsapp-activation/index.html", "src/whatsapp-activation/activation.js", "src/whatsapp-activation/styles.css", "src/whatsapp-activation-preload.cjs",
  "src/split-divider/index.html", "src/split-divider/divider.js", "src/split-divider/styles.css", "src/split-divider-preload.cjs",
  "scripts/smoke-mega-zip-9-lifecycle.mjs", "scripts/build-windows-installer.mjs", "release/update-manifest.example.json",
];
for (const relative of required) if (!fs.existsSync(path.join(root, relative))) fail(`Missing ${relative}`);

const pkg = json("package.json");
const lock = json("package-lock.json");
const defaults = json("config/defaults.json");
const update = json("release/update-manifest.example.json");
if (!["1.6.0", "1.7.3"].includes(pkg.version)) fail(`Expected package version 1.6.0 or cumulative 1.7.3, found ${pkg.version}`);
if (lock.version !== pkg.version || lock.packages?.[""]?.version !== pkg.version) fail("package-lock.json version identity is not synchronized");
if (!["9.0.0", "11.3.0"].includes(defaults.desktopContractVersion)) fail(`Expected desktop contract 9.0.0 or cumulative 11.3.0, found ${defaults.desktopContractVersion}`);
if (defaults.acPlusDashboardPath !== "/dashboard") fail("AC+ dashboard route is not /dashboard");
if (pkg.scripts?.["verify:mz9"] !== "node scripts/verify-mega-zip-9.mjs") fail("verify:mz9 script is missing");
if (update.version !== pkg.version || ![160,170,171,172,173].includes(update.buildNumber)) fail("Example update manifest is not synchronized to a supported cumulative release");
if (update.platforms?.win32?.x64?.filename !== `ANGELCARE-Desktop-${pkg.version}-Windows-x64-Setup.exe`) fail("Windows update filename is not synchronized to the package version");

const browser = requireMarkers("src/runtime/corporate-browser.cjs", [
  'const ANGELCARE_WORKSPACE_TYPE = "angelcare-workspace"',
  "const PERSISTENCE_SCHEMA_VERSION = 3",
  "trustedAngelcareSession",
  "TRUSTED_ANGELCARE_SESSION_UNAVAILABLE",
  "AC_PLUS_DISABLED_BY_POLICY",
  "AC_PLUS_URL_OUTSIDE_ANGELCARE_ORIGIN",
  "createAngelcareWorkspace",
  "maximumAcPlusTabs",
  "openSplitSelector",
  "activateSplit",
  "SPLIT_MODE_NOT_AVAILABLE",
  "SPLIT_SELECTION_CONTAINS_INELIGIBLE_TAB",
  "resizeSplitDivider",
  "focusPane",
  "replacePane",
  "swapPanes",
  "maximizePane",
  "restorePane",
  "split_exited_without_closing_tabs",
  "whatsapp_restored_as_dormant_placeholder",
  "Restore application state != reconnect WhatsApp automatically.",
  "SYSTEM_TAB_ZOOM_PARITY_V1",
]);
const main = requireMarkers("src/main.cjs", [
  "WHATSAPP_LAZY_ACTIVATION_MZ9",
  "function ensureWhatsappActivationView()",
  "async function activateWhatsappAfterConsent",
  'if (!explicit) throw new Error("WHATSAPP_EXPLICIT_ACTIVATION_REQUIRED")',
  'if (!whatsappView || whatsappView.webContents.isDestroyed()) throw new Error("WHATSAPP_EXPLICIT_ACTIVATION_REQUIRED")',
  "getSystemTabView",
  "getSystemTabStatus",
  "trustedPreloadPath",
  "saasSession: saasSessionRuntime",
  "onDividerLayout: updateSplitDividerLayout",
  "focusSystemPaneFromWebContents",
  "WHATSAPP_NAVIGATION_HISTORY_DISABLED",
]);
const shell = requireMarkers("src/shell/shell.js", [
  'command("create-ac-plus")',
  'command("open-split-selector"',
  'command("activate-split"',
  'command("swap-panes"',
  'command("maximize-pane"',
  'command("restore-pane"',
  'command("exit-split"',
  '["2","3","4"].includes(event.key)',
]);
const shellHtml = requireMarkers("src/shell/index.html", [
  'id="ac-plus"', "AC+", 'id="split"', 'id="split-selector"', 'id="address-input" type="hidden"',
]);
requireMarkers("src/runtime/station-policy.cjs", [
  "maximum_ac_plus_tabs: 12", "ac_plus_enabled: true", "split_enabled: true", "split_modes: [2, 3, 4]",
]);
requireMarkers("src/runtime/station-controller.cjs", [
  "trustedAngelcareSession: saasSession", "getSystemTabView", "onDividerLayout", 'contractVersion: "11.3.0"',
]);
requireMarkers("src/whatsapp-activation/index.html", ["Ouvrir WhatsApp", "Vérifier l’autorisation", "Conservée, non connectée"]);
requireMarkers("src/whatsapp-activation-preload.cjs", ['new Set(["get-status","refresh","open"])']);
requireMarkers("src/split-divider-preload.cjs", ["split-divider-command", "split-divider-move", "split-divider-config"]);
const forge = requireMarkers("forge.config.cjs", [
  'setupExe: "ANGELCARE-Desktop-1.7.3-Windows-x64-Setup.exe"', "FusesPlugin", "EnableCookieEncryption", "OnlyLoadAppFromAsar",
]);
requireMarkers("scripts/build-windows-installer.mjs", [
  'const expectedVersion = "1.7.3"', "WINDOWS_INSTALLER_BUILD_FAILED", "ANGELCARE-Desktop-${pkg.version}-Windows-x64-Setup.exe", "verify-unified-release-1.7.3.mjs", ".sha256",
]);

const createMainWindowStart = main.indexOf("async function createMainWindow()");
const createMainWindowEnd = main.indexOf('app.on("second-instance"', createMainWindowStart);
const startupBody = main.slice(createMainWindowStart, createMainWindowEnd);
if (startupBody.includes("ensureWhatsappView(")) fail("Desktop startup still creates the WhatsApp WebContentsView");
if (!startupBody.includes("ensureWhatsappActivationView();")) fail("Desktop startup does not create the dormant native WhatsApp activation surface");
if (main.indexOf("ensureWhatsappView({ load: true, explicit: true })") < main.indexOf("async function activateWhatsappAfterConsent")) fail("Explicit WhatsApp activation path is not ordered correctly");
if (browser.includes("cookies.get(") || browser.includes("cookies.set(") || browser.includes("executeJavaScript(")) fail("AC+ runtime contains forbidden cookie-copy or renderer-extraction logic");
if (main.includes("cookies.get({ domain: \".whatsapp.com\" })") || main.includes("executeJavaScript(")) fail("WhatsApp runtime contains forbidden extraction or cookie-export logic");
for (const forbidden of ["nodeIntegration: true", "contextIsolation: false", "webSecurity: false", "allowRunningInsecureContent: true", "webviewTag: true"]) {
  if ([main, browser, shell, shellHtml, forge].some((source) => source.includes(forbidden))) fail(`Forbidden renderer/security pattern detected: ${forbidden}`);
}
for (const forbidden of ["middle-click", "Ctrl-click", "Shift-click", "window.open(", "target=_blank conversion", "editable omnibox"]) {
  if (browser.includes(forbidden)) fail(`Forbidden unrestricted tab-creation pattern detected: ${forbidden}`);
}

const syntaxFiles = [];
for (const directory of ["src", "scripts"]) {
  const walk = (relative) => {
    for (const entry of fs.readdirSync(path.join(root, relative), { withFileTypes: true })) {
      const child = path.join(relative, entry.name);
      if (entry.isDirectory()) walk(child);
      else if (/\.(?:js|cjs|mjs)$/.test(entry.name)) syntaxFiles.push(child);
    }
  };
  walk(directory);
}
for (const relative of syntaxFiles) {
  const result = spawnSync(process.execPath, ["--check", path.join(root, relative)], { cwd: root, encoding: "utf8" });
  if (result.status !== 0) fail(`${relative} syntax failed:\n${result.stderr || result.stdout}`);
}

const smoke = spawnSync(process.execPath, [path.join(root, "scripts", "smoke-mega-zip-9-lifecycle.mjs")], { cwd: root, encoding: "utf8" });
if (smoke.status !== 0) fail(`Mega ZIP 9 lifecycle smoke failed:\n${smoke.stdout}\n${smoke.stderr}`);

console.log(smoke.stdout.trim());
console.log("MZ9_AC_PLUS_MULTI_WORKSPACE_SPLIT_OPERATIONS_VERIFIED");
console.log(`Desktop ${pkg.version} preserves WhatsApp dormancy, trusted AC+ session reuse, 2/3/4 split ownership, focused navigation, persistence and security.`);
