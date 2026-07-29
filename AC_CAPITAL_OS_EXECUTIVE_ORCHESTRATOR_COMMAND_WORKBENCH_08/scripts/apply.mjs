#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(here, "..");
const payloadRoot = path.join(packageRoot, "payload");

function locateRepository(start) {
  const candidates = [
    start,
    path.resolve(start, ".."),
    "/Users/user/Desktop/angelcare-platform",
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(path.join(candidate, "apps", "ops-web"))) return candidate;
  }

  throw new Error("FAIL: AngelCare repository root was not found.");
}

function timestamp() {
  return new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-");
}

function ensureDirectory(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

const repositoryRoot = locateRepository(process.cwd());
const backupRoot = path.join(
  repositoryRoot,
  ".angelcare_backups",
  `ac-capital-orchestrator-command-workbench-08-${timestamp()}`,
);

const payloadFiles = [
  "apps/ops-web/app/(protected)/ac-capital-os/orchestrator/page.tsx",
  "apps/ops-web/app/api/ac-capital-os/orchestrator/route.ts",
  "apps/ops-web/components/ac-capital-os/pages/orchestrator/OrchestratorPage.tsx",
  "apps/ops-web/components/ac-capital-os/pages/orchestrator/orchestrator.module.css",
  "apps/ops-web/components/ac-capital-os/core/Overlay.tsx",
  "apps/ops-web/lib/ac-capital-os/server/capital-orchestrator.ts",
];

for (const relativePath of payloadFiles) {
  const source = path.join(payloadRoot, relativePath);
  const target = path.join(repositoryRoot, relativePath);
  const backup = path.join(backupRoot, relativePath);

  if (!fs.existsSync(source)) throw new Error(`FAIL: Package payload missing: ${relativePath}`);

  if (fs.existsSync(target)) {
    ensureDirectory(backup);
    fs.copyFileSync(target, backup);
  }

  ensureDirectory(target);
  fs.copyFileSync(source, target);
}

const shellPath = path.join(repositoryRoot, "apps/ops-web/components/ac-capital-os/core/AcCapitalShell.tsx");
if (!fs.existsSync(shellPath)) throw new Error(`FAIL: Shared shell missing: ${shellPath}`);
const shellBackup = path.join(backupRoot, "apps/ops-web/components/ac-capital-os/core/AcCapitalShell.tsx");
ensureDirectory(shellBackup);
fs.copyFileSync(shellPath, shellBackup);
let shell = fs.readFileSync(shellPath, "utf8");

if (!shell.includes('orchestrator: { label: "Executive Orchestration"')) {
  const marker = '  production: { label: "Release Authority", institution: "Production Readiness Tower", accent: "#047857", accentSoft: "#d1fae5" },\n};';
  if (!shell.includes(marker)) throw new Error("FAIL: Shell workspace-profile insertion marker was not found.");
  shell = shell.replace(marker, '  production: { label: "Release Authority", institution: "Production Readiness Tower", accent: "#047857", accentSoft: "#d1fae5" },\n  orchestrator: { label: "Executive Orchestration", institution: "Capital Executive Orchestrator", accent: "#1d4ed8", accentSoft: "#dbeafe" },\n};');
}

const oldProfile = 'function profileFor(workspaceKey: string) {\n  return workspaceProfiles[workspaceKey] || { label: "Capital Institution", institution: workspaceKey.replaceAll("-", " "), accent: "#1d4ed8", accentSoft: "#dbeafe" };\n}';
if (shell.includes(oldProfile)) {
  shell = shell.replace(oldProfile, 'function profileFor(workspaceKey?: string) {\n  const safeWorkspaceKey = typeof workspaceKey === "string" && workspaceKey.trim() ? workspaceKey.trim() : "orchestrator";\n  return workspaceProfiles[safeWorkspaceKey] || { label: "Capital Institution", institution: safeWorkspaceKey.replaceAll("-", " "), accent: "#1d4ed8", accentSoft: "#dbeafe" };\n}');
}

fs.writeFileSync(shellPath, shell);

const navigationPath = path.join(repositoryRoot, "apps/ops-web/components/ac-capital-os/core/navigation.ts");
if (!fs.existsSync(navigationPath)) throw new Error(`FAIL: Navigation file missing: ${navigationPath}`);
const navigationBackup = path.join(backupRoot, "apps/ops-web/components/ac-capital-os/core/navigation.ts");
ensureDirectory(navigationBackup);
fs.copyFileSync(navigationPath, navigationBackup);
let navigation = fs.readFileSync(navigationPath, "utf8");
if (!navigation.includes('key: "orchestrator"')) {
  const marker = '  { key: "floor", label: "Capital Command Floor", href: "/ac-capital-os", group: "Executive" },';
  if (!navigation.includes(marker)) throw new Error("FAIL: Navigation insertion marker was not found.");
  navigation = navigation.replace(marker, `${marker}\n  { key: "orchestrator", label: "Capital Executive Orchestrator", href: "/ac-capital-os/orchestrator", group: "Executive", attention: true },`);
}
if (!navigation.includes('["Open Capital Orchestrator"')) {
  const paletteMarker = 'export const commandPaletteItems = [\n';
  if (!navigation.includes(paletteMarker)) throw new Error("FAIL: Command palette marker was not found.");
  navigation = navigation.replace(paletteMarker, `${paletteMarker}  ["Open Capital Orchestrator", "/ac-capital-os/orchestrator"],\n`);
}
fs.writeFileSync(navigationPath, navigation);

const coreCssPath = path.join(repositoryRoot, "apps/ops-web/components/ac-capital-os/core/core.module.css");
if (!fs.existsSync(coreCssPath)) throw new Error(`FAIL: Shared AC Capital CSS missing: ${coreCssPath}`);
const cssBackup = path.join(backupRoot, "apps/ops-web/components/ac-capital-os/core/core.module.css");
ensureDirectory(cssBackup);
fs.copyFileSync(coreCssPath, cssBackup);
let coreCss = fs.readFileSync(coreCssPath, "utf8");
const cssSignature = "AC_CAPITAL_OVERHEAD_SAFE_PORTAL_08";
if (!coreCss.includes(cssSignature)) {
  coreCss += `\n\n/* ${cssSignature}\n   Body-level overlays occupy only the remaining viewport below AngelCare's global overhead panel.\n   GPU-heavy full-screen blur is intentionally disabled for older macOS hardware. */\n.overlay{top:var(--angelcare-overhead-height,70px)!important;right:0!important;bottom:0!important;left:0!important;height:auto!important;background:rgba(4,13,26,.76)!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important}\n.drawer{top:0!important;bottom:0!important;height:100%!important;max-height:100%!important;box-shadow:-12px 0 32px rgba(4,13,26,.28)!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important;filter:none!important}\n.dialog{max-height:calc(100% - 28px)!important;box-shadow:0 24px 58px rgba(4,13,26,.34)!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important;filter:none!important}\n.overlayFooter,.drawerFooter{background:#fff!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important}\n@media(max-width:700px){.overlay{top:var(--angelcare-overhead-height,70px)!important}.drawer{width:100vw!important}.dialog{max-height:calc(100% - 12px)!important}}\n`;
}
fs.writeFileSync(coreCssPath, coreCss);

console.log("AC_CAPITAL_OS_EXECUTIVE_ORCHESTRATOR_COMMAND_WORKBENCH_08_INSTALLED");
console.log(`Repository root: ${repositoryRoot}`);
console.log(`Files installed: ${payloadFiles.length}`);
console.log(`Backup: ${path.relative(repositoryRoot, backupRoot)}`);
console.log("Shared overlay: body portal + global-overhead offset installed");
console.log("Orchestrator: clickable workflows, agents, events, integrity, approvals, doctrine and action evidence installed");
console.log("No SQL, TypeScript, build, Git, provider request, commit, push or deployment was performed.");
