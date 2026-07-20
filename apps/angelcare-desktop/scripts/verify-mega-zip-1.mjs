import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = path.resolve(import.meta.dirname, "..");
const requiredFiles = [
  "package.json",
  "forge.config.cjs",
  "config/defaults.json",
  "src/main.cjs",
  "src/preload.cjs",
  "src/shell-preload.cjs",
  "src/runtime/config.cjs",
  "src/runtime/logger.cjs",
  "src/runtime/url-policy.cjs",
  "src/shell/index.html",
  "src/shell/styles.css",
  "src/shell/shell.js",
  "assets/icon.png",
  "assets/icon.ico",
  "assets/icon.icns",
  "assets/angelcare-logo-original.png",
  "scripts/build-macos-dmg.mjs",
];

for (const relative of requiredFiles) {
  const file = path.join(root, relative);
  if (!fs.existsSync(file)) throw new Error(`Missing required desktop file: ${relative}`);
}

const syntaxFiles = [
  "forge.config.cjs",
  "src/main.cjs",
  "src/preload.cjs",
  "src/shell-preload.cjs",
  "src/runtime/config.cjs",
  "src/runtime/logger.cjs",
  "src/runtime/url-policy.cjs",
  "src/shell/shell.js",
  "scripts/build-macos-dmg.mjs",
];

for (const relative of syntaxFiles) {
  const result = spawnSync(process.execPath, ["--check", path.join(root, relative)], { encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(`Syntax verification failed for ${relative}:\n${result.stderr || result.stdout}`);
  }
}

const main = fs.readFileSync(path.join(root, "src/main.cjs"), "utf8");
const preload = fs.readFileSync(path.join(root, "src/preload.cjs"), "utf8");
const forge = fs.readFileSync(path.join(root, "forge.config.cjs"), "utf8");
const dmgBuilder = fs.readFileSync(path.join(root, "scripts/build-macos-dmg.mjs"), "utf8");
const contracts = [
  [main, "new WebContentsView", "WebContentsView runtime"],
  [main, "persist:angelcare-saas", "persistent SaaS session"],
  [main, "nodeIntegration: false", "Node integration disabled"],
  [main, "contextIsolation: true", "context isolation"],
  [main, "sandbox: true", "renderer sandbox"],
  [main, "setPermissionRequestHandler", "permission governance"],
  [main, "setWindowOpenHandler", "window navigation governance"],
  [main, "requestSingleInstanceLock", "single instance lock"],
  [main, "render-process-gone", "renderer crash recovery"],
  [preload, "contextBridge.exposeInMainWorld", "minimal desktop detection bridge"],
  [forge, "@electron-forge/maker-zip", "macOS ZIP packaging"],
  [forge, "@electron-forge/maker-squirrel", "Windows Setup packaging"],
  [forge, "FusesPlugin", "Electron fuse hardening"],
  [dmgBuilder, "/usr/bin/hdiutil", "native macOS DMG creation"],
  [dmgBuilder, "hdiutil\", [\"verify\"", "native DMG verification"],
];

for (const [content, needle, label] of contracts) {
  if (!content.includes(needle)) throw new Error(`Missing Mega ZIP 1 contract: ${label}`);
}
if (forge.includes("@electron-forge/maker-dmg")) {
  throw new Error("Native DMG hotfix requires maker-dmg to be removed from Forge configuration.");
}

const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
if (packageJson.devDependencies?.electron !== "43.1.1") {
  throw new Error("Mega ZIP 1 must pin Electron 43.1.1.");
}
if (packageJson.devDependencies?.["@electron-forge/cli"] !== "7.11.2") {
  throw new Error("Mega ZIP 1 must pin Electron Forge 7.11.2.");
}
for (const forbidden of ["@electron-forge/maker-dmg", "electron-installer-dmg", "appdmg", "macos-alias"]) {
  if (packageJson.devDependencies?.[forbidden] || packageJson.dependencies?.[forbidden]) {
    throw new Error(`Obsolete native DMG dependency remains configured: ${forbidden}`);
  }
}
if (!packageJson.scripts?.["make:mac:x64"]?.includes("build-macos-dmg.mjs x64")) {
  throw new Error("Intel macOS build must use the native DMG builder.");
}
if (!packageJson.scripts?.["make:mac:arm64"]?.includes("build-macos-dmg.mjs arm64")) {
  throw new Error("Apple Silicon build must use the native DMG builder.");
}

const smoke = spawnSync(process.execPath, [path.join(root, "scripts", "smoke-config.mjs")], { encoding: "utf8" });
if (smoke.status !== 0) throw new Error(smoke.stderr || smoke.stdout || "Configuration smoke test failed.");

console.log("ANGELCARE Desktop Mega ZIP 1 foundation verified.");
console.log("Native hdiutil DMG pipeline verified; no appdmg or macos-alias dependency is required.");
