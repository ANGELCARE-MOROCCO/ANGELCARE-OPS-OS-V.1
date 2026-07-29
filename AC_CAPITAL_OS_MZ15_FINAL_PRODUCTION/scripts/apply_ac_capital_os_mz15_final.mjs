import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { detectRoots, exists, walk } from "./_lib.mjs";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { mode, repoRoot, opsRoot } = detectRoots();
const sourceOps = path.join(packageRoot, "files", "apps", "ops-web");
const migrationName = "20260727_ac_capital_os_mz15_final_productization.sql";
const backupRoot = path.join(repoRoot, ".angelcare_backups", `ac-capital-os-mz15-final-${new Date().toISOString().replace(/[:.]/g, "-")}`);
let copied = 0, backedUp = 0;

for (const source of walk(sourceOps)) {
  const rel = path.relative(sourceOps, source);
  const target = path.join(opsRoot, rel);
  if (exists(target)) {
    const backup = path.join(backupRoot, "apps", "ops-web", rel);
    fs.mkdirSync(path.dirname(backup), { recursive: true });
    fs.copyFileSync(target, backup); backedUp += 1;
  }
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target); copied += 1;
}
const sourceMigration = path.join(packageRoot, "supabase", "migrations", migrationName);
const targetMigration = path.join(repoRoot, "supabase", "migrations", migrationName);
if (exists(targetMigration)) {
  const backup = path.join(backupRoot, "supabase", "migrations", migrationName);
  fs.mkdirSync(path.dirname(backup), { recursive: true }); fs.copyFileSync(targetMigration, backup); backedUp += 1;
}
fs.mkdirSync(path.dirname(targetMigration), { recursive: true }); fs.copyFileSync(sourceMigration, targetMigration); copied += 1;

console.log("AC CAPITAL OS MZ15 Final Productization installer");
console.log(`Detected mode: ${mode}`);
console.log(`Repository root: ${repoRoot}`);
console.log(`Ops-web root: ${opsRoot}`);
console.log(`Files copied: ${copied}`);
console.log(`Existing files backed up: ${backedUp}`);
console.log(`Backup: ${path.relative(repoRoot, backupRoot)}`);
console.log("Installed 18 dedicated protected pages, specialized workflows, API routes, server helpers, migration and evidence tooling.");
console.log("No SQL executed. No build. No git stage, commit or push. No live AI or automatic external action enabled.");
console.log("Next: node ./AC_CAPITAL_OS_MZ15_FINAL_PRODUCTION/scripts/verify_ac_capital_os_mz15_final.mjs");
