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

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
}

const { mode, repoRoot, opsRoot } = findRoots(cwd);

const checks = [
  {
    file: path.join(opsRoot, "app", "api", "ac-capital-os", "capital-radar", "research", "run", "route.ts"),
    required: "../../../../../../lib/ac-capital-os/server/research-adapter",
    forbidden: "../../../../../lib/ac-capital-os/server/research-adapter",
  },
  {
    file: path.join(opsRoot, "app", "api", "ac-capital-os", "coordinator-cockpit", "email", "mark-sent", "route.ts"),
    required: "../../../../../../lib/ac-capital-os/server/automation-gates",
    forbidden: "../../../../../lib/ac-capital-os/server/automation-gates",
  },
  {
    file: path.join(opsRoot, "app", "api", "ac-capital-os", "coordinator-cockpit", "email", "prepare", "route.ts"),
    required: "../../../../../../lib/ac-capital-os/server/automation-gates",
    forbidden: "../../../../../lib/ac-capital-os/server/automation-gates",
  },
  {
    file: path.join(opsRoot, "app", "api", "ac-capital-os", "coordinator-cockpit", "workflow", "complete-task", "route.ts"),
    required: "../../../../../../lib/ac-capital-os/server/automation-gates",
    forbidden: "../../../../../lib/ac-capital-os/server/automation-gates",
  },
];

for (const check of checks) {
  assert(exists(check.file), `missing file: ${check.file}`);
  const content = fs.readFileSync(check.file, "utf8");
  assert(content.includes(check.required), `${path.relative(repoRoot, check.file)} missing corrected import ${check.required}`);
  assert(!content.includes(check.forbidden), `${path.relative(repoRoot, check.file)} still contains old import ${check.forbidden}`);
}

assert(exists(path.join(opsRoot, "lib", "ac-capital-os", "server", "research-adapter.ts")), "research-adapter.ts missing");
assert(exists(path.join(opsRoot, "lib", "ac-capital-os", "server", "automation-gates.ts")), "automation-gates.ts missing");

console.log("AC_CAPITAL_OS_MZ13_NESTED_API_IMPORT_PATH_FIX_VERIFIED");
console.log(`Detected mode: ${mode}`);
console.log("Corrected nested API imports now reach apps/ops-web/lib/ac-capital-os/server/*.");
console.log("Next: cd apps/ops-web && npx tsc -p tsconfig.json --noEmit --pretty false");
