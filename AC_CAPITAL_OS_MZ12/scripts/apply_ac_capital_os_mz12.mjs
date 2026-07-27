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
  if (exists(opsFromRepo)) {
    return { mode: "repository-root", repoRoot: start, opsRoot: opsFromRepo };
  }
  if (exists(path.join(start, "app")) && exists(path.join(start, "package.json"))) {
    return { mode: "ops-web-root", repoRoot: path.resolve(start, "..", ".."), opsRoot: start };
  }
  throw new Error("Unable to detect repository root or apps/ops-web root. Run from ~/Desktop/angelcare-platform or apps/ops-web.");
}

function copyRecursive(src, dest) {
  if (!exists(src)) throw new Error(`Missing source: ${src}`);
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
copyRecursive(path.join(packageRoot, "files", "apps", "ops-web"), opsRoot);

const migrationSrc = path.join(packageRoot, "supabase", "migrations", "20260727_ac_capital_os_mz12_strategy_production_command.sql");
const migrationDest = path.join(repoRoot, "supabase", "migrations", "20260727_ac_capital_os_mz12_strategy_production_command.sql");
if (exists(migrationSrc)) {
  fs.mkdirSync(path.dirname(migrationDest), { recursive: true });
  fs.copyFileSync(migrationSrc, migrationDest);
}

console.log("AC CAPITAL OS MZ12 installer");
console.log(`Detected mode: ${mode}`);
console.log(`Repository root: ${repoRoot}`);
console.log(`Ops-web root: ${opsRoot}`);
console.log("AC CAPITAL OS Mega ZIP 12 files copied successfully.");
console.log("Route installed at: apps/ops-web/app/(protected)/ac-capital-os/page.tsx");
console.log("Workspace route installed at: apps/ops-web/app/(protected)/ac-capital-os/strategy/page.tsx");
console.log("API installed at: apps/ops-web/app/api/ac-capital-os/strategy-production-command/route.ts");
console.log("Migration installed at: supabase/migrations/20260727_ac_capital_os_mz12_strategy_production_command.sql");
console.log("SQL was not executed automatically.");
console.log("Next: node ./AC_CAPITAL_OS_MZ12/scripts/verify_ac_capital_os_mz12.mjs");
console.log("No build, no git stage, no commit, no push.");
