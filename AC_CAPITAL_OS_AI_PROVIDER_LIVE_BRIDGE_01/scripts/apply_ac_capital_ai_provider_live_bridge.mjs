import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const exists = (file) => fs.existsSync(file);

function detect(start = process.cwd()) {
  if (exists(path.join(start, "apps", "ops-web"))) return { repoRoot: start, opsRoot: path.join(start, "apps", "ops-web"), mode: "repository-root" };
  if (exists(path.join(start, "app")) && exists(path.join(start, "package.json"))) return { repoRoot: path.resolve(start, "..", ".."), opsRoot: start, mode: "ops-web-root" };
  throw new Error("Run from the AngelCare repository root or apps/ops-web.");
}

function walk(root) {
  const output = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const absolute = path.join(root, entry.name);
    if (entry.isDirectory()) output.push(...walk(absolute)); else output.push(absolute);
  }
  return output;
}

function sha(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

const packageRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const payloadRoot = path.join(packageRoot, "files", "apps", "ops-web");
const migrationSource = path.join(packageRoot, "supabase", "migrations", "20260728_ac_capital_os_ai_provider_live_bridge.sql");
const { repoRoot, opsRoot, mode } = detect();

for (const required of [
  path.join(opsRoot, "components", "ai-provider-control", "AiProviderControlWorkspace.tsx"),
  path.join(opsRoot, "lib", "ai-provider-control", "governor.ts"),
  path.join(opsRoot, "lib", "ai-provider-control", "gemini-runtime.ts"),
  path.join(opsRoot, "components", "ac-capital-os", "pages", "ai-command", "AiCommandPage.tsx"),
  path.join(opsRoot, "lib", "ac-capital-os", "server", "mz15-api.ts"),
]) {
  if (!exists(required)) throw new Error(`Prerequisite source file missing: ${required}`);
}

const backupRoot = path.join(repoRoot, ".angelcare_backups", `ac-capital-ai-provider-live-bridge-${new Date().toISOString().replace(/[:.]/g, "-")}`);
const changed = [];
for (const source of walk(payloadRoot)) {
  const relative = path.relative(payloadRoot, source);
  const target = path.join(opsRoot, relative);
  if (exists(target)) {
    const backup = path.join(backupRoot, "apps", "ops-web", relative);
    fs.mkdirSync(path.dirname(backup), { recursive: true });
    fs.copyFileSync(target, backup);
  }
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
  changed.push({ relative: path.join("apps", "ops-web", relative), sha256: sha(target) });
}

const migrationTarget = path.join(repoRoot, "supabase", "migrations", path.basename(migrationSource));
if (exists(migrationTarget)) {
  const backup = path.join(backupRoot, "supabase", "migrations", path.basename(migrationTarget));
  fs.mkdirSync(path.dirname(backup), { recursive: true });
  fs.copyFileSync(migrationTarget, backup);
}
fs.mkdirSync(path.dirname(migrationTarget), { recursive: true });
fs.copyFileSync(migrationSource, migrationTarget);
changed.push({ relative: path.relative(repoRoot, migrationTarget), sha256: sha(migrationTarget) });

fs.mkdirSync(backupRoot, { recursive: true });
fs.writeFileSync(path.join(backupRoot, "INSTALL_MANIFEST.json"), JSON.stringify({ installedAt: new Date().toISOString(), package: "AC_CAPITAL_OS_AI_PROVIDER_LIVE_BRIDGE_01", changed }, null, 2));

console.log("AC CAPITAL OS ↔ AI Provider Control live bridge installed.");
console.log(`Detected mode: ${mode}`);
console.log(`Repository root: ${repoRoot}`);
console.log(`Ops-web root: ${opsRoot}`);
console.log(`Files installed: ${changed.length}`);
console.log(`Backup: ${path.relative(repoRoot, backupRoot)}`);
console.log(`SQL copied but not executed: ${path.relative(repoRoot, migrationTarget)}`);
console.log("No build, SQL execution, git stage, commit, push, or deployment was performed.");
console.log("Next: node ./AC_CAPITAL_OS_AI_PROVIDER_LIVE_BRIDGE_01/scripts/verify_ac_capital_ai_provider_live_bridge.mjs");
