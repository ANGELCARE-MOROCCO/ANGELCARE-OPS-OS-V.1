import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fail = (message) => { console.error(`MZ15_UNIFIED_RELEASE_VERIFY_FAILED: ${message}`); process.exit(1); };
const read = (relative) => {
  const file = path.join(root, relative);
  if (!fs.existsSync(file)) fail(`Missing ${relative}`);
  return fs.readFileSync(file, "utf8");
};
const json = (relative) => {
  try { return JSON.parse(read(relative)); }
  catch (error) { fail(`${relative} is not valid JSON: ${error.message}`); }
};
const markers = (relative, required) => {
  const source = read(relative);
  for (const marker of required) if (!source.includes(marker)) fail(`${relative} is missing marker: ${marker}`);
  return source;
};
const runNode = (relative) => {
  const result = spawnSync(process.execPath, [path.join(root, relative)], { cwd: root, encoding: "utf8" });
  if (result.status !== 0) fail(`${relative} failed:\n${result.stdout || ""}\n${result.stderr || ""}`);
  return result.stdout.trim();
};

const pkg = json("package.json");
const lock = json("package-lock.json");
const defaults = json("config/defaults.json");
const manifest = json("release/update-manifest.example.json");
if (pkg.version !== "1.7.3") fail(`Expected package version 1.7.3, found ${pkg.version}`);
if (lock.version !== pkg.version || lock.packages?.[""]?.version !== pkg.version) fail("package-lock.json is not synchronized to 1.7.3");
if (defaults.desktopContractVersion !== "11.3.0") fail(`Expected Desktop contract 11.3.0, found ${defaults.desktopContractVersion}`);
if (manifest.version !== pkg.version || manifest.buildNumber !== 173) fail("Release manifest is not synchronized to 1.7.3 build 173");
const expectedNames = {
  win: "ANGELCARE-Desktop-1.7.3-Windows-x64-Setup.exe",
  macX64: "ANGELCARE-Desktop-1.7.3-macOS-x64.dmg",
  macArm64: "ANGELCARE-Desktop-1.7.3-macOS-arm64.dmg",
};
if (manifest.platforms?.win32?.x64?.filename !== expectedNames.win) fail("Windows manifest filename mismatch");
if (manifest.platforms?.darwin?.x64?.filename !== expectedNames.macX64) fail("macOS x64 manifest filename mismatch");
if (manifest.platforms?.darwin?.arm64?.filename !== expectedNames.macArm64) fail("macOS arm64 manifest filename mismatch");

for (const [name, command] of Object.entries({
  "verify:mz15": "node scripts/verify-unified-release-1.7.3.mjs",
  "package:mac:x64": "npm run verify && node scripts/build-macos-dmg.mjs x64",
  "package:mac:arm64": "npm run verify && node scripts/build-macos-dmg.mjs arm64",
  "package:windows": "npm run verify && node scripts/build-windows-installer.mjs x64",
})) if (pkg.scripts?.[name] !== command) fail(`package.json script ${name} is not exact`);

