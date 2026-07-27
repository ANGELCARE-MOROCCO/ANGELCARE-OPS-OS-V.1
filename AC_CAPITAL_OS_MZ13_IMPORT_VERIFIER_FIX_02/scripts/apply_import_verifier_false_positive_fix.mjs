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

const { mode, repoRoot } = findRoots(cwd);
const target = path.join(repoRoot, "AC_CAPITAL_OS_MZ13_IMPORT_PATH_FIX_01", "scripts", "verify_mz13_nested_api_import_path_fix.mjs");

if (!exists(target)) {
  throw new Error(`Target verifier not found: ${target}`);
}

const before = fs.readFileSync(target, "utf8");
const backupDir = path.join(repoRoot, ".angelcare_backups", `ac-capital-os-mz13-import-verifier-false-positive-fix-${new Date().toISOString().replace(/[:.]/g, "-")}`);
fs.mkdirSync(backupDir, { recursive: true });
fs.writeFileSync(path.join(backupDir, "verify_mz13_nested_api_import_path_fix.mjs.before-false-positive-fix"), before, "utf8");

const fixed = `import fs from "node:fs";
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

function assert(condition, message) {
  if (!condition) {
    console.error(\`FAIL: \${message}\`);
    process.exit(1);
  }
}

function readImportPath(file, importedSymbol) {
  const content = fs.readFileSync(file, "utf8");
  const escaped = importedSymbol.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&");
  const re = new RegExp(\`import\\\\s+\\\\{\\\\s*\${escaped}\\\\s*\\\\}\\\\s+from\\\\s+["']([^"']+)["']\`);
  const match = content.match(re);
  return match?.[1] || null;
}

const { mode, repoRoot, opsRoot } = findRoots(cwd);

const checks = [
  {
    file: path.join(opsRoot, "app", "api", "ac-capital-os", "capital-radar", "research", "run", "route.ts"),
    symbol: "runResearchAdapter",
    expected: "../../../../../../lib/ac-capital-os/server/research-adapter",
  },
  {
    file: path.join(opsRoot, "app", "api", "ac-capital-os", "coordinator-cockpit", "email", "mark-sent", "route.ts"),
    symbol: "markEmailSentManually",
    expected: "../../../../../../lib/ac-capital-os/server/automation-gates",
  },
  {
    file: path.join(opsRoot, "app", "api", "ac-capital-os", "coordinator-cockpit", "email", "prepare", "route.ts"),
    symbol: "prepareEmailDraft",
    expected: "../../../../../../lib/ac-capital-os/server/automation-gates",
  },
  {
    file: path.join(opsRoot, "app", "api", "ac-capital-os", "coordinator-cockpit", "workflow", "complete-task", "route.ts"),
    symbol: "completeCoordinatorTask",
    expected: "../../../../../../lib/ac-capital-os/server/automation-gates",
  },
];

for (const check of checks) {
  assert(exists(check.file), \`missing file: \${check.file}\`);
  const actual = readImportPath(check.file, check.symbol);
  assert(actual, \`\${path.relative(repoRoot, check.file)} missing import for \${check.symbol}\`);
  assert(
    actual === check.expected,
    \`\${path.relative(repoRoot, check.file)} has wrong import for \${check.symbol}. Expected \${check.expected}, got \${actual}\`
  );
}

assert(exists(path.join(opsRoot, "lib", "ac-capital-os", "server", "research-adapter.ts")), "research-adapter.ts missing");
assert(exists(path.join(opsRoot, "lib", "ac-capital-os", "server", "automation-gates.ts")), "automation-gates.ts missing");

console.log("AC_CAPITAL_OS_MZ13_NESTED_API_IMPORT_PATH_FIX_VERIFIED");
console.log(\`Detected mode: \${mode}\`);
console.log("Corrected nested API imports now reach apps/ops-web/lib/ac-capital-os/server/*.");
console.log("Verifier false-positive guard: exact import path comparison active.");
console.log("Next: cd apps/ops-web && npx tsc -p tsconfig.json --noEmit --pretty false");
`;

fs.writeFileSync(target, fixed, "utf8");

console.log("AC CAPITAL OS MZ13 nested import verifier false-positive fix applied.");
console.log(`Detected mode: ${mode}`);
console.log(`Touched file: ${path.relative(repoRoot, target)}`);
console.log(`Backup created at: ${path.relative(repoRoot, backupDir)}`);
console.log("Reason: the old 5-level import string is a substring of the corrected 6-level import string.");
console.log("Next: node ./AC_CAPITAL_OS_MZ13_IMPORT_VERIFIER_FIX_02/scripts/verify_import_verifier_false_positive_fix.mjs");
