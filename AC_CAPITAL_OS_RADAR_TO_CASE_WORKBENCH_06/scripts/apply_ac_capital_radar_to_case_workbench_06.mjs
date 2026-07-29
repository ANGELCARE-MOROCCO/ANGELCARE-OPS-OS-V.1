#!/usr/bin/env node
import { existsSync, mkdirSync, copyFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const payloadRoot = join(packageRoot, "payload");

function detectRepositoryRoot() {
  const cwd = process.cwd();
  const candidates = [cwd, resolve(cwd, ".."), resolve(cwd, "../..")];
  for (const candidate of candidates) {
    if (
      existsSync(join(candidate, "apps", "ops-web")) &&
      existsSync(join(candidate, "supabase", "migrations"))
    ) return candidate;
  }
  throw new Error(
    "FAIL: AngelCare repository root was not detected. Run from /Users/user/Desktop/angelcare-platform or apps/ops-web.",
  );
}

function listFiles(directory) {
  const files = [];
  for (const name of readdirSync(directory)) {
    const absolute = join(directory, name);
    if (statSync(absolute).isDirectory()) files.push(...listFiles(absolute));
    else files.push(absolute);
  }
  return files;
}

const repositoryRoot = detectRepositoryRoot();
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupRoot = join(
  repositoryRoot,
  ".angelcare_backups",
  `ac-capital-radar-to-case-workbench-06-${timestamp}`,
);
const payloadFiles = listFiles(payloadRoot);
let overwritten = 0;
let created = 0;

for (const source of payloadFiles) {
  const rel = relative(payloadRoot, source);
  const target = join(repositoryRoot, rel);
  mkdirSync(dirname(target), { recursive: true });

  if (existsSync(target)) {
    const backup = join(backupRoot, rel);
    mkdirSync(dirname(backup), { recursive: true });
    copyFileSync(target, backup);
    overwritten += 1;
  } else {
    created += 1;
  }

  copyFileSync(source, target);
}

console.log("AC_CAPITAL_OS_RADAR_TO_CASE_WORKBENCH_06_INSTALLED");
console.log(`Repository root: ${repositoryRoot}`);
console.log(`Ops-web root: ${join(repositoryRoot, "apps", "ops-web")}`);
console.log(`Files installed: ${payloadFiles.length}`);
console.log(`Existing files backed up: ${overwritten}`);
console.log(`New files created: ${created}`);
console.log(`Backup: ${relative(repositoryRoot, backupRoot)}`);
console.log("SQL copied but NOT executed: supabase/migrations/20260729_ac_capital_os_radar_to_case_workbench_06.sql");
console.log("No TypeScript, build, SQL, Git, provider request, commit, push or deployment was performed.");
