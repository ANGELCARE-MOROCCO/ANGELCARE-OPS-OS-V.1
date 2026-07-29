import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const exists = (file) => fs.existsSync(file);
const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function detect(start = process.cwd()) {
  if (exists(path.join(start, "apps", "ops-web"))) return { repoRoot: start, opsRoot: path.join(start, "apps", "ops-web"), mode: "repository-root" };
  if (exists(path.join(start, "app")) && exists(path.join(start, "components")) && exists(path.join(start, "lib"))) {
    const repositoryCandidate = path.resolve(start, "..", "..");
    return { repoRoot: repositoryCandidate, opsRoot: start, mode: "ops-web-root" };
  }
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

const payloadRoot = path.join(packageRoot, "files", "apps", "ops-web");
const migrationSource = path.join(packageRoot, "supabase", "migrations", "20260728_ac_capital_os_runtime_truth_repair_01.sql");
const { repoRoot, opsRoot, mode } = detect();

for (const required of [
  path.join(opsRoot, "lib", "ai-provider-control", "governor.ts"),
  path.join(opsRoot, "lib", "ai-provider-control", "gemini-runtime.ts"),
  path.join(opsRoot, "lib", "ac-capital-os", "server", "ai-provider-bridge.ts"),
  path.join(opsRoot, "lib", "ac-capital-os", "server", "feature-flags.ts"),
  path.join(opsRoot, "lib", "ac-capital-os", "server", "mz15-api.ts"),
  path.join(opsRoot, "components", "ac-capital-os", "core", "AcCapitalShell.tsx"),
]) {
  if (!exists(required)) throw new Error(`Prerequisite source file missing: ${required}`);
}
if (!exists(migrationSource)) throw new Error(`Migration payload missing: ${migrationSource}`);

const backupRoot = path.join(repoRoot, ".angelcare_backups", `ac-capital-runtime-truth-repair-01-${new Date().toISOString().replace(/[:.]/g, "-")}`);
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
fs.writeFileSync(path.join(backupRoot, "INSTALL_MANIFEST.json"), JSON.stringify({
  installedAt: new Date().toISOString(),
  package: "AC_CAPITAL_OS_RUNTIME_TRUTH_REPAIR_01",
  changed,
  sqlExecuted: false,
}, null, 2));

console.log("AC CAPITAL OS Runtime Truth Repair 01 installed.");
console.log(`Detected mode: ${mode}`);
console.log(`Repository root: ${repoRoot}`);
console.log(`Ops-web root: ${opsRoot}`);
console.log(`Files installed: ${changed.length}`);
console.log(`Backup: ${path.relative(repoRoot, backupRoot)}`);
console.log(`SQL copied but NOT executed: ${path.relative(repoRoot, migrationTarget)}`);
console.log("No build, SQL execution, git stage, commit, push or deployment was performed.");
console.log("Next: node ./AC_CAPITAL_OS_RUNTIME_TRUTH_REPAIR_01/scripts/verify_ac_capital_os_runtime_truth_repair_01.mjs");
