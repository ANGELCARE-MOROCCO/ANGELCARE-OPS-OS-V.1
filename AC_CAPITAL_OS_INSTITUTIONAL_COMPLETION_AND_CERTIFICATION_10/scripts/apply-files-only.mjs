#!/usr/bin/env node
import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(await readFile(path.join(packageRoot, "APPLIED_FILES_MANIFEST.json"), "utf8"));

async function exists(candidate) {
  try { return (await stat(candidate)).isFile(); } catch { return false; }
}

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

async function locateRepository() {
  const candidates = [
    process.cwd(),
    path.resolve(process.cwd(), ".."),
    path.resolve(packageRoot, ".."),
  ];
  for (const candidate of candidates) {
    if (await exists(path.join(candidate, "apps/ops-web/package.json")) && await exists(path.join(candidate, "supabase/migrations/20260729_ac_capital_os_ultra_department_final_09.sql"))) {
      return candidate;
    }
  }
  throw new Error("AC_CAPITAL_IC10_REPOSITORY_NOT_FOUND");
}

const repositoryRoot = await locateRepository();
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupRoot = path.join(repositoryRoot, ".angelcare_backups", `ac-capital-ic10-${stamp}`);
let installed = 0;
let backedUp = 0;

for (const entry of manifest.files) {
  const source = path.join(packageRoot, entry.source);
  const target = path.join(repositoryRoot, entry.target);
  const sourceBytes = await readFile(source);
  if (sha256(sourceBytes) !== entry.sha256) throw new Error(`IC10_PACKAGE_HASH_MISMATCH:${entry.source}`);
  if (await exists(target)) {
    const backup = path.join(backupRoot, entry.target);
    await mkdir(path.dirname(backup), { recursive: true });
    await copyFile(target, backup);
    backedUp += 1;
  }
  await mkdir(path.dirname(target), { recursive: true });
  await copyFile(source, target);
  const installedBytes = await readFile(target);
  if (sha256(installedBytes) !== entry.sha256) throw new Error(`IC10_INSTALLED_HASH_MISMATCH:${entry.target}`);
  installed += 1;
}

console.log("AC_CAPITAL_OS_INSTITUTIONAL_COMPLETION_AND_CERTIFICATION_10_INSTALLED");
console.log(`Repository root: ${repositoryRoot}`);
console.log(`Files installed: ${installed}`);
console.log(`Existing files backed up: ${backedUp}`);
console.log(`Backup: ${path.relative(repositoryRoot, backupRoot)}`);
console.log("SQL copied but NOT executed.");
console.log("No TypeScript, build, Git, provider request, commit, push or deployment command was performed.");
