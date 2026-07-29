import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const payloadRoot = path.join(packageRoot, "payload");

function detectRepositoryRoot(start) {
  let current = path.resolve(start);
  for (let depth = 0; depth < 8; depth += 1) {
    if (fs.existsSync(path.join(current, "apps", "ops-web"))) return current;
    if (path.basename(current) === "ops-web" && fs.existsSync(path.join(current, "app"))) {
      const candidate = path.resolve(current, "..", "..");
      if (fs.existsSync(path.join(candidate, "apps", "ops-web"))) return candidate;
    }
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  throw new Error("Repository root not found. Run this installer from angelcare-platform or apps/ops-web.");
}

function walk(directory, base = directory) {
  const output = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) output.push(...walk(absolute, base));
    else output.push(path.relative(base, absolute));
  }
  return output.sort();
}

const repositoryRoot = detectRepositoryRoot(process.cwd());
const timestamp = new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-");
const backupRoot = path.join(repositoryRoot, ".angelcare_backups", `ac-capital-free-provider-operations-05-${timestamp}`);
const files = walk(payloadRoot);
let backups = 0;

for (const relative of files) {
  const source = path.join(payloadRoot, relative);
  const target = path.join(repositoryRoot, relative);
  if (fs.existsSync(target)) {
    const backup = path.join(backupRoot, relative);
    fs.mkdirSync(path.dirname(backup), { recursive: true });
    fs.copyFileSync(target, backup);
    backups += 1;
  }
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

console.log("AC_CAPITAL_OS_FREE_PROVIDER_OPERATIONS_05_INSTALLED");
console.log(`Repository root: ${repositoryRoot}`);
console.log(`Ops-web root: ${path.join(repositoryRoot, "apps", "ops-web")}`);
console.log(`Files installed: ${files.length}`);
console.log(`Existing files backed up: ${backups}`);
console.log(`Backup: ${path.relative(repositoryRoot, backupRoot)}`);
console.log("SQL copied but NOT executed: supabase/migrations/20260728_ac_capital_os_free_provider_operations_05.sql");
console.log("No TypeScript, build, SQL, Git, commit, push, provider request or deployment command was executed.");
