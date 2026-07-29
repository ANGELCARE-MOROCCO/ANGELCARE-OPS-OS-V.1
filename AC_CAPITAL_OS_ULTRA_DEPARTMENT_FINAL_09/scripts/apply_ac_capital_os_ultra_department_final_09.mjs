#!/usr/bin/env node

import { copyFile, mkdir, readFile, stat } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = join(packageRoot, "APPLIED_FILES_MANIFEST.json");

async function exists(path) {
  try { await stat(path); return true; } catch { return false; }
}

async function findRepositoryRoot(start) {
  let current = resolve(start);
  for (let depth = 0; depth < 8; depth += 1) {
    if (await exists(join(current, "apps", "ops-web"))) return current;
    const parent = dirname(current);
    if (parent === current) break;
    current = parent;
  }
  throw new Error(`Repository root not found from ${start}. Expected apps/ops-web.`);
}

function timestamp() {
  return new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-");
}

const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const repositoryRoot = await findRepositoryRoot(process.cwd());
const backupRoot = join(repositoryRoot, ".angelcare_backups", `ac-capital-ultra-department-final-09-${timestamp()}`);
let installed = 0;
let backedUp = 0;

for (const entry of manifest.install_files) {
  const relative = entry.path;
  const source = join(packageRoot, relative);
  const destination = join(repositoryRoot, relative);

  if (!(await exists(source))) throw new Error(`Package payload missing: ${relative}`);
  await mkdir(dirname(destination), { recursive: true });

  if (await exists(destination)) {
    const backup = join(backupRoot, relative);
    await mkdir(dirname(backup), { recursive: true });
    await copyFile(destination, backup);
    backedUp += 1;
  }

  await copyFile(source, destination);
  installed += 1;
}

console.log("");
console.log("AC_CAPITAL_OS_ULTRA_DEPARTMENT_FINAL_09_INSTALLED");
console.log(`Repository root: ${repositoryRoot}`);
console.log(`Files installed: ${installed}`);
console.log(`Files backed up: ${backedUp}`);
console.log(`Backup: ${backupRoot}`);
console.log("SQL copied but NOT executed: supabase/migrations/20260729_ac_capital_os_ultra_department_final_09.sql");
console.log("Rollback SQL copied but NOT executed: supabase/migrations/20260729_ac_capital_os_ultra_department_final_09_rollback.sql");
console.log("No TypeScript, build, SQL, Git, provider request, commit, push or deployment command was performed.");
