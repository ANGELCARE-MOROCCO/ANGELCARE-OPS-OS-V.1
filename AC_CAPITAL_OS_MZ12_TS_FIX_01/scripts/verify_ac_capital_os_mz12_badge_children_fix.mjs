import fs from "node:fs";
import path from "node:path";

const cwd = process.cwd();

function exists(p) {
  return fs.existsSync(p);
}

function detectRoots(start) {
  const repoOpsRoot = path.join(start, "apps", "ops-web");
  if (exists(repoOpsRoot)) {
    return { mode: "repository-root", repoRoot: start, opsRoot: repoOpsRoot };
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

const { mode, repoRoot, opsRoot } = detectRoots(cwd);
const target = path.join(opsRoot, "app", "(protected)", "ac-capital-os", "page.tsx");

assert(exists(target), `Target file missing: ${target}`);
const source = fs.readFileSync(target, "utf8");

assert(source.includes("Strategy Simulator & Production Command"), "MZ12 page token missing.");
assert(source.includes("MZ12_AC_CAPITAL_OS_STRATEGY_PRODUCTION_COMMAND"), "MZ12 contract token missing.");
assert(source.includes("{`${test.impact} impact`}"), "Expected template-literal Badge children fix not found.");
assert(!source.includes(">{test.impact} impact</Badge>"), "Old mixed Badge children pattern still exists.");

console.log("AC_CAPITAL_OS_MZ12_BADGE_CHILDREN_TS2322_FIX_VERIFIED");
console.log(`Detected mode: ${mode}`);
console.log(`Verified file: ${path.relative(repoRoot, target)}`);
console.log("Next: cd apps/ops-web && npx tsc -p tsconfig.json --noEmit --pretty false");
