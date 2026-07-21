import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
const desktopRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const projectRoot = path.resolve(desktopRoot, "../..");
const opsRoot = path.join(projectRoot, "apps", "ops-web");
function read(relative) { const file = path.join(desktopRoot, relative); if (!fs.existsSync(file)) throw new Error(`Missing Mega ZIP 5 file: ${relative}`); return fs.readFileSync(file, "utf8"); }
const packageJson = JSON.parse(read("package.json"));
if (packageJson.version !== "1.4.0") throw new Error("Mega ZIP 5 must set desktop version 1.4.0.");
if (!packageJson.scripts?.verify?.includes("verify-mega-zip-5.mjs")) throw new Error("Mega ZIP 5 verifier is not wired into npm run verify.");
const defaults = JSON.parse(read("config/defaults.json"));
if (defaults.desktopContractVersion !== "5.0.0") throw new Error("Desktop contract version must be 5.0.0.");
const required = [
  "src/runtime/security.cjs", "src/runtime/diagnostics.cjs", "src/runtime/update-manager.cjs", "src/runtime/startup-recovery.cjs",
  "scripts/smoke-runtime-security.mjs", "scripts/generate-release-manifest.mjs", "scripts/generate-checksums.mjs", "scripts/verify-release.mjs",
  "scripts/build-windows-installer.mjs", "scripts/package-platform.mjs", "scripts/preflight-signing.mjs",
  "release/update-manifest.example.json", "release/signing-environment.example", "release/rollback-plan.md", "docs/MEGA_ZIP_5_HANDOVER.md",
];
for (const file of required) read(file);
const main = read("src/main.cjs");
const preload = read("src/preload.cjs");
const forge = read("forge.config.cjs");
const security = read("src/runtime/security.cjs");
const diagnostics = read("src/runtime/diagnostics.cjs");
const updater = read("src/runtime/update-manager.cjs");
const contracts = [
  [main, "certificate_error_blocked", "certificate-error rejection"],
  [main, "webview_attachment_blocked", "webview attachment rejection"],
  [main, "applySecurityHeaders", "SaaS security headers"],
  [preload, "productionDiagnostics: true", "diagnostics capability"],
  [preload, "controlledUpdates: true", "update capability"],
  [security, "SENSITIVE_KEY", "diagnostic redaction"],
  [diagnostics, "createStoredZip", "sanitized ZIP diagnostic export"],
  [diagnostics, "messagesIncluded: false", "message exclusion evidence"],
  [updater, "UPDATE_CHECKSUM_MISMATCH", "SHA-256 enforcement"],
  [updater, "UPDATE_HOST_NOT_ALLOWLISTED", "update host allowlist"],
  [forge, "EnableEmbeddedAsarIntegrityValidation", "ASAR integrity fuse"],
  [forge, "OnlyLoadAppFromAsar", "ASAR-only fuse"],
  [forge, "hardenedRuntime", "macOS hardened runtime"],
  [forge, "certificateFile", "Windows signing configuration"],
];
for (const [content, needle, label] of contracts) if (!content.includes(needle)) throw new Error(`Missing Mega ZIP 5 contract: ${label}`);
const forbidden = ["nodeIntegration: true", "contextIsolation: false", "sandbox: false", "allowRunningInsecureContent: true", "executeJavaScript(", "rejectUnauthorized: false"];
for (const needle of forbidden) if ([main, preload, forge, security, updater].join("\n").includes(needle)) throw new Error(`Forbidden Mega ZIP 5 pattern detected: ${needle}`);
const opsFiles = [
  "types/angelcare-desktop.d.ts", "lib/desktop-runtime.ts", "components/whatsapp-os/useDesktopProduction.ts", "components/whatsapp-os/DesktopProductionControl.tsx", "app/(protected)/whatsapp-os/session-control/page.tsx",
];
for (const relative of opsFiles) if (!fs.existsSync(path.join(opsRoot, relative))) throw new Error(`Missing Mega ZIP 5 SaaS integration: ${relative}`);
const smoke = spawnSync(process.execPath, [path.join(desktopRoot, "scripts", "smoke-runtime-security.mjs")], { encoding: "utf8" });
if (smoke.status !== 0) throw new Error(`Mega ZIP 5 security smoke failed:\n${smoke.stdout}\n${smoke.stderr}`);
for (const file of ["src/main.cjs", "src/preload.cjs", "src/runtime/security.cjs", "src/runtime/diagnostics.cjs", "src/runtime/update-manager.cjs", "src/runtime/startup-recovery.cjs"]) {
  const result = spawnSync(process.execPath, ["--check", path.join(desktopRoot, file)], { encoding: "utf8" });
  if (result.status !== 0) throw new Error(`Node syntax failed for ${file}:\n${result.stderr}`);
}
console.log("ANGELCARE Desktop Mega ZIP 5 production hardening verified.");
console.log("Security, diagnostics, update verification, installer signing readiness, release tooling and final handover contracts are present.");
