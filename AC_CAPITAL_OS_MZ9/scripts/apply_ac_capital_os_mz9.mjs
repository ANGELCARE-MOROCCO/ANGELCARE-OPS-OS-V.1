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
  const repoCandidate = start;
  const opsFromRepo = path.join(repoCandidate, "apps", "ops-web");
  if (exists(opsFromRepo)) {
    return { mode: "repository-root", repoRoot: repoCandidate, opsRoot: opsFromRepo };
  }
  if (exists(path.join(start, "app")) && exists(path.join(start, "package.json"))) {
    const maybeRepo = path.resolve(start, "..", "..");
    return { mode: "ops-web-root", repoRoot: maybeRepo, opsRoot: start };
  }
  throw new Error("Unable to detect repository root or apps/ops-web root. Run from ~/Desktop/angelcare-platform or apps/ops-web.");
}

function copyRecursive(src, dest) {
  if (!exists(src)) throw new Error(`Missing source: ${src}`);
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

const { mode, repoRoot, opsRoot } = findRoots(cwd);
const filesOpsRoot = path.join(packageRoot, "files", "apps", "ops-web");
copyRecursive(filesOpsRoot, opsRoot);

const migrationSrc = path.join(packageRoot, "supabase", "migrations", "20260727_ac_capital_os_mz9_capital_pipeline_crm.sql");
const migrationDest = path.join(repoRoot, "supabase", "migrations", "20260727_ac_capital_os_mz9_capital_pipeline_crm.sql");
if (exists(migrationSrc)) {
  fs.mkdirSync(path.dirname(migrationDest), { recursive: true });
  fs.copyFileSync(migrationSrc, migrationDest);
}

console.log("AC CAPITAL OS MZ9 installer");
console.log(`Detected mode: ${mode}`);
console.log(`Repository root: ${repoRoot}`);
console.log(`Ops-web root: ${opsRoot}`);
console.log("AC CAPITAL OS Mega ZIP 9 files copied successfully.");
console.log("Route installed at: apps/ops-web/app/(protected)/ac-capital-os/page.tsx");
console.log("Workspace route installed at: apps/ops-web/app/(protected)/ac-capital-os/pipeline/page.tsx");
console.log("API installed at: apps/ops-web/app/api/ac-capital-os/capital-pipeline/route.ts");
console.log("Migration installed at: supabase/migrations/20260727_ac_capital_os_mz9_capital_pipeline_crm.sql");
console.log("Next: node ./AC_CAPITAL_OS_MZ9/scripts/verify_ac_capital_os_mz9.mjs");
console.log("No build, no git stage, no commit, no push.");
