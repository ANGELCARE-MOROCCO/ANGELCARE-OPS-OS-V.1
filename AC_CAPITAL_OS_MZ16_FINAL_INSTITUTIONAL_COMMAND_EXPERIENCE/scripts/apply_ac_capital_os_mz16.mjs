import fs from "node:fs";
import path from "node:path";

const exists = (file) => fs.existsSync(file);
const packageRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

function roots(start = process.cwd()) {
  if (exists(path.join(start, "apps", "ops-web"))) return { repo: start, ops: path.join(start, "apps", "ops-web") };
  if (exists(path.join(start, "app")) && exists(path.join(start, "package.json"))) {
    return { repo: path.resolve(start, "..", ".."), ops: start };
  }
  throw new Error("Run from the repository root or apps/ops-web.");
}

function walk(root) {
  const rows = [];
  if (!exists(root)) return rows;
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const absolute = path.join(root, entry.name);
    if (entry.isDirectory()) rows.push(...walk(absolute));
    else rows.push(absolute);
  }
  return rows;
}

const { repo } = roots();
const payload = path.join(packageRoot, "files");
const files = walk(payload);
if (!files.length) throw new Error("MZ16 payload is empty.");

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const backup = path.join(repo, ".angelcare_backups", `ac-capital-os-mz16-${stamp}`);

for (const source of files) {
  const relative = path.relative(payload, source);
  const target = path.join(repo, relative);
  if (exists(target)) {
    const backupFile = path.join(backup, relative);
    fs.mkdirSync(path.dirname(backupFile), { recursive: true });
    fs.copyFileSync(target, backupFile);
  }
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

const migrationSource = path.join(packageRoot, "supabase", "migrations", "20260728_ac_capital_os_mz16_institutional_command_experience.sql");
const migrationTarget = path.join(repo, "supabase", "migrations", path.basename(migrationSource));
fs.mkdirSync(path.dirname(migrationTarget), { recursive: true });
fs.copyFileSync(migrationSource, migrationTarget);

console.log("AC CAPITAL OS MZ16 source patch applied.");
console.log(`Repository root: ${repo}`);
console.log(`Payload files copied: ${files.length}`);
console.log(`Backup: ${path.relative(repo, backup)}`);
console.log(`Migration copied: ${path.relative(repo, migrationTarget)}`);
console.log("No SQL, build, git stage, commit, push, deploy or provider call was executed.");
console.log("Next: node ./AC_CAPITAL_OS_MZ16_FINAL_INSTITUTIONAL_COMMAND_EXPERIENCE/scripts/verify_ac_capital_os_mz16.mjs");
