import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const packageRoot = path.resolve(path.dirname(__filename), "..");
const cwd = process.cwd();

function exists(p) {
  return fs.existsSync(p);
}

function findRoots(start) {
  const opsFromRepo = path.join(start, "apps", "ops-web");
  if (exists(opsFromRepo)) return { mode: "repository-root", repoRoot: start, opsRoot: opsFromRepo };
  if (exists(path.join(start, "app")) && exists(path.join(start, "package.json"))) {
    return { mode: "ops-web-root", repoRoot: path.resolve(start, "..", ".."), opsRoot: start };
  }
  throw new Error("Run from repository root or apps/ops-web.");
}

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) copyRecursive(path.join(src, entry), path.join(dest, entry));
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

const { mode, repoRoot, opsRoot } = findRoots(cwd);
const source = path.join(packageRoot, "files", "apps", "ops-web", "app", "api", "ac-capital-os", "coordinator-cockpit", "route.ts");
const target = path.join(opsRoot, "app", "api", "ac-capital-os", "coordinator-cockpit", "route.ts");

if (exists(target)) {
  const backupDir = path.join(repoRoot, ".angelcare_backups", `ac-capital-os-mz10-coordinator-api-restore-${new Date().toISOString().replace(/[:.]/g, "-")}`);
  fs.mkdirSync(backupDir, { recursive: true });
  fs.copyFileSync(target, path.join(backupDir, "route.ts.before-restore"));
  console.log(`Existing coordinator-cockpit API backed up at: ${path.relative(repoRoot, backupDir)}`);
}

copyRecursive(source, target);

console.log("AC CAPITAL OS MZ10 coordinator-cockpit API restore applied.");
console.log(`Detected mode: ${mode}`);
console.log(`Installed: ${path.relative(repoRoot, target)}`);
console.log("Now rerun: node ./AC_CAPITAL_OS_MZ11/scripts/verify_ac_capital_os_mz11.mjs");
console.log("Then run TypeScript static check.");