markers("forge.config.cjs", [
  'appBundleId: "com.angelcare.desktop"',
  `setupExe: "${expectedNames.win}"`,
  "EnableCookieEncryption",
  "EnableEmbeddedAsarIntegrityValidation",
  "OnlyLoadAppFromAsar",
  "APPLE_SIGNING_IDENTITY",
  "WINDOWS_CERTIFICATE_FILE",
]);
markers("scripts/build-windows-installer.mjs", [
  'const expectedVersion = "1.7.3"',
  "ANGELCARE-Desktop-${pkg.version}-Windows-x64-Setup.exe",
  "WINDOWS_INSTALLER_1_7_3_READY",
  "verify-unified-release-1.7.3.mjs",
  ".sha256",
]);
markers("scripts/build-macos-dmg.mjs", [
  'pkg.version !== "1.7.3"',
  "macOS-${requestedArch}.dmg",
  "MACOS_INSTALLER_1_7_3_READY",
  "/usr/bin/hdiutil",
  ".sha256",
  "notarized",
]);
markers("scripts/package-platform.mjs", ["cmd.exe", "package:mac:x64", "package:mac:arm64", "make:win:x64"]);
markers("src/runtime/governance.cjs", [
  '"HIDE_WHATSAPP_VIEW"',
  '"CLEAR_WHATSAPP_SESSION"',
  '"REFRESH_AUTHORIZATION"',
  '"LOG_OUT_ANGELCARE_DESKTOP"',
  'case "CLEAR_WHATSAPP_SESSION"',
  'case "LOG_OUT_ANGELCARE_DESKTOP"',
  "whatsapp_governance_stale_device_identity_detected",
  "authorization-device-not-registered",
  "heartbeat-device-not-registered",
  "explicit-authorization-refresh",
  "Appareil enregistré — en attente d’approbation administrative.",
]);
markers("src/runtime/station-policy.cjs", [
  'ac_plus_allowed_modes: ["standard", "focus", "locked"]',
  'split_allowed_modes: ["standard", "focus", "locked"]',
]);
markers("src/runtime/corporate-browser.cjs", [
  'const ANGELCARE_WORKSPACE_TYPE = "angelcare-workspace"',
  "createAngelcareWorkspace",
  "activateSplit",
  "resizeSplitDivider",
  "whatsapp_restored_as_dormant_placeholder",
  "initialOperatingMode",
  "applyOperatingMode",
  "operatingMode: policyMode()",
]);
markers("src/main.cjs", [
  "WHATSAPP_LAZY_ACTIVATION_MZ9",
  "async function activateWhatsappAfterConsent",
  "WHATSAPP_EXPLICIT_ACTIVATION_REQUIRED",
  "WHATSAPP_NAVIGATION_HISTORY_DISABLED",
]);
markers("src/shell/index.html", ["Desktop 1.7.3", 'id="ac-plus"', 'id="split"']);
markers("src/runtime/station-controller.cjs", [
  'contractVersion: "11.3.0"',
  "initialOperatingMode: currentMode",
  "corporateBrowser.applyOperatingMode(target",
]);

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

runNode("scripts/smoke-registration-recovery-1.7.3.mjs");
console.log("MZ15_DEVICE_REGISTRATION_RECOVERY_VERIFIED");
runNode("scripts/smoke-locked-mode-capabilities-1.7.3.mjs");
console.log("MZ15_LOCKED_MODE_CAPABILITY_INDEPENDENCE_VERIFIED");
runNode("scripts/smoke-explicit-capability-disable-1.7.3.mjs");
console.log("MZ15_EXPLICIT_CAPABILITY_DISABLE_VERIFIED");

const desktopHistorical = [
  "scripts/verify-mega-zip-1.mjs",
  "scripts/verify-mac-horizontal-menu.mjs",
  "scripts/verify-mega-zip-7.mjs",
  "scripts/verify-mega-zip-8.mjs",
  "scripts/verify-mega-zip-9.mjs",
];
for (const relative of desktopHistorical) runNode(relative);

const siblingOpsWeb = path.resolve(root, "..", "ops-web");
const historicalWebVerifiers = [
  "scripts/verify-mega-zip-2.mjs",
  "scripts/verify-mega-zip-3.mjs",
  "scripts/verify-mega-zip-4.mjs",
  "scripts/verify-mega-zip-5.mjs",
  "scripts/verify-mega-zip-6.mjs",
];
if (fs.existsSync(siblingOpsWeb) && historicalWebVerifiers.every((relative) => fs.existsSync(path.join(siblingOpsWeb, relative)))) {
  for (const relative of historicalWebVerifiers) runNode(relative);
  console.log("MZ15_MONOREPO_CUMULATIVE_DESKTOP_WEB_CONTRACT_VERIFIED");
} else {
  console.log("MZ15_STANDALONE_DESKTOP_SOURCE_VERIFIED_WITHOUT_COMPLETE_OPS_WEB_SIBLING");
}

console.log("MZ15_UNIFIED_WINDOWS_MACOS_RELEASE_VERIFIED");
console.log("ANGELCARE Desktop 1.7.3 release identity, Corporate Locked-compatible policy-authorized AC+, policy-authorized split operations, unchanged main dashboard, registration recovery, dormant WhatsApp, Fleet Lifecycle commands and unified Windows/macOS packaging are statically accepted.");
