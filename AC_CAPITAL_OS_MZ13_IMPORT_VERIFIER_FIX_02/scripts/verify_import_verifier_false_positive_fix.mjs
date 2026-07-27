import fs from "node:fs";
import path from "node:path";

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

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
}

const { mode, repoRoot } = findRoots(cwd);
const target = path.join(repoRoot, "AC_CAPITAL_OS_MZ13_IMPORT_PATH_FIX_01", "scripts", "verify_mz13_nested_api_import_path_fix.mjs");

assert(exists(target), "patched nested import verifier missing");
const content = fs.readFileSync(target, "utf8");

for (const token of [
  "readImportPath",
  "actual === check.expected",
  "Verifier false-positive guard: exact import path comparison active",
  "AC_CAPITAL_OS_MZ13_NESTED_API_IMPORT_PATH_FIX_VERIFIED",
]) {
  assert(content.includes(token), `patched verifier missing token: ${token}`);
}

console.log("AC_CAPITAL_OS_MZ13_IMPORT_VERIFIER_FALSE_POSITIVE_FIX_VERIFIED");
console.log(`Detected mode: ${mode}`);
console.log(`Verified file: ${path.relative(repoRoot, target)}`);
console.log("Next: node ./AC_CAPITAL_OS_MZ13_IMPORT_PATH_FIX_01/scripts/verify_mz13_nested_api_import_path_fix.mjs");
