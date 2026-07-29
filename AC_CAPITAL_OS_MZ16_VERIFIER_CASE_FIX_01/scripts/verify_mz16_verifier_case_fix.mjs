import fs from "node:fs";
import path from "node:path";

function exists(file) {
  return fs.existsSync(file);
}

function detectRepo(start = process.cwd()) {
  if (exists(path.join(start, "apps", "ops-web"))) return start;
  if (exists(path.join(start, "app")) && exists(path.join(start, "package.json"))) {
    return path.resolve(start, "..", "..");
  }
  throw new Error("Run from the AngelCare repository root or apps/ops-web.");
}

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exit(1);
}

const repo = detectRepo();
const target = path.join(
  repo,
  "AC_CAPITAL_OS_MZ16_FINAL_INSTITUTIONAL_COMMAND_EXPERIENCE",
  "scripts",
  "verify_ac_capital_os_mz16.mjs",
);

if (!exists(target)) fail("MZ16 verifier is missing.");

const content = fs.readFileSync(target, "utf8");

for (const token of [
  "const aiNormalized = ai.toLowerCase();",
  '"provider"',
  '"workspace"',
  '"linked skills"',
  '"governed"',
]) {
  if (!content.includes(token)) fail(`corrected verifier missing token: ${token}`);
}

if (content.includes('"Linked skills"')) {
  fail("obsolete case-sensitive Linked skills token still remains");
}

console.log("MZ16_VERIFIER_CASE_SENSITIVITY_FIX_VERIFIED");
console.log("The MZ16 verifier now checks AI hydration labels case-insensitively.");
console.log("Next: node ./AC_CAPITAL_OS_MZ16_FINAL_INSTITUTIONAL_COMMAND_EXPERIENCE/scripts/verify_ac_capital_os_mz16.mjs");
