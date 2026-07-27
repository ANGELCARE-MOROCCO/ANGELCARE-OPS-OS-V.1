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
  throw new Error("Unable to detect repository root or apps/ops-web root.");
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

const migrationSrc = path.join(packageRoot, "supabase", "migrations", "20260727_ac_capital_os_mz13_production_wiring.sql");
const migrationDest = path.join(repoRoot, "supabase", "migrations", "20260727_ac_capital_os_mz13_production_wiring.sql");
fs.mkdirSync(path.dirname(migrationDest), { recursive: true });
fs.copyFileSync(migrationSrc, migrationDest);

const docsDest = path.join(repoRoot, "AC_CAPITAL_OS_MZ13", "docs");
fs.mkdirSync(docsDest, { recursive: true });
copyRecursive(path.join(packageRoot, "docs"), docsDest);

console.log("AC CAPITAL OS MZ13 installer");
console.log(`Detected mode: ${mode}`);
console.log(`Repository root: ${repoRoot}`);
console.log(`Ops-web root: ${opsRoot}`);
console.log("MZ13 production wiring files copied successfully.");
console.log("Protected page installed: apps/ops-web/app/(protected)/ac-capital-os/page.tsx");
console.log("Production route installed: apps/ops-web/app/(protected)/ac-capital-os/production/page.tsx");
console.log("Server repository layer installed: apps/ops-web/lib/ac-capital-os/server/*");
console.log("AC Capital API routes upgraded to live/fallback mode.");
console.log("MZ13 SQL copied but not executed automatically.");
console.log("Next: node ./AC_CAPITAL_OS_MZ13/scripts/verify_ac_capital_os_mz13.mjs");
console.log("No build, no git stage, no commit, no push.");
