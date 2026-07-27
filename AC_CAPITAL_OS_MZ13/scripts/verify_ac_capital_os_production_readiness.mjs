import fs from "node:fs";
import path from "node:path";

const cwd = process.cwd();
function exists(p) { return fs.existsSync(p); }
function findRoots(start) {
  const opsFromRepo = path.join(start, "apps", "ops-web");
  if (exists(opsFromRepo)) return { mode: "repository-root", repoRoot: start, opsRoot: opsFromRepo };
  if (exists(path.join(start, "app")) && exists(path.join(start, "package.json"))) return { mode: "ops-web-root", repoRoot: path.resolve(start, "..", ".."), opsRoot: start };
  throw new Error("Run from repo root or apps/ops-web");
}
function assert(condition, message) { if (!condition) { console.error(`FAIL: ${message}`); process.exit(1); } }
const { repoRoot, opsRoot } = findRoots(cwd);

const requiredScripts = [
  "verify_ac_capital_os_db_tables.mjs",
  "verify_ac_capital_os_api_contracts.mjs",
  "verify_ac_capital_os_live_api_smoke.mjs",
  "verify_ac_capital_os_storage_contract.mjs",
  "verify_ac_capital_os_ai_provider_bridge.mjs",
  "verify_ac_capital_os_no_secret_leak.mjs",
  "verify_ac_capital_os_production_readiness.mjs",
];
for (const script of requiredScripts) assert(exists(path.join(repoRoot, "AC_CAPITAL_OS_MZ13", "scripts", script)), `missing QA script ${script}`);
assert(exists(path.join(repoRoot, "AC_CAPITAL_OS_MZ13", "docs", "AC_CAPITAL_OS_MZ13_PRODUCTION_ACTIVATION_REPORT.md")), "production activation report missing");
assert(exists(path.join(opsRoot, "lib", "ac-capital-os", "server", "repository.ts")), "repository layer missing");
assert(exists(path.join(opsRoot, "lib", "ac-capital-os", "server", "approval-guard.ts")), "approval guard missing");
console.log("AC_CAPITAL_OS_PRODUCTION_READINESS_STATIC_VERIFIED");
