import fs from "node:fs";
import path from "node:path";

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

  throw new Error("Run from repository root or apps/ops-web.");
}

function patchFile(file, oldImport, newImport) {
  if (!exists(file)) {
    throw new Error(`Missing target file: ${file}`);
  }

  const before = fs.readFileSync(file, "utf8");

  if (before.includes(newImport) && !before.includes(oldImport)) {
    return { changed: false, alreadyFixed: true };
  }

  if (!before.includes(oldImport)) {
    throw new Error(`Expected old import not found in ${file}: ${oldImport}`);
  }

  const after = before.split(oldImport).join(newImport);
  fs.writeFileSync(file, after, "utf8");
  return { changed: true, alreadyFixed: false };
}

const { mode, repoRoot, opsRoot } = findRoots(cwd);

const fixes = [
  {
    file: path.join(opsRoot, "app", "api", "ac-capital-os", "capital-radar", "research", "run", "route.ts"),
    oldImport: "../../../../../lib/ac-capital-os/server/research-adapter",
    newImport: "../../../../../../lib/ac-capital-os/server/research-adapter",
  },
  {
    file: path.join(opsRoot, "app", "api", "ac-capital-os", "coordinator-cockpit", "email", "mark-sent", "route.ts"),
    oldImport: "../../../../../lib/ac-capital-os/server/automation-gates",
    newImport: "../../../../../../lib/ac-capital-os/server/automation-gates",
  },
  {
    file: path.join(opsRoot, "app", "api", "ac-capital-os", "coordinator-cockpit", "email", "prepare", "route.ts"),
    oldImport: "../../../../../lib/ac-capital-os/server/automation-gates",
    newImport: "../../../../../../lib/ac-capital-os/server/automation-gates",
  },
  {
    file: path.join(opsRoot, "app", "api", "ac-capital-os", "coordinator-cockpit", "workflow", "complete-task", "route.ts"),
    oldImport: "../../../../../lib/ac-capital-os/server/automation-gates",
    newImport: "../../../../../../lib/ac-capital-os/server/automation-gates",
  },
];

const backupDir = path.join(repoRoot, ".angelcare_backups", `ac-capital-os-mz13-nested-api-import-path-fix-${new Date().toISOString().replace(/[:.]/g, "-")}`);
fs.mkdirSync(backupDir, { recursive: true });

const touched = [];

for (const fix of fixes) {
  const rel = path.relative(repoRoot, fix.file);
  fs.copyFileSync(fix.file, path.join(backupDir, rel.replaceAll(path.sep, "__") + ".before-import-fix"));
  const result = patchFile(fix.file, fix.oldImport, fix.newImport);
  if (result.changed) touched.push(rel);
}

console.log("AC CAPITAL OS MZ13 nested API import path fix applied.");
console.log(`Detected mode: ${mode}`);
console.log(`Repository root: ${repoRoot}`);
console.log(`Touched files: ${touched.length ? touched.join(", ") : "none; already fixed"}`);
console.log(`Backup created at: ${path.relative(repoRoot, backupDir)}`);
console.log("Reason: nested route handlers were one ../ short when importing lib/ac-capital-os/server modules.");
console.log("Next: node ./AC_CAPITAL_OS_MZ13_IMPORT_PATH_FIX_01/scripts/verify_mz13_nested_api_import_path_fix.mjs");
