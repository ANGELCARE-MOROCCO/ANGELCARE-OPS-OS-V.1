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

  throw new Error("Run from repo root or apps/ops-web.");
}

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
}

const { mode, repoRoot } = findRoots(cwd);
const target = path.join(repoRoot, "AC_CAPITAL_OS_MZ13", "scripts", "verify_ac_capital_os_storage_contract.mjs");

assert(exists(target), "storage verifier missing after patch");
const content = fs.readFileSync(target, "utf8");

for (const token of [
  "feature-flags.ts",
  "AC_CAPITAL_DATA_ROOM_BUCKET",
  "Storage contract verified across storage.ts + feature-flags.ts",
  "AC_CAPITAL_OS_STORAGE_CONTRACT_VERIFIED",
]) {
  assert(content.includes(token), `patched verifier missing token: ${token}`);
}

console.log("AC_CAPITAL_OS_MZ13_STORAGE_QA_FIX_VERIFIED");
console.log(`Detected mode: ${mode}`);
console.log(`Verified file: ${path.relative(repoRoot, target)}`);
console.log("Next: node ./AC_CAPITAL_OS_MZ13/scripts/verify_ac_capital_os_storage_contract.mjs");
